const { MongoClient } = require('mongodb');
const OddsEngine = require('../Betting/odds-engine.js');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://oowol003:TornData2341@torndata.vxouoj6.mongodb.net/?retryWrites=true&w=majority&appName=TornData';
const DATABASE_NAME = 'torn_data';
const COLLECTION_NAME = 'factions';

async function connectToMongoDB() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ Connected to MongoDB');
        return client;
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
        throw error;
    }
}

async function testEnhancedOddsEngine() {
    let client;
    try {
        client = await connectToMongoDB();
        const db = client.db(DATABASE_NAME);
        const collection = db.collection(COLLECTION_NAME);
        
        console.log('\n🧪 Testing Enhanced Odds Engine...');
        
        // Get sample factions from MongoDB
        const sampleFactions = await collection.find().limit(10).toArray();
        
        if (sampleFactions.length < 2) {
            console.log('❌ Need at least 2 factions to test odds calculation');
            return;
        }
        
        // Create a mock war between two factions
        const faction1 = sampleFactions[0];
        const faction2 = sampleFactions[1];
        
        console.log('\n📋 Test War Setup:');
        console.log(`  Faction 1: ${faction1.name} (ID: ${faction1.id})`);
        console.log(`    Respect: ${faction1.respect?.toLocaleString()}`);
        console.log(`    Rank: ${faction1.rank}`);
        console.log(`    Members: ${faction1.members}`);
        console.log(`    Position: ${faction1.position}`);
        
        console.log(`  Faction 2: ${faction2.name} (ID: ${faction2.id})`);
        console.log(`    Respect: ${faction2.respect?.toLocaleString()}`);
        console.log(`    Rank: ${faction2.rank}`);
        console.log(`    Members: ${faction2.members}`);
        console.log(`    Position: ${faction2.position}`);
        
        // Create mock war data
        const mockWar = {
            id: 'test-war-123',
            factions: {
                [faction1.id]: {
                    ...faction1,
                    score: 1500,
                    chain: 25
                },
                [faction2.id]: {
                    ...faction2,
                    score: 1200,
                    chain: 18
                }
            },
            war: {
                target: 5000,
                start: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
                end: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
            }
        };
        
        // Initialize odds engine
        const oddsEngine = new OddsEngine();
        
        console.log('\n🎯 Testing Individual Probability Calculations:');
        
        // Test respect probability
        const respectProb1 = oddsEngine.calculateRespectProbability(mockWar.factions[faction1.id], mockWar.factions[faction2.id]);
        const respectProb2 = oddsEngine.calculateRespectProbability(mockWar.factions[faction2.id], mockWar.factions[faction1.id]);
        console.log(`  Respect Probability - ${faction1.name}: ${(respectProb1 * 100).toFixed(2)}%`);
        console.log(`  Respect Probability - ${faction2.name}: ${(respectProb2 * 100).toFixed(2)}%`);
        
        // Test position probability
        const positionProb1 = oddsEngine.calculatePositionProbability(mockWar.factions[faction1.id], mockWar.factions[faction2.id]);
        const positionProb2 = oddsEngine.calculatePositionProbability(mockWar.factions[faction2.id], mockWar.factions[faction1.id]);
        console.log(`  Position Probability - ${faction1.name}: ${(positionProb1 * 100).toFixed(2)}%`);
        console.log(`  Position Probability - ${faction2.name}: ${(positionProb2 * 100).toFixed(2)}%`);
        
        // Test comprehensive faction strength probability
        const strengthProb1 = oddsEngine.calculateFactionStrengthProbability(mockWar.factions[faction1.id], mockWar.factions[faction2.id]);
        const strengthProb2 = oddsEngine.calculateFactionStrengthProbability(mockWar.factions[faction2.id], mockWar.factions[faction1.id]);
        console.log(`  Faction Strength - ${faction1.name}: ${(strengthProb1 * 100).toFixed(2)}%`);
        console.log(`  Faction Strength - ${faction2.name}: ${(strengthProb2 * 100).toFixed(2)}%`);
        
        console.log('\n🎲 Testing Complete Odds Calculation:');
        
        // Calculate full odds
        const odds = oddsEngine.calculateOdds(mockWar, {}, {});
        
        console.log(`  Final Odds - ${faction1.name}: ${(odds[faction1.id] * 100).toFixed(2)}%`);
        console.log(`  Final Odds - ${faction2.name}: ${(odds[faction2.id] * 100).toFixed(2)}%`);
        
        // Convert to betting odds
        const bettingOdds1 = oddsEngine.probabilityToOdds(odds[faction1.id]);
        const bettingOdds2 = oddsEngine.probabilityToOdds(odds[faction2.id]);
        
        console.log(`  Betting Odds - ${faction1.name}: ${bettingOdds1.toFixed(2)}%`);
        console.log(`  Betting Odds - ${faction2.name}: ${bettingOdds2.toFixed(2)}%`);
        
        // Test return calculation
        const betAmount = 1000000; // 1M Xanax
        const return1 = oddsEngine.calculateReturn(betAmount, bettingOdds1);
        const return2 = oddsEngine.calculateReturn(betAmount, bettingOdds2);
        
        console.log(`  Return on $${betAmount.toLocaleString()} bet - ${faction1.name}: $${return1.toLocaleString()}`);
        console.log(`  Return on $${betAmount.toLocaleString()} bet - ${faction2.name}: $${return2.toLocaleString()}`);
        
        console.log('\n✅ Enhanced odds engine test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    } finally {
        if (client) {
            await client.close();
            console.log('🔌 Disconnected from MongoDB');
        }
    }
}

// Run the test
testEnhancedOddsEngine()
    .then(() => {
        console.log('✅ Enhanced odds engine test completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Enhanced odds engine test failed:', error);
        process.exit(1);
    }); 