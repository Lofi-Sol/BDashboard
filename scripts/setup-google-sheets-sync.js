const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Configuration
const CREDENTIALS_FILE = 'google-sheets-credentials.json';
const TOKEN_FILE = 'google-sheets-token.json';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

class GoogleSheetsSync {
    constructor() {
        this.auth = null;
        this.sheets = null;
        this.spreadsheetId = null;
    }

    // Initialize Google Sheets API
    async initialize() {
        try {
            // Check if credentials file exists
            if (!fs.existsSync(CREDENTIALS_FILE)) {
                console.log('❌ Google Sheets credentials not found!');
                console.log('📋 To set up Google Sheets API:');
                console.log('   1. Go to https://console.developers.google.com/');
                console.log('   2. Create a new project or select existing one');
                console.log('   3. Enable Google Sheets API');
                console.log('   4. Create credentials (Service Account)');
                console.log('   5. Download JSON credentials file');
                console.log('   6. Save as "google-sheets-credentials.json" in this directory');
                return false;
            }

            const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
            
            // For service account authentication
            this.auth = new google.auth.GoogleAuth({
                credentials,
                scopes: SCOPES
            });

            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            console.log('✅ Google Sheets API initialized successfully!');
            return true;
        } catch (error) {
            console.error('❌ Error initializing Google Sheets API:', error.message);
            return false;
        }
    }

    // Create a new Google Sheet
    async createSpreadsheet(title = 'Betting Dashboard Data') {
        try {
            const resource = {
                properties: {
                    title: title
                },
                sheets: [
                    { properties: { title: 'User Profiles', gridProperties: { rowCount: 1000, columnCount: 20 } } },
                    { properties: { title: 'Active Bets', gridProperties: { rowCount: 1000, columnCount: 20 } } },
                    { properties: { title: 'Faction Statistics', gridProperties: { rowCount: 1000, columnCount: 20 } } },
                    { properties: { title: 'User Preferences', gridProperties: { rowCount: 1000, columnCount: 20 } } },
                    { properties: { title: 'Summary Statistics', gridProperties: { rowCount: 1000, columnCount: 20 } } }
                ]
            };

            const response = await this.sheets.spreadsheets.create({
                resource,
                fields: 'spreadsheetId'
            });

            this.spreadsheetId = response.data.spreadsheetId;
            
            // Save spreadsheet ID for future use
            fs.writeFileSync('spreadsheet-id.txt', this.spreadsheetId);
            
            console.log('✅ Created new Google Sheet!');
            console.log(`📊 Spreadsheet ID: ${this.spreadsheetId}`);
            console.log(`🔗 URL: https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`);
            
            return this.spreadsheetId;
        } catch (error) {
            console.error('❌ Error creating spreadsheet:', error.message);
            return null;
        }
    }

    // Load existing spreadsheet ID
    loadSpreadsheetId() {
        try {
            if (fs.existsSync('spreadsheet-id.txt')) {
                this.spreadsheetId = fs.readFileSync('spreadsheet-id.txt', 'utf8').trim();
                console.log(`📊 Using existing spreadsheet: ${this.spreadsheetId}`);
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    // Convert data to CSV format for Google Sheets
    convertToCSVData(data, headers) {
        const csvData = [headers];
        
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                return value !== undefined ? value : '';
            });
            csvData.push(values);
        });
        
        return csvData;
    }

    // Update a specific sheet with data
    async updateSheet(sheetName, data, headers) {
        try {
            const csvData = this.convertToCSVData(data, headers);
            
            // Clear existing data
            await this.sheets.spreadsheets.values.clear({
                spreadsheetId: this.spreadsheetId,
                range: sheetName
            });

            // Update with new data
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!A1`,
                valueInputOption: 'RAW',
                resource: {
                    values: csvData
                }
            });

            console.log(`✅ Updated sheet: ${sheetName}`);
        } catch (error) {
            console.error(`❌ Error updating sheet ${sheetName}:`, error.message);
        }
    }

    // Sync all data to Google Sheets
    async syncToGoogleSheets() {
        try {
            if (!this.spreadsheetId) {
                if (!this.loadSpreadsheetId()) {
                    console.log('📊 Creating new Google Sheet...');
                    await this.createSpreadsheet();
                }
            }

            if (!this.spreadsheetId) {
                console.error('❌ No spreadsheet ID available');
                return;
            }

            // Read JSON data
            const jsonPath = path.join(__dirname, '../data/user-bets.json');
            const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

            // 1. User Profiles
            const userProfiles = [];
            for (const [playerId, userData] of Object.entries(jsonData.users)) {
                const profile = {
                    playerId: userData.playerId,
                    username: userData.username,
                    joinDate: userData.profile.joinDate,
                    totalBets: userData.profile.totalBets,
                    totalVolume: userData.profile.totalVolume,
                    totalWinnings: userData.profile.totalWinnings,
                    totalLosses: userData.profile.totalLosses,
                    netProfit: userData.profile.netProfit,
                    winRate: userData.profile.winRate,
                    averageBetSize: userData.profile.averageBetSize,
                    largestBet: userData.profile.largestBet,
                    favoriteFaction: userData.profile.favoriteFaction,
                    lastActive: userData.profile.lastActive
                };
                userProfiles.push(profile);
            }

            const profileHeaders = [
                'playerId', 'username', 'joinDate', 'totalBets', 'totalVolume', 
                'totalWinnings', 'totalLosses', 'netProfit', 'winRate', 
                'averageBetSize', 'largestBet', 'favoriteFaction', 'lastActive'
            ];

            await this.updateSheet('User Profiles', userProfiles, profileHeaders);

            // 2. Active Bets
            const activeBets = [];
            for (const [playerId, userData] of Object.entries(jsonData.users)) {
                for (const bet of userData.activeBets) {
                    const betData = {
                        playerId: userData.playerId,
                        username: userData.username,
                        betId: bet.betId,
                        warId: bet.warId,
                        factionId: bet.factionId,
                        factionName: bet.factionName,
                        xanaxAmount: bet.xanaxAmount,
                        betAmount: bet.betAmount,
                        odds: bet.odds,
                        potentialPayout: bet.potentialPayout,
                        status: bet.status,
                        timestamp: bet.timestamp,
                        placedAt: bet.placedAt
                    };
                    activeBets.push(betData);
                }
            }

            const betHeaders = [
                'playerId', 'username', 'betId', 'warId', 'factionId', 'factionName',
                'xanaxAmount', 'betAmount', 'odds', 'potentialPayout', 'status',
                'timestamp', 'placedAt'
            ];

            await this.updateSheet('Active Bets', activeBets, betHeaders);

            // 3. Faction Statistics
            const factionStats = [];
            for (const [playerId, userData] of Object.entries(jsonData.users)) {
                for (const [factionId, stats] of Object.entries(userData.statistics.byFaction)) {
                    const statData = {
                        playerId: userData.playerId,
                        username: userData.username,
                        factionId: factionId,
                        factionName: stats.factionName,
                        totalBets: stats.totalBets,
                        totalVolume: stats.totalVolume,
                        wins: stats.wins,
                        losses: stats.losses,
                        winRate: stats.winRate
                    };
                    factionStats.push(statData);
                }
            }

            const factionHeaders = [
                'playerId', 'username', 'factionId', 'factionName', 'totalBets',
                'totalVolume', 'wins', 'losses', 'winRate'
            ];

            await this.updateSheet('Faction Statistics', factionStats, factionHeaders);

            // 4. User Preferences
            const userPreferences = [];
            for (const [playerId, userData] of Object.entries(jsonData.users)) {
                const prefs = {
                    playerId: userData.playerId,
                    username: userData.username,
                    defaultBetSize: userData.preferences.defaultBetSize,
                    favoriteFactions: JSON.stringify(userData.preferences.favoriteFactions),
                    riskTolerance: userData.preferences.riskTolerance,
                    autoBetting: userData.preferences.autoBetting,
                    notifications_betResults: userData.preferences.notifications.betResults,
                    notifications_newWars: userData.preferences.notifications.newWars,
                    notifications_oddsChanges: userData.preferences.notifications.oddsChanges
                };
                userPreferences.push(prefs);
            }

            const prefHeaders = [
                'playerId', 'username', 'defaultBetSize', 'favoriteFactions',
                'riskTolerance', 'autoBetting', 'notifications_betResults',
                'notifications_newWars', 'notifications_oddsChanges'
            ];

            await this.updateSheet('User Preferences', userPreferences, prefHeaders);

            // 5. Summary Statistics
            const summaryData = [{
                totalUsers: jsonData.metadata.totalUsers,
                activeUsers: jsonData.metadata.activeUsers,
                totalActiveBets: jsonData.metadata.totalActiveBets,
                totalVolume: jsonData.metadata.totalVolume,
                created: jsonData.metadata.created,
                lastUpdated: jsonData.metadata.lastUpdated
            }];

            const summaryHeaders = [
                'totalUsers', 'activeUsers', 'totalActiveBets', 'totalVolume',
                'created', 'lastUpdated'
            ];

            await this.updateSheet('Summary Statistics', summaryData, summaryHeaders);

            console.log('✅ All data synced to Google Sheets successfully!');
            console.log(`🔗 View your sheet: https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`);

        } catch (error) {
            console.error('❌ Error syncing to Google Sheets:', error.message);
        }
    }
}

// Main execution
async function main() {
    const sync = new GoogleSheetsSync();
    
    if (await sync.initialize()) {
        await sync.syncToGoogleSheets();
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = GoogleSheetsSync; 