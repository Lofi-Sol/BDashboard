const express = require('express');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const TornOddsEngine = require('./Betting/odds-engine.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://oowol003:TornData2341@torndata.vxouoj6.mongodb.net/?retryWrites=true&w=majority&appName=TornData';
const DATABASE_NAME = 'torn_data';
const COLLECTION_NAME = 'factions';

let mongoClient = null;
let oddsEngine = null; // Singleton odds engine instance

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

// Initialize odds engine singleton
async function initializeOddsEngine() {
    if (!oddsEngine) {
        try {
            const client = await connectToMongoDB();
            const db = client.db(DATABASE_NAME);
            oddsEngine = new TornOddsEngine(db);
            console.log('Odds engine initialized successfully');
        } catch (error) {
            console.error('Failed to initialize odds engine:', error);
            throw error;
        }
    }
    return oddsEngine;
}

// Middleware
app.use(express.json());
app.use(cors({
    origin: true, // Allow all origins for development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
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

// Place bet endpoint (placeholder)
app.post('/api/betting/place-bet', (req, res) => {
    try {
        const { betData } = req.body;
        
        res.json({
            success: true,
            message: 'Bet placed successfully (placeholder)',
            betId: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('Error placing bet:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get user bets (placeholder)
app.get('/api/betting/user-bets', (req, res) => {
    try {
        res.json({
            success: true,
            bets: [],
            message: 'MongoDB functionality removed - implement your own data source'
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
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📊 Dashboard: http://localhost:${PORT}`);
            console.log(`🎲 Betting Dashboard: http://localhost:${PORT}/betting`);
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