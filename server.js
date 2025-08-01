const express = require('express');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const TornDecimalOddsEngine = require('./Betting/odds-engine.js');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const requestCounts = new Map();
const RATE_LIMIT = 50; // Max requests per minute per API key
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://oowol003:TornData2341@torndata.vxouoj6.mongodb.net/?retryWrites=true&w=majority&appName=TornData';
const DATABASE_NAME = 'torn_data';
const COLLECTION_NAME = 'factions';

let mongoClient = null;
let oddsEngine = null; // Singleton decimal odds engine instance

// Centralized data file paths
const BETS_FILE = './data/bets.json';
const BET_LOGS_FILE = './data/bet-logs.json';

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
        
        // Initialize bet-logs.json if it doesn't exist
        try {
            await fs.access(BET_LOGS_FILE);
        } catch {
            const initialLogsData = {
                bet_logs: [],
                processed_logs: [],
                metadata: {
                    last_updated: null,
                    total_bet_logs: 0,
                    total_processed_logs: 0,
                    new_bet_logs_found: 0,
                    new_processed_logs: 0,
                    run_timestamp: null
                }
            };
            await fs.writeFile(BET_LOGS_FILE, JSON.stringify(initialLogsData, null, 2));
            console.log('✅ Initialized bet-logs.json');
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

// Add new bet to centralized storage
async function addBet(betData) {
    try {
        const data = await loadBetData();
        if (!data) return false;
        
        // Generate unique bet ID if not provided
        if (!betData.betId) {
            betData.betId = generateBetId();
        }
        
        // Add timestamp if not provided
        if (!betData.timestamp) {
            betData.timestamp = Date.now();
        }
        
        // Add to active bets
        data.active_bets.unshift(betData);
        
        // Update statistics
        data.statistics.total_bets++;
        data.statistics.total_volume += betData.betAmount || 0;
        data.statistics.pending_bets++;
        data.statistics.last_updated = new Date().toISOString();
        
        // Update user count
        const uniqueUsers = new Set(data.active_bets.map(bet => bet.playerId));
        data.metadata.total_users = uniqueUsers.size;
        
        return await saveBetData(data);
    } catch (error) {
        console.error('Error adding bet:', error);
        return false;
    }
}

// Confirm bet (move from pending to confirmed)
async function confirmBet(betId, logData) {
    try {
        const data = await loadBetData();
        if (!data) return false;
        
        const betIndex = data.active_bets.findIndex(bet => bet.betId === betId);
        if (betIndex === -1) return false;
        
        // Update bet status
        data.active_bets[betIndex].status = 'confirmed';
        data.active_bets[betIndex].logId = logData.logId;
        data.active_bets[betIndex].confirmedAt = logData.timestamp;
        data.active_bets[betIndex].senderId = logData.senderId;
        
        // Update statistics
        data.statistics.pending_bets--;
        data.statistics.confirmed_bets++;
        
        return await saveBetData(data);
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
            oddsEngine = new TornDecimalOddsEngine();
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

// Get odds engine health status
app.get('/api/odds/health', async (req, res) => {
    try {
        // Use singleton odds engine
        const engine = await initializeOddsEngine();
        const health = await engine.healthCheck();
        
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

// Place bet endpoint
app.post('/api/betting/place-bet', async (req, res) => {
    try {
        const { playerId, warId, factionId, factionName, xanaxAmount, betAmount, odds } = req.body;
        
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
            status: 'pending',
            timestamp: Date.now()
        };
        
        const success = await addBet(betData);
        
        if (success) {
            res.json({
                success: true,
                betId: betData.betId,
                message: 'Bet placed successfully',
                timestamp: betData.timestamp
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to save bet'
            });
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

// Static file routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/betting', (req, res) => {
    res.sendFile(path.join(__dirname, 'Betting/bettingdashboard.html'));
});

app.get('/bet-tracking', (req, res) => {
    res.sendFile(path.join(__dirname, 'Betting/bet-tracking.html'));
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

app.get('/api/torn/user/log', rateLimit, async (req, res) => {
    try {
        const apiKey = req.query.key;
        if (!apiKey) {
            return res.status(400).json({ error: 'API key required' });
        }

        // Check cache first
        const cacheKey = `userlog_${apiKey}`;
        const cached = tornApiCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return res.json(cached.data);
        }

        const response = await axios.get(`https://api.torn.com/user/?selections=log&key=${apiKey}`);
        
        // Cache the response
        tornApiCache.set(cacheKey, {
            data: response.data,
            timestamp: Date.now()
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Torn API user log error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.error || 'Failed to fetch user log'
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