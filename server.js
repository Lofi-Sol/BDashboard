const express = require('express');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const TornProfessionalOddsEngine = require('./Betting/odds-engine-v4.js');
const fs = require('fs').promises;
// Load environment variables if dotenv is available
try {
    require('dotenv').config();
} catch (error) {
    console.log('dotenv not available, using system environment variables');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const requestCounts = new Map();
const RATE_LIMIT = 50; // Max requests per minute per API key
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://oowol003:TornData2341@torndata.vxouoj6.mongodb.net/?retryWrites=true&w=majority&appName=TornData';
const DATABASE_NAME = 'torn_data';
const COLLECTION_NAME = 'factions';

let mongoClient = null;
let oddsEngine = null; // Singleton decimal odds engine instance

// Centralized data file paths
const BETS_FILE = './data/bets.json';

// Initialize centralized data files
async function initializeDataFiles() {
    try {
        // Create data directory if it doesn't exist
        await fs.mkdir('./data', { recursive: true });
        
        // Initialize bets.json if it doesn't exist
        try {
            await fs.access(BETS_FILE);
        } catch {
            const initialBetsData = {
                active_bets: [],
                completed_bets: [],
                statistics: {
                    total_bets: 0,
                    total_volume: 0,
                    pending_bets: 0,
                    confirmed_bets: 0,
                    won_bets: 0,
                    lost_bets: 0,
                    total_payouts: 0,
                    total_profit: 0,
                    last_updated: null
                },
                metadata: {
                    version: "1.0",
                    last_updated: new Date().toISOString(),
                    total_users: 0,
                    active_users: 0
                }
            };
            await fs.writeFile(BETS_FILE, JSON.stringify(initialBetsData, null, 2));
            console.log('✅ Initialized bets.json');
        }
        

        
        console.log('✅ Centralized data files initialized');
    } catch (error) {
        console.error('❌ Error initializing data files:', error);
    }
}

// Load centralized bet data
async function loadBetData() {
    try {
        const data = await fs.readFile(BETS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading bet data:', error);
        return null;
    }
}

// Save centralized bet data
async function saveBetData(data) {
    try {
        data.metadata.last_updated = new Date().toISOString();
        await fs.writeFile(BETS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving bet data:', error);
        return false;
    }
}

// Load user bets data
async function loadUserBetsData() {
    try {
        const data = await fs.readFile('data/user-bets.json', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading user bets data:', error);
        // Return default structure if file doesn't exist
        return {
            users: {},
            metadata: {
                version: "1.0",
                created: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                totalUsers: 0,
                activeUsers: 0,
                totalActiveBets: 0,
                totalVolume: 0
            }
        };
    }
}

// Save user bets data
async function saveUserBetsData(data) {
    try {
        data.metadata.lastUpdated = new Date().toISOString();
        await fs.writeFile('data/user-bets.json', JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving user bets data:', error);
        return false;
    }
}

// Add bet to user's profile
async function addBetToUserProfile(betData) {
    try {
        const userBetsData = await loadUserBetsData();
        const playerId = betData.playerId.toString();
        
        // Initialize user if doesn't exist
        if (!userBetsData.users[playerId]) {
            userBetsData.users[playerId] = {
                playerId: playerId,
                username: betData.playerName || `Player${playerId}`, // Use real name if provided
                profile: {
                    joinDate: new Date().toISOString(),
                    totalBets: 0,
                    totalVolume: 0,
                    totalWinnings: 0,
                    totalLosses: 0,
                    netProfit: 0,
                    winRate: 0.0,
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
            // Update username for existing user if real name is provided
            if (betData.playerName && userBetsData.users[playerId].username !== betData.playerName) {
                console.log(`🔄 Updating username for player ${playerId}: ${userBetsData.users[playerId].username} → ${betData.playerName}`);
                userBetsData.users[playerId].username = betData.playerName;
            } else {
                console.log(`ℹ️  No username update needed for player ${playerId}:`);
                console.log(`   - Current username: ${userBetsData.users[playerId].username}`);
                console.log(`   - Received playerName: ${betData.playerName}`);
            }
        }
        
        const user = userBetsData.users[playerId];
        
        // Create enhanced bet object for user profile
        const enhancedBet = {
            betId: betData.betId,
            warId: betData.warId,
            factionId: betData.factionId,
            factionName: betData.factionName,
            xanaxAmount: betData.xanaxAmount,
            betAmount: betData.betAmount,
            odds: betData.odds,
            potentialPayout: Math.round(betData.betAmount * betData.odds),
            status: betData.status,
            timestamp: betData.timestamp,
            placedAt: new Date(betData.timestamp).toISOString()
        };
        
        // Add to active bets
        user.activeBets.unshift(enhancedBet);
        
        // Update user profile statistics
        user.profile.totalBets++;
        user.profile.totalVolume += betData.betAmount || 0;
        user.profile.lastActive = new Date().toISOString();
        
        // Update average bet size
        user.profile.averageBetSize = Math.round(user.profile.totalVolume / user.profile.totalBets);
        
        // Update largest bet
        if ((betData.betAmount || 0) > user.profile.largestBet) {
            user.profile.largestBet = betData.betAmount || 0;
        }
        
        // Update favorite faction
        updateFavoriteFaction(user, betData.factionId, betData.factionName);
        
        // Update faction statistics
        updateFactionStatistics(user, betData.factionId, betData.factionName, betData.betAmount);
        
        // Update global metadata
        userBetsData.metadata.totalActiveBets++;
        userBetsData.metadata.totalVolume += betData.betAmount || 0;
        userBetsData.metadata.totalUsers = Object.keys(userBetsData.users).length;
        userBetsData.metadata.activeUsers = Object.values(userBetsData.users).filter(u => u.activeBets.length > 0).length;
        
        return await saveUserBetsData(userBetsData);
    } catch (error) {
        console.error('Error adding bet to user profile:', error);
        return false;
    }
}

// Update favorite faction based on betting frequency
function updateFavoriteFaction(user, factionId, factionName) {
    if (!user.statistics.byFaction[factionId]) {
        user.statistics.byFaction[factionId] = {
            factionName: factionName,
            totalBets: 0,
            totalVolume: 0,
            wins: 0,
            losses: 0,
            winRate: 0.0
        };
    }
    
    const factionStats = user.statistics.byFaction[factionId];
    factionStats.totalBets++;
    factionStats.totalVolume += user.profile.totalVolume;
    
    // Find faction with most bets
    let maxBets = 0;
    let favoriteFaction = "";
    
    for (const [fid, stats] of Object.entries(user.statistics.byFaction)) {
        if (stats.totalBets > maxBets) {
            maxBets = stats.totalBets;
            favoriteFaction = stats.factionName;
        }
    }
    
    user.profile.favoriteFaction = favoriteFaction;
}

// Update faction statistics
function updateFactionStatistics(user, factionId, factionName, betAmount) {
    if (!user.statistics.byFaction[factionId]) {
        user.statistics.byFaction[factionId] = {
            factionName: factionName,
            totalBets: 0,
            totalVolume: 0,
            wins: 0,
            losses: 0,
            winRate: 0.0
        };
    }
    
    const factionStats = user.statistics.byFaction[factionId];
    factionStats.totalBets++;
    factionStats.totalVolume += betAmount || 0;
}

// Add new bet to user profile (manual bet placement only)
async function addBet(betData) {
    try {
        // This function is ONLY for manual bet placement through the dashboard
        // It should NOT be called from log processing scripts
        console.log('📝 Adding manual bet to user profile:', betData.betId);
        
        // Use the bet ID provided by the frontend (don't generate a new one)
        if (!betData.betId) {
            console.error('❌ No bet ID provided by frontend');
            return false;
        }
        
        console.log('📝 Using bet ID from frontend:', betData.betId);
        console.log('📝 Bet data received:', {
            betId: betData.betId,
            playerId: betData.playerId,
            playerName: betData.playerName,
            warId: betData.warId,
            factionId: betData.factionId
        });
        
        // Add timestamp if not provided
        if (!betData.timestamp) {
            betData.timestamp = Date.now();
        }
        
        // Ensure bet starts with "pending" status
        betData.status = 'pending';
        
        // Save to user-bets.json only (not centralized storage)
        const userBetSaved = await addBetToUserProfile(betData);
        
        if (userBetSaved) {
            console.log('✅ Manual bet saved to user profile successfully');
        }
        
        return userBetSaved;
    } catch (error) {
        console.error('Error adding manual bet:', error);
        return false;
    }
}

// Confirm bet (move from pending to confirmed)
async function confirmBet(betId, logData) {
    try {
        console.log('🔍 Confirming bet:', betId);
        
        // Load user bets data
        const userBetsData = await loadUserBetsData();
        if (!userBetsData) return false;
        
        let betFound = false;
        let userUpdated = false;
        
        // Find the bet in user profiles
        Object.values(userBetsData.users).forEach(user => {
            if (!user.activeBets) return;
            
            const betIndex = user.activeBets.findIndex(bet => bet.betId === betId);
            if (betIndex !== -1) {
                const bet = user.activeBets[betIndex];
                
                // Only confirm if status is pending
                if (bet.status === 'pending') {
                    bet.status = 'confirmed';
                    bet.confirmedAt = logData.timestamp * 1000;
                    bet.logId = logData.logId;
                    bet.senderId = logData.senderId;
                    bet.confirmedBy = logData.senderId;
                    
                    console.log(`✅ Confirmed bet ${betId} for user ${user.playerId}`);
                    betFound = true;
                    userUpdated = true;
                } else {
                    console.log(`⚠️  Bet ${betId} already has status: ${bet.status}`);
                }
            }
        });
        
        if (!betFound) {
            console.log(`❌ Bet ${betId} not found in any user profile`);
            return false;
        }
        
        if (userUpdated) {
            // Save updated user bets data
            const saveSuccess = await saveUserBetsData(userBetsData);
            if (saveSuccess) {
                console.log('✅ User bets data updated successfully');
                return true;
            } else {
                console.error('❌ Failed to save user bets data');
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error confirming bet:', error);
        return false;
    }
}

// Get user bets
async function getUserBets(playerId) {
    try {
        const data = await loadBetData();
        if (!data) return [];
        
        return data.active_bets.filter(bet => bet.playerId.toString() === playerId.toString());
    } catch (error) {
        console.error('Error getting user bets:', error);
        return [];
    }
}

// Get user profile and bet data
async function getUserProfile(playerId) {
    try {
        const userBetsData = await loadUserBetsData();
        const playerIdStr = playerId.toString();
        
        if (!userBetsData.users[playerIdStr]) {
            return null;
        }
        
        return userBetsData.users[playerIdStr];
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
}

// Resolve bet (move from active to history)
async function resolveBet(betId, result) {
    try {
        // Update centralized bet data
        const betData = await loadBetData();
        if (!betData) return false;
        
        const betIndex = betData.active_bets.findIndex(bet => bet.betId === betId);
        if (betIndex === -1) return false;
        
        const bet = betData.active_bets[betIndex];
        bet.status = result; // 'won' or 'lost'
        bet.resolvedAt = Date.now();
        
        if (result === 'won') {
            bet.actualPayout = Math.round(bet.betAmount * bet.odds);
            bet.profit = bet.actualPayout - bet.betAmount;
            betData.statistics.won_bets++;
            betData.statistics.total_payouts += bet.actualPayout;
            betData.statistics.total_profit += bet.profit;
        } else {
            bet.actualPayout = 0;
            bet.profit = -bet.betAmount;
            betData.statistics.lost_bets++;
            betData.statistics.total_profit -= bet.betAmount;
        }
        
        // Move to completed bets
        betData.completed_bets.unshift(bet);
        betData.active_bets.splice(betIndex, 1);
        
        // Update statistics
        betData.statistics.pending_bets--;
        betData.statistics.last_updated = new Date().toISOString();
        
        const betSaved = await saveBetData(betData);
        
        // Update user profile
        const userBetResolved = await resolveBetInUserProfile(bet, result);
        
        return betSaved && userBetResolved;
    } catch (error) {
        console.error('Error resolving bet:', error);
        return false;
    }
}

// Resolve bet in user profile
async function resolveBetInUserProfile(bet, result) {
    try {
        const userBetsData = await loadUserBetsData();
        const playerId = bet.playerId.toString();
        
        if (!userBetsData.users[playerId]) return false;
        
        const user = userBetsData.users[playerId];
        
        // Find bet in active bets
        const betIndex = user.activeBets.findIndex(b => b.betId === bet.betId);
        if (betIndex === -1) return false;
        
        const userBet = user.activeBets[betIndex];
        userBet.status = result;
        userBet.resolvedAt = new Date().toISOString();
        
        if (result === 'won') {
            userBet.actualPayout = Math.round(bet.betAmount * bet.odds);
            userBet.profit = userBet.actualPayout - bet.betAmount;
            user.profile.totalWinnings += userBet.actualPayout;
            user.profile.netProfit += userBet.profit;
        } else {
            userBet.actualPayout = 0;
            userBet.profit = -bet.betAmount;
            user.profile.totalLosses += bet.betAmount;
            user.profile.netProfit -= bet.betAmount;
        }
        
        // Update win rate
        const totalCompleted = user.profile.totalWinnings + user.profile.totalLosses;
        if (totalCompleted > 0) {
            user.profile.winRate = user.profile.totalWinnings / totalCompleted;
        }
        
        // Move to bet history
        user.betHistory.unshift(userBet);
        user.activeBets.splice(betIndex, 1);
        
        // Update faction statistics
        const factionId = bet.factionId;
        if (user.statistics.byFaction[factionId]) {
            if (result === 'won') {
                user.statistics.byFaction[factionId].wins++;
            } else {
                user.statistics.byFaction[factionId].losses++;
            }
            
            const totalFactionBets = user.statistics.byFaction[factionId].wins + user.statistics.byFaction[factionId].losses;
            if (totalFactionBets > 0) {
                user.statistics.byFaction[factionId].winRate = user.statistics.byFaction[factionId].wins / totalFactionBets;
            }
        }
        
        // Update global metadata
        userBetsData.metadata.totalActiveBets--;
        
        return await saveUserBetsData(userBetsData);
    } catch (error) {
        console.error('Error resolving bet in user profile:', error);
        return false;
    }
}

// Get all bets (for admin dashboard)
async function getAllBets() {
    try {
        const data = await loadBetData();
        if (!data) return { active_bets: [], completed_bets: [] };
        
        return {
            active_bets: data.active_bets,
            completed_bets: data.completed_bets,
            statistics: data.statistics
        };
    } catch (error) {
        console.error('Error getting all bets:', error);
        return { active_bets: [], completed_bets: [] };
    }
}

// Generate unique bet ID
function generateBetId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function connectToMongoDB() {
    try {
        if (!mongoClient) {
            mongoClient = new MongoClient(MONGODB_URI);
            await mongoClient.connect();
            console.log('Connected to MongoDB');
        }
        return mongoClient;
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}

// Initialize decimal odds engine singleton
async function initializeOddsEngine() {
    if (!oddsEngine) {
        try {
            oddsEngine = new TornProfessionalOddsEngine({
    houseEdge: 0.06,
    dollarPerXanax: 744983,
    cacheTime: 300000
});
            await oddsEngine.loadFactionData();
            console.log('Decimal odds engine initialized successfully');
        } catch (error) {
            console.error('Failed to initialize decimal odds engine:', error);
            throw error;
        }
    }
    return oddsEngine;
}

// Rate limiting middleware
function rateLimit(req, res, next) {
    const apiKey = req.query.key;
    if (!apiKey) {
        return next();
    }
    
    const now = Date.now();
    const key = `${apiKey}_${req.path}`;
    const requests = requestCounts.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (validRequests.length >= RATE_LIMIT) {
        return res.status(429).json({
            error: {
                code: 5,
                error: 'Rate limit exceeded. Please wait before making more requests.'
            }
        });
    }
    
    // Add current request
    validRequests.push(now);
    requestCounts.set(key, validRequests);
    
    next();
}

// Middleware
app.use(express.json());

// Enhanced CORS configuration for development
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080', 'http://127.0.0.1:8080', 'file://'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
}));

// Add preflight handler for all routes
app.options('*', cors());

app.use(express.static('.')); // Serve static files from current directory

// API Routes

// Get stock data with filters (placeholder - MongoDB removed)
app.post('/api/stock-data', async (req, res) => {
    try {
        res.json({
            success: true,
            data: [],
            count: 0,
            message: 'MongoDB functionality removed - implement your own data source'
        });
    } catch (error) {
        console.error('Error fetching stock data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get latest stock data (placeholder - MongoDB removed)
app.get('/api/stock-data/latest', async (req, res) => {
    try {
        res.json({
            success: true,
            data: [],
            message: 'MongoDB functionality removed - implement your own data source'
        });
    } catch (error) {
        console.error('Error fetching latest stock data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get statistics (placeholder - MongoDB removed)
app.get('/api/stats', async (req, res) => {
    try {
        res.json({
            success: true,
            stats: {
                totalRecords: 0,
                uniqueStocks: 0,
                latestUpdate: null,
                timeBlocks: 0,
                collectionTypes: [],
                daysOfWeek: []
            },
            message: 'MongoDB functionality removed - implement your own data source'
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get unique stocks (placeholder - MongoDB removed)
app.get('/api/stocks', async (req, res) => {
    try {
        res.json({
            success: true,
            stocks: [],
            message: 'MongoDB functionality removed - implement your own data source'
        });
    } catch (error) {
        console.error('Error fetching stocks:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get time blocks (placeholder - MongoDB removed)
app.get('/api/time-blocks', async (req, res) => {
    try {
        res.json({
            success: true,
            timeBlocks: [],
            message: 'MongoDB functionality removed - implement your own data source'
        });
    } catch (error) {
        console.error('Error fetching time blocks:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get faction data from MongoDB
app.get('/api/factions', async (req, res) => {
    try {
        const { factionIds } = req.query;
        
        const client = await connectToMongoDB();
        const db = client.db(DATABASE_NAME);
        const collection = db.collection(COLLECTION_NAME);
        
        let query = {};
        if (factionIds) {
            const ids = factionIds.split(',').map(id => parseInt(id));
            query = { id: { $in: ids } };
        }
        
        const factions = await collection.find(query).toArray();
        
        // Transform to the format expected by the betting system
        const factionData = {};
        factions.forEach(faction => {
            factionData[faction.id] = {
                respect: faction.respect || 0,
                rank: faction.rank || 'Unknown',
                members: faction.members || 0,
                position: faction.position || 999,
                chain: faction.chain || 0,
                chain_duration: faction.chain_duration || null,
                last_updated: faction.last_updated,
                name: faction.name
            };
        });
        
        res.json({
            success: true,
            data: factionData,
            count: factions.length,
            message: `Fetched ${factions.length} factions from MongoDB`
        });
        
    } catch (error) {
        console.error('Error fetching faction data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Calculate odds between two factions
app.post('/api/odds/calculate', async (req, res) => {
    try {
        const { faction1Id, faction2Id } = req.body;
        
        if (!faction1Id || !faction2Id) {
            return res.status(400).json({
                success: false,
                error: 'Both faction1Id and faction2Id are required'
            });
        }
        
        // Use singleton odds engine
        const engine = await initializeOddsEngine();
        
        // Calculate odds
        const odds = await engine.calculateOdds(faction1Id, faction2Id);
        
        res.json({
            success: true,
            odds: odds,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Error calculating odds:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Calculate professional odds with enhanced features
app.post('/api/odds/calculate-professional', async (req, res) => {
    try {
        const { faction1Id, faction2Id, betAmount } = req.body;
        
        if (!faction1Id || !faction2Id) {
            return res.status(400).json({
                success: false,
                error: 'Both faction1Id and faction2Id are required'
            });
        }
        
        // Use singleton odds engine
        const engine = await initializeOddsEngine();
        
        // Calculate professional odds
        const odds = await engine.calculateOdds(faction1Id, faction2Id);
        
        // Add specific payout calculation if bet amount provided
        let specificPayout = null;
        if (betAmount && odds[faction1Id] && odds[faction2Id]) {
            try {
                const payout1 = engine.calculatePayout(betAmount, odds[faction1Id].odds);
                const payout2 = engine.calculatePayout(betAmount, odds[faction2Id].odds);
                specificPayout = {
                    faction1: payout1,
                    faction2: payout2
                };
            } catch (error) {
                console.warn('Could not calculate specific payout:', error.message);
            }
        }
        
        res.json({
            success: true,
            odds: odds,
            specificPayout: specificPayout,
            engineInfo: {
                version: '4.0-professional',
                features: [
                    'Professional power rating system',
                    'Dynamic odds calculation',
                    'Dollar-based payouts',
                    'Natural variance injection',
                    'Comprehensive faction analysis'
                ]
            },
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Error calculating professional odds:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get odds engine health status
app.get('/api/odds/health', async (req, res) => {
    try {
        // Use singleton odds engine
        const engine = await initializeOddsEngine();
        const health = await engine.getHealthCheck();
        
        res.json({
            success: true,
            health: health
        });
        
    } catch (error) {
        console.error('Error checking odds engine health:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update Xanax price
app.post('/api/odds/update-xanax-price', async (req, res) => {
    try {
        const { newPrice } = req.body;
        
        if (!newPrice || newPrice <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid newPrice is required'
            });
        }
        
        // Use singleton odds engine
        const engine = await initializeOddsEngine();
        
        // Update Xanax price
        engine.updateXanaxPrice(newPrice);
        
        res.json({
            success: true,
            message: `Xanax price updated to $${newPrice.toLocaleString()}`,
            newPrice: newPrice,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Error updating Xanax price:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get collection types (placeholder - MongoDB removed)
app.get('/api/collection-types', async (req, res) => {
    try {
        res.json({
            success: true,
            collectionTypes: [],
            message: 'MongoDB functionality removed - implement your own data source'
        });
    } catch (error) {
        console.error('Error fetching collection types:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get days of week (placeholder - MongoDB removed)
app.get('/api/days-of-week', async (req, res) => {
    try {
        res.json({
            success: true,
            daysOfWeek: [],
            message: 'MongoDB functionality removed - implement your own data source'
        });
    } catch (error) {
        console.error('Error fetching days of week:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Mock odds data for betting system
function generateMockOddsData(sport, market) {
    const baseOdds = {
        home: 2.0,
        away: 2.0,
        draw: 3.5
    };
    
    // Add some randomness
    const variation = 0.3;
    return {
        home: baseOdds.home + (Math.random() - 0.5) * variation,
        away: baseOdds.away + (Math.random() - 0.5) * variation,
        draw: baseOdds.draw + (Math.random() - 0.5) * variation,
        timestamp: Date.now()
    };
}

// Betting API endpoints
app.get('/api/betting/odds/:sport/:market', (req, res) => {
    try {
        const { sport, market } = req.params;
        const odds = generateMockOddsData(sport, market);
        
        res.json({
            success: true,
            sport,
            market,
            odds
        });
    } catch (error) {
        console.error('Error generating odds:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Place bet endpoint - Now uses GitHub API
app.post('/api/betting/place-bet', async (req, res) => {
    try {
        const { playerId, warId, factionId, factionName, xanaxAmount, betAmount, odds, betId, playerName } = req.body;
        
        // Debug logging
        console.log('📝 Received bet data:');
        console.log('   - Player ID:', playerId);
        console.log('   - Player Name:', playerName);
        console.log('   - Bet ID:', betId);
        console.log('   - War ID:', warId);
        console.log('   - Faction ID:', factionId);
        console.log('   - Xanax Amount:', xanaxAmount);
        
        if (!playerId || !warId || !factionId || !xanaxAmount) {
            return res.status(400).json({
                success: false,
                error: 'Missing required bet data'
            });
        }
        
        const betData = {
            playerId,
            warId,
            factionId,
            factionName,
            xanaxAmount,
            betAmount,
            odds,
            betId, // Include the bet ID from frontend
            playerName, // Include the real player name from frontend
            timestamp: Date.now()
        };
        
        // Use local storage (will be synced by GitHub Actions)
        const GitHubActionsBets = require('./scripts/github-actions-bets.js');
        const betsManager = new GitHubActionsBets();
        
        try {
            const betObject = betsManager.addBet(betData);
            
            res.json({
                success: true,
                betId: betData.betId,
                message: 'Bet placed successfully and saved locally (will sync to GitHub)',
                timestamp: betData.timestamp
            });
        } catch (error) {
            console.error('❌ Error adding bet:', error.message);
            
            // Fallback to original local storage
            console.log('🔄 Falling back to original local storage...');
            const success = await addBet(betData);
            
            if (success) {
                res.json({
                    success: true,
                    betId: betData.betId,
                    message: 'Bet placed successfully (local storage)',
                    timestamp: betData.timestamp
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to save bet'
                });
            }
        }
        
    } catch (error) {
        console.error('Error placing bet:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get user bets endpoint
app.get('/api/betting/user-bets/:playerId', async (req, res) => {
    try {
        const { playerId } = req.params;
        const bets = await getUserBets(playerId);
        
        res.json({
            success: true,
            bets: bets,
            count: bets.length
        });
        
    } catch (error) {
        console.error('Error fetching user bets:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get all bets endpoint (admin only)
app.get('/api/betting/all-bets', async (req, res) => {
    try {
        const bets = await getAllBets();
        
        res.json({
            success: true,
            data: bets
        });
        
    } catch (error) {
        console.error('Error fetching all bets:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Confirm bet endpoint (for automated processing)
app.post('/api/betting/confirm-bet', async (req, res) => {
    try {
        const { betId, logData } = req.body;
        
        const success = await confirmBet(betId, logData);
        
        if (success) {
            res.json({
                success: true,
                message: 'Bet confirmed successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Bet not found or already confirmed'
            });
        }
        
    } catch (error) {
        console.error('Error confirming bet:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get user profile and detailed bet data
app.get('/api/betting/user-profile/:playerId', async (req, res) => {
    try {
        const { playerId } = req.params;
        const userProfile = await getUserProfile(playerId);
        
        if (!userProfile) {
            return res.status(404).json({
                success: false,
                error: 'User profile not found'
            });
        }
        
        res.json({
            success: true,
            profile: userProfile
        });
        
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Resolve bet endpoint (for war results)
app.post('/api/betting/resolve-bet', async (req, res) => {
    try {
        const { betId, result } = req.body;
        
        if (!betId || !result || !['won', 'lost'].includes(result)) {
            return res.status(400).json({
                success: false,
                error: 'Missing betId or invalid result (must be "won" or "lost")'
            });
        }
        
        const success = await resolveBet(betId, result);
        
        if (success) {
            res.json({
                success: true,
                message: `Bet ${result} successfully`,
                betId: betId,
                result: result
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Bet not found or already resolved'
            });
        }
        
    } catch (error) {
        console.error('Error resolving bet:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get all user profiles (admin endpoint)
app.get('/api/betting/all-user-profiles', async (req, res) => {
    try {
        const userBetsData = await loadUserBetsData();
        
        res.json({
            success: true,
            users: userBetsData.users,
            metadata: userBetsData.metadata
        });
        
    } catch (error) {
        console.error('Error fetching all user profiles:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Verify Torn API key and get player data
app.post('/api/auth/verify-key', async (req, res) => {
    try {
        const { apiKey } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({
                success: false,
                error: 'API key is required'
            });
        }
        
        // Call Torn API to verify the key and get player data
        const response = await fetch(`https://api.torn.com/user/?selections=profile&key=${apiKey}`);
        const data = await response.json();
        
        if (data.error) {
            return res.status(401).json({
                success: false,
                error: 'Invalid API key'
            });
        }
        
        const playerData = {
            playerId: data.player_id,
            name: data.name,
            level: data.level,
            faction: data.faction?.faction_name || 'None',
            apiKey: apiKey // Store for session
        };
        
        res.json({
            success: true,
            player: playerData
        });
        
    } catch (error) {
        console.error('Error verifying API key:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get user's bets by player ID (authenticated)
app.get('/api/betting/my-bets/:playerId', async (req, res) => {
    try {
        const { playerId } = req.params;
        const { apiKey } = req.query;
        
        if (!apiKey) {
            return res.status(401).json({
                success: false,
                error: 'API key required for authentication'
            });
        }
        
        // Verify the API key matches the player ID
        const verifyResponse = await fetch(`https://api.torn.com/user/?selections=profile&key=${apiKey}`);
        const verifyData = await verifyResponse.json();
        
        if (verifyData.error || verifyData.player_id.toString() !== playerId.toString()) {
            return res.status(401).json({
                success: false,
                error: 'Invalid API key or player ID mismatch'
            });
        }
        
        // Get user's bets
        const userProfile = await getUserProfile(playerId);
        
        console.log('🔍 Fetching bets for player:', playerId);
        console.log('📊 User profile found:', !!userProfile);
        
        if (!userProfile) {
            console.log('❌ No user profile found for player:', playerId);
            return res.json({
                success: true,
                player: {
                    playerId: playerId,
                    name: verifyData.name,
                    level: verifyData.level,
                    faction: verifyData.faction?.faction_name || 'None'
                },
                bets: {
                    activeBets: [],
                    betHistory: [],
                    profile: {
                        totalBets: 0,
                        totalVolume: 0,
                        totalWinnings: 0,
                        totalLosses: 0,
                        netProfit: 0,
                        winRate: 0,
                        averageBetSize: 0,
                        largestBet: 0,
                        favoriteFaction: '',
                        lastActive: null
                    }
                }
            });
        }
        
        console.log('✅ User profile data:', {
            activeBets: userProfile.activeBets.length,
            betHistory: userProfile.betHistory.length,
            profile: userProfile.profile
        });
        
        res.json({
            success: true,
            player: {
                playerId: playerId,
                name: verifyData.name,
                level: verifyData.level,
                faction: verifyData.faction?.faction_name || 'None'
            },
            bets: {
                activeBets: userProfile.activeBets,
                betHistory: userProfile.betHistory,
                profile: userProfile.profile
            }
        });
        
    } catch (error) {
        console.error('Error fetching user bets:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Static file routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Betting/bettingdashboard.html'));
});

app.get('/betting', (req, res) => {
    res.sendFile(path.join(__dirname, 'Betting/bettingdashboard.html'));
});



app.get('/faction-data', (req, res) => {
    res.sendFile(path.join(__dirname, 'faction-data-viewer.html'));
});

app.get('/test-connection', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-connection.html'));
});

app.get('/betting-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'betting-test.html'));
});

app.get('/stock-graphs', (req, res) => {
    res.sendFile(path.join(__dirname, 'stock-graphs.html'));
});

app.get('/logs', (req, res) => {
    res.sendFile(path.join(__dirname, 'logs.html'));
});

app.get('/logs-fixed', (req, res) => {
    res.sendFile(path.join(__dirname, 'logs-fixed.html'));
});

app.get('/mongo-dashboard-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'mongo-dashboard-test.html'));
});

app.get('/mongo-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'mongo-test.html'));
});

app.get('/market-api-tester', (req, res) => {
    res.sendFile(path.join(__dirname, 'market-api-tester.html'));
});

app.get('/odds-api-tester', (req, res) => {
    res.sendFile(path.join(__dirname, 'odds-api-tester.html'));
});

app.get('/api-tester', (req, res) => {
    res.sendFile(path.join(__dirname, 'api-tester.html'));
});

app.get('/travel-database', (req, res) => {
    res.sendFile(path.join(__dirname, 'travel-database.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Something went wrong!'
    });
});

// Cache for Torn City API responses
const tornApiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Torn City API Proxy Endpoints
app.get('/api/torn/user', rateLimit, async (req, res) => {
    try {
        const apiKey = req.query.key;
        if (!apiKey) {
            return res.status(400).json({ error: 'API key required' });
        }

        // Check cache first
        const cacheKey = `user_${apiKey}`;
        const cached = tornApiCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return res.json(cached.data);
        }

        const response = await axios.get(`https://api.torn.com/user/?selections=profile&key=${apiKey}`);
        
        // Cache the response
        tornApiCache.set(cacheKey, {
            data: response.data,
            timestamp: Date.now()
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Torn API user error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.error || 'Failed to fetch user data'
        });
    }
});

app.get('/api/torn/rankedwars', rateLimit, async (req, res) => {
    try {
        const apiKey = req.query.key;
        if (!apiKey) {
            return res.status(400).json({ error: 'API key required' });
        }

        // Check cache first
        const cacheKey = `rankedwars_${apiKey}`;
        const cached = tornApiCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return res.json(cached.data);
        }

        const response = await axios.get(`https://api.torn.com/torn/?selections=rankedwars&key=${apiKey}`);
        
        // Cache the response
        tornApiCache.set(cacheKey, {
            data: response.data,
            timestamp: Date.now()
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Torn API rankedwars error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.error || 'Failed to fetch ranked wars data'
        });
    }
});

app.get('/api/torn/faction/:factionId', rateLimit, async (req, res) => {
    try {
        const { factionId } = req.params;
        const apiKey = req.query.key;
        const selections = req.query.selections || 'chain';

        if (!apiKey) {
            return res.status(400).json({ error: 'API key required' });
        }

        // Check cache first
        const cacheKey = `faction_${factionId}_${selections}_${apiKey}`;
        const cached = tornApiCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return res.json(cached.data);
        }

        const response = await axios.get(`https://api.torn.com/faction/${factionId}?selections=${selections}&key=${apiKey}`);
        
        // Cache the response
        tornApiCache.set(cacheKey, {
            data: response.data,
            timestamp: Date.now()
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Torn API faction error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.error || 'Failed to fetch faction data'
        });
    }
});



// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Start server
async function startServer() {
    try {
        await initializeDataFiles();
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📊 Dashboard: http://localhost:${PORT}`);
            console.log(`🎲 Betting Dashboard: http://localhost:${PORT}/betting`);
            console.log(`👑 Bookie Dashboard: http://localhost:${PORT}/bookie`);
            console.log(`📈 Stock Graphs: http://localhost:${PORT}/stock-graphs`);
            console.log(`📋 Logs: http://localhost:${PORT}/logs`);
            console.log(`🔧 API Tester: http://localhost:${PORT}/api-tester`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer(); 