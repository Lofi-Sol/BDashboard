const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Configuration
const CREDENTIALS_FILE = 'google-sheets-credentials.json';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

class UserFacingSheetsSync {
    constructor() {
        this.auth = null;
        this.sheets = null;
        this.spreadsheetId = null;
    }

    // Initialize Google Sheets API
    async initialize() {
        try {
            if (!fs.existsSync(CREDENTIALS_FILE)) {
                console.log('❌ Google Sheets credentials not found!');
                return false;
            }

            const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
            
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

    // Load user-facing spreadsheet ID
    loadSpreadsheetId() {
        try {
            if (fs.existsSync('user-facing-spreadsheet-id.txt')) {
                this.spreadsheetId = fs.readFileSync('user-facing-spreadsheet-id.txt', 'utf8').trim();
                console.log(`📊 Using user-facing spreadsheet: ${this.spreadsheetId}`);
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
                range: `'${sheetName}'`
            });

            // Update with new data
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `'${sheetName}'!A1`,
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

    // Sync all data to user-facing Google Sheets
    async syncToUserFacingSheets() {
        try {
            if (!this.loadSpreadsheetId()) {
                console.error('❌ No user-facing spreadsheet ID available');
                return;
            }

            // Read JSON data
            const jsonPath = path.join(__dirname, '../data/user-bets.json');
            if (!fs.existsSync(jsonPath)) {
                console.error('❌ user-bets.json not found');
                return;
            }

            const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

            // 1. Confirmed Bets
            const confirmedBets = [];
            for (const [playerId, userData] of Object.entries(jsonData.users)) {
                for (const bet of userData.activeBets) {
                    if (bet.status === 'confirmed') {
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
                        confirmedBets.push(betData);
                    }
                }
            }

            const confirmedBetHeaders = [
                'playerId', 'username', 'betId', 'warId', 'factionId', 'factionName',
                'xanaxAmount', 'betAmount', 'odds', 'potentialPayout', 'status',
                'timestamp', 'placedAt'
            ];

            await this.updateSheet('Confirmed Bets', confirmedBets, confirmedBetHeaders);

            // 2. Pending Bets
            const pendingBets = [];
            for (const [playerId, userData] of Object.entries(jsonData.users)) {
                for (const bet of userData.activeBets) {
                    if (bet.status === 'pending') {
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
                        pendingBets.push(betData);
                    }
                }
            }

            await this.updateSheet('Pending Bets', pendingBets, confirmedBetHeaders);

            // 3. User Statistics
            const userStats = [];
            for (const [playerId, userData] of Object.entries(jsonData.users)) {
                const stats = {
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
                userStats.push(stats);
            }

            const userStatsHeaders = [
                'playerId', 'username', 'joinDate', 'totalBets', 'totalVolume', 
                'totalWinnings', 'totalLosses', 'netProfit', 'winRate', 
                'averageBetSize', 'largestBet', 'favoriteFaction', 'lastActive'
            ];

            await this.updateSheet('User Statistics', userStats, userStatsHeaders);

            // 4. Bet History (all bets including completed ones)
            const betHistory = [];
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
                    betHistory.push(betData);
                }
            }

            await this.updateSheet('Bet History', betHistory, confirmedBetHeaders);

            // 5. Faction Performance
            const factionPerformance = [];
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
                    factionPerformance.push(statData);
                }
            }

            const factionHeaders = [
                'playerId', 'username', 'factionId', 'factionName', 'totalBets',
                'totalVolume', 'wins', 'losses', 'winRate'
            ];

            await this.updateSheet('Faction Performance', factionPerformance, factionHeaders);

            console.log('✅ All data synced to user-facing Google Sheets successfully!');
            console.log(`🔗 View your sheet: https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`);

        } catch (error) {
            console.error('❌ Error syncing to user-facing Google Sheets:', error.message);
        }
    }
}

// Main execution
async function main() {
    const sync = new UserFacingSheetsSync();
    
    if (await sync.initialize()) {
        await sync.syncToUserFacingSheets();
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = UserFacingSheetsSync;
