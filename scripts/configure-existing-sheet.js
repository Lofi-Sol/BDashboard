const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

class GoogleSheetsSync {
    constructor() {
        this.auth = null;
        this.sheets = null;
        this.spreadsheetId = null;
    }

    async initialize() {
        try {
            const credentials = JSON.parse(fs.readFileSync('google-sheets-credentials.json', 'utf8'));
            
            this.auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });

            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            console.log('✅ Google Sheets API initialized successfully!');
            return true;
        } catch (error) {
            console.error('❌ Error initializing Google Sheets API:', error.message);
            return false;
        }
    }

    async configureExistingSheet(spreadsheetId) {
        try {
            this.spreadsheetId = spreadsheetId;
            
            // Save spreadsheet ID for future use
            fs.writeFileSync('spreadsheet-id.txt', this.spreadsheetId);
            
            console.log(`✅ Configured existing spreadsheet: ${this.spreadsheetId}`);
            console.log(`🔗 URL: https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`);
            
            // Test the connection by reading the sheet
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId,
                ranges: ['A1:A1'],
                fields: 'properties.title'
            });
            
            console.log(`📊 Sheet title: ${response.data.properties.title}`);
            console.log('✅ Connection successful!');
            
            return true;
        } catch (error) {
            console.error('❌ Error configuring spreadsheet:', error.message);
            console.log('💡 Make sure you have:');
            console.log('   1. Created a Google Sheet manually');
            console.log('   2. Shared it with the service account email');
            console.log('   3. Used the correct spreadsheet ID');
            return false;
        }
    }

    async syncToGoogleSheets() {
        try {
            if (!this.spreadsheetId) {
                console.error('❌ No spreadsheet ID configured');
                return;
            }

            // Read JSON data
            const jsonPath = path.join(__dirname, '../data/user-bets.json');
            const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

            // Create sheets if they don't exist
            await this.createSheetsIfNeeded();

            // Sync data to sheets
            await this.updateAllSheets(jsonData);

            console.log('✅ All data synced to Google Sheets successfully!');
            console.log(`🔗 View your sheet: https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`);

        } catch (error) {
            console.error('❌ Error syncing to Google Sheets:', error.message);
        }
    }

    async createSheetsIfNeeded() {
        try {
            const sheetNames = ['User Profiles', 'Active Bets', 'Faction Statistics', 'User Preferences', 'Summary Statistics'];
            
            // Get existing sheets
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId,
                fields: 'sheets.properties.title'
            });
            
            const existingSheets = response.data.sheets.map(sheet => sheet.properties.title);
            const missingSheets = sheetNames.filter(name => !existingSheets.includes(name));
            
            if (missingSheets.length > 0) {
                console.log(`📝 Creating missing sheets: ${missingSheets.join(', ')}`);
                
                const requests = missingSheets.map(sheetName => ({
                    addSheet: {
                        properties: {
                            title: sheetName,
                            gridProperties: { rowCount: 1000, columnCount: 20 }
                        }
                    }
                }));
                
                await this.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: this.spreadsheetId,
                    resource: { requests }
                });
                
                console.log('✅ Sheets created successfully!');
            }
        } catch (error) {
            console.error('❌ Error creating sheets:', error.message);
        }
    }

    async updateAllSheets(jsonData) {
        // Update each sheet with data
        await this.updateUserProfiles(jsonData);
        await this.updateActiveBets(jsonData);
        await this.updateFactionStatistics(jsonData);
        await this.updateUserPreferences(jsonData);
        await this.updateSummaryStatistics(jsonData);
    }

    async updateUserProfiles(jsonData) {
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

        const headers = ['playerId', 'username', 'joinDate', 'totalBets', 'totalVolume', 'totalWinnings', 'totalLosses', 'netProfit', 'winRate', 'averageBetSize', 'largestBet', 'favoriteFaction', 'lastActive'];
        await this.updateSheet('User Profiles', userProfiles, headers);
    }

    async updateActiveBets(jsonData) {
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

        const headers = ['playerId', 'username', 'betId', 'warId', 'factionId', 'factionName', 'xanaxAmount', 'betAmount', 'odds', 'potentialPayout', 'status', 'timestamp', 'placedAt'];
        await this.updateSheet('Active Bets', activeBets, headers);
    }

    async updateFactionStatistics(jsonData) {
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

        const headers = ['playerId', 'username', 'factionId', 'factionName', 'totalBets', 'totalVolume', 'wins', 'losses', 'winRate'];
        await this.updateSheet('Faction Statistics', factionStats, headers);
    }

    async updateUserPreferences(jsonData) {
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

        const headers = ['playerId', 'username', 'defaultBetSize', 'favoriteFactions', 'riskTolerance', 'autoBetting', 'notifications_betResults', 'notifications_newWars', 'notifications_oddsChanges'];
        await this.updateSheet('User Preferences', userPreferences, headers);
    }

    async updateSummaryStatistics(jsonData) {
        const summaryData = [{
            totalUsers: jsonData.metadata.totalUsers,
            activeUsers: jsonData.metadata.activeUsers,
            totalActiveBets: jsonData.metadata.totalActiveBets,
            totalVolume: jsonData.metadata.totalVolume,
            created: jsonData.metadata.created,
            lastUpdated: jsonData.metadata.lastUpdated
        }];

        const headers = ['totalUsers', 'activeUsers', 'totalActiveBets', 'totalVolume', 'created', 'lastUpdated'];
        await this.updateSheet('Summary Statistics', summaryData, headers);
    }

    async updateSheet(sheetName, data, headers) {
        try {
            const csvData = [headers];
            
            data.forEach(row => {
                const values = headers.map(header => {
                    const value = row[header];
                    return value !== undefined ? value : '';
                });
                csvData.push(values);
            });

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
                resource: { values: csvData }
            });

            console.log(`✅ Updated sheet: ${sheetName}`);
        } catch (error) {
            console.error(`❌ Error updating sheet ${sheetName}:`, error.message);
        }
    }
}

// Main execution
async function main() {
    const sync = new GoogleSheetsSync();
    
    if (await sync.initialize()) {
        // Check if spreadsheet ID is provided as argument
        const spreadsheetId = process.argv[2];
        
        if (spreadsheetId) {
            console.log(`📊 Configuring existing spreadsheet: ${spreadsheetId}`);
            if (await sync.configureExistingSheet(spreadsheetId)) {
                await sync.syncToGoogleSheets();
            }
        } else {
            console.log('📋 Usage:');
            console.log('   node scripts/configure-existing-sheet.js [SPREADSHEET_ID]');
            console.log('');
            console.log('📋 To get your spreadsheet ID:');
            console.log('   1. Create a new Google Sheet at https://docs.google.com/spreadsheets/');
            console.log('   2. Copy the ID from the URL (between /d/ and /edit)');
            console.log('   3. Share the sheet with your service account email');
            console.log('   4. Run: node scripts/configure-existing-sheet.js YOUR_SPREADSHEET_ID');
        }
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = GoogleSheetsSync; 