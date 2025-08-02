const axios = require('axios');
const fs = require('fs');
const path = require('path');

class GitHubBetsAPI {
    constructor() {
        this.token = process.env.GITHUB_TOKEN;
        this.owner = 'Lofi-Sol';
        this.repo = 'BDashboard';
        this.baseURL = 'https://api.github.com';
        
        if (!this.token) {
            console.error('❌ GITHUB_TOKEN environment variable is not set');
            console.log('Please set your GitHub token: export GITHUB_TOKEN=your_token_here');
            process.exit(1);
        }
        
        this.headers = {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'BDashboard-Betting-System'
        };
    }

    // Get current user-bets.json from GitHub
    async getUserBets() {
        try {
            const response = await axios.get(
                `${this.baseURL}/repos/${this.owner}/${this.repo}/contents/data/user-bets.json`,
                { headers: this.headers }
            );
            
            const content = Buffer.from(response.data.content, 'base64').toString('utf8');
            return JSON.parse(content);
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('📁 user-bets.json not found on GitHub, creating new file...');
                return this.createInitialUserBets();
            }
            throw error;
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

    // Update user-bets.json on GitHub
    async updateUserBets(userBetsData) {
        try {
            // Get current file to get the SHA
            const currentFile = await axios.get(
                `${this.baseURL}/repos/${this.owner}/${this.repo}/contents/data/user-bets.json`,
                { headers: this.headers }
            );

            const content = JSON.stringify(userBetsData, null, 2);
            const encodedContent = Buffer.from(content).toString('base64');

            const response = await axios.put(
                `${this.baseURL}/repos/${this.owner}/${this.repo}/contents/data/user-bets.json`,
                {
                    message: `🤖 Auto-update user bets - ${new Date().toISOString()}`,
                    content: encodedContent,
                    sha: currentFile.data.sha
                },
                { headers: this.headers }
            );

            console.log('✅ Successfully updated user-bets.json on GitHub');
            return response.data;
        } catch (error) {
            console.error('❌ Error updating user-bets.json on GitHub:', error.message);
            throw error;
        }
    }

    // Add a new bet to the system
    async addBet(betData) {
        try {
            console.log('🎯 Adding bet to GitHub:', betData.betId);
            
            const userBetsData = await this.getUserBets();
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

            // Update GitHub
            await this.updateUserBets(userBetsData);
            
            console.log('✅ Bet successfully added to GitHub');
            return betObject;
        } catch (error) {
            console.error('❌ Error adding bet to GitHub:', error.message);
            throw error;
        }
    }

    // Confirm a bet (update status from pending to confirmed)
    async confirmBet(betId, playerId) {
        try {
            console.log('✅ Confirming bet:', betId, 'for player:', playerId);
            
            const userBetsData = await this.getUserBets();
            
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

            // Update GitHub
            await this.updateUserBets(userBetsData);
            
            console.log('✅ Bet successfully confirmed on GitHub');
            return user.activeBets[betIndex];
        } catch (error) {
            console.error('❌ Error confirming bet on GitHub:', error.message);
            throw error;
        }
    }

    // Get filtered logs from GitHub
    async getFilteredLogs() {
        try {
            const response = await axios.get(
                `${this.baseURL}/repos/${this.owner}/${this.repo}/contents/data/filtered-logs.json`,
                { headers: this.headers }
            );
            
            const content = Buffer.from(response.data.content, 'base64').toString('utf8');
            return JSON.parse(content);
        } catch (error) {
            console.error('❌ Error getting filtered logs from GitHub:', error.message);
            return { logs: {}, metadata: {} };
        }
    }
}

module.exports = GitHubBetsAPI; 