const fs = require('fs');
const path = require('path');

class GitHubActionsBets {
    constructor() {
        this.userBetsPath = 'data/user-bets.json';
        this.filteredLogsPath = 'data/filtered-logs.json';
    }

    // Load user bets from local file (will be synced by GitHub Actions)
    loadUserBets() {
        try {
            if (fs.existsSync(this.userBetsPath)) {
                const data = fs.readFileSync(this.userBetsPath, 'utf8');
                return JSON.parse(data);
            } else {
                return this.createInitialUserBets();
            }
        } catch (error) {
            console.error('Error loading user bets:', error);
            return this.createInitialUserBets();
        }
    }

    // Save user bets to local file (will be committed by GitHub Actions)
    saveUserBets(userBetsData) {
        try {
            const content = JSON.stringify(userBetsData, null, 2);
            fs.writeFileSync(this.userBetsPath, content);
            console.log('✅ User bets saved locally (will be synced to GitHub)');
            return true;
        } catch (error) {
            console.error('Error saving user bets:', error);
            return false;
        }
    }

    // Create initial user-bets.json structure
    createInitialUserBets() {
        return {
            users: {},
            metadata: {
                version: "1.0",
                created: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                totalUsers: 0,
                activeUsers: 0,
                totalActiveBets: 0,
                totalVolume: 0,
                schema: {
                    userProfile: {
                        playerId: "string",
                        username: "string",
                        profile: {
                            joinDate: "ISO date string",
                            totalBets: "number",
                            totalVolume: "number",
                            totalWinnings: "number",
                            totalLosses: "number",
                            netProfit: "number",
                            winRate: "number (0-1)",
                            averageBetSize: "number",
                            largestBet: "number",
                            favoriteFaction: "string",
                            lastActive: "ISO date string"
                        },
                        activeBets: "array of bet objects",
                        betHistory: "array of completed bet objects",
                        statistics: "object with various betting statistics",
                        preferences: "object with user betting preferences"
                    }
                }
            }
        };
    }

    // Add a new bet to the system
    addBet(betData) {
        try {
            console.log('🎯 Adding bet locally:', betData.betId);
            
            const userBetsData = this.loadUserBets();
            const playerId = betData.playerId;
            
            // Initialize user if doesn't exist
            if (!userBetsData.users[playerId]) {
                userBetsData.users[playerId] = {
                    playerId: playerId,
                    username: betData.playerName || `Player${playerId}`,
                    profile: {
                        joinDate: new Date().toISOString(),
                        totalBets: 0,
                        totalVolume: 0,
                        totalWinnings: 0,
                        totalLosses: 0,
                        netProfit: 0,
                        winRate: 0,
                        averageBetSize: 0,
                        largestBet: 0,
                        favoriteFaction: "",
                        lastActive: new Date().toISOString()
                    },
                    activeBets: [],
                    betHistory: [],
                    statistics: {
                        byWar: {},
                        byFaction: {},
                        byMonth: {},
                        byWeek: {},
                        byDay: {}
                    },
                    preferences: {
                        defaultBetSize: 1000000,
                        favoriteFactions: [],
                        riskTolerance: "medium",
                        autoBetting: false,
                        notifications: {
                            betResults: true,
                            newWars: true,
                            oddsChanges: false
                        }
                    }
                };
            } else {
                // Update username if real name provided
                if (betData.playerName && userBetsData.users[playerId].username !== betData.playerName) {
                    console.log(`🔄 Updating username for player ${playerId}: ${userBetsData.users[playerId].username} → ${betData.playerName}`);
                    userBetsData.users[playerId].username = betData.playerName;
                }
            }

            // Create bet object
            const betObject = {
                betId: betData.betId,
                warId: betData.warId,
                factionId: betData.factionId,
                factionName: betData.factionName,
                xanaxAmount: betData.xanaxAmount,
                betAmount: betData.betAmount,
                odds: betData.odds,
                potentialPayout: Math.round(betData.betAmount * betData.odds),
                status: "pending",
                timestamp: betData.timestamp,
                placedAt: new Date().toISOString(),
                resolvedAt: null,
                actualPayout: null,
                profit: null
            };

            // Add bet to user's active bets
            userBetsData.users[playerId].activeBets.push(betObject);
            
            // Update user statistics
            userBetsData.users[playerId].profile.totalBets++;
            userBetsData.users[playerId].profile.totalVolume += betData.betAmount;
            userBetsData.users[playerId].profile.lastActive = new Date().toISOString();
            
            // Update global metadata
            userBetsData.metadata.lastUpdated = new Date().toISOString();
            userBetsData.metadata.totalActiveBets++;
            userBetsData.metadata.totalVolume += betData.betAmount;

            // Save locally
            this.saveUserBets(userBetsData);
            
            console.log('✅ Bet successfully added locally');
            return betObject;
        } catch (error) {
            console.error('❌ Error adding bet locally:', error.message);
            throw error;
        }
    }

    // Confirm a bet (update status from pending to confirmed)
    confirmBet(betId, playerId) {
        try {
            console.log('✅ Confirming bet:', betId, 'for player:', playerId);
            
            const userBetsData = this.loadUserBets();
            
            if (!userBetsData.users[playerId]) {
                throw new Error(`User ${playerId} not found`);
            }

            const user = userBetsData.users[playerId];
            const betIndex = user.activeBets.findIndex(bet => bet.betId === betId);
            
            if (betIndex === -1) {
                throw new Error(`Bet ${betId} not found for user ${playerId}`);
            }

            // Update bet status
            user.activeBets[betIndex].status = "confirmed";
            user.activeBets[betIndex].confirmedAt = new Date().toISOString();
            
            // Update global metadata
            userBetsData.metadata.lastUpdated = new Date().toISOString();

            // Save locally
            this.saveUserBets(userBetsData);
            
            console.log('✅ Bet successfully confirmed locally');
            return user.activeBets[betIndex];
        } catch (error) {
            console.error('❌ Error confirming bet locally:', error.message);
            throw error;
        }
    }

    // Get filtered logs from local file
    getFilteredLogs() {
        try {
            if (fs.existsSync(this.filteredLogsPath)) {
                const data = fs.readFileSync(this.filteredLogsPath, 'utf8');
                return JSON.parse(data);
            } else {
                return { logs: {}, metadata: {} };
            }
        } catch (error) {
            console.error('Error loading filtered logs:', error);
            return { logs: {}, metadata: {} };
        }
    }
}

module.exports = GitHubActionsBets; 