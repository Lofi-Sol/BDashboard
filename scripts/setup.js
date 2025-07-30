const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://oowol003:TornData2341@torndata.vxouoj6.mongodb.net/?retryWrites=true&w=majority&appName=TornData';

async function setupDatabase() {
    try {
        console.log('Setting up Torn Betting Database...');
        
        // Connect to MongoDB
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        const db = client.db('torn-betting');
        
        // Create collections
        const logsCollection = db.collection('bookie-logs');
        const betsCollection = db.collection('confirmed-bets');
        
        // Create indexes for better performance
        await logsCollection.createIndex({ logId: 1 }, { unique: true });
        await logsCollection.createIndex({ timestamp: -1 });
        await logsCollection.createIndex({ 'data.sender': 1 });
        
        await betsCollection.createIndex({ betId: 1 }, { unique: true });
        await betsCollection.createIndex({ senderId: 1 });
        await betsCollection.createIndex({ warId: 1 });
        await betsCollection.createIndex({ confirmedAt: -1 });
        await betsCollection.createIndex({ status: 1 });
        
        console.log('✅ Database indexes created successfully');
        
        // Test connection
        const stats = await db.stats();
        console.log(`✅ Connected to database: ${db.databaseName}`);
        console.log(`📊 Database size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
        
        // Check collections
        const logsCount = await logsCollection.countDocuments();
        const betsCount = await betsCollection.countDocuments();
        
        console.log(`📋 Bookie logs: ${logsCount} entries`);
        console.log(`🎯 Confirmed bets: ${betsCount} entries`);
        
        await client.close();
        
        console.log('\n🎉 Database setup completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Add GitHub secrets: BOOKIE_API_KEY and MONGODB_URI');
        console.log('2. Push to GitHub to trigger the first workflow');
        console.log('3. Start the API server: npm run api');
        console.log('4. Open bettingdashboard.html in your browser');
        
    } catch (error) {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    }
}

// Test Torn API connection
async function testTornAPI() {
    try {
        console.log('\nTesting Torn API connection...');
        
        const axios = require('axios');
        const BOOKIE_API_KEY = process.env.BOOKIE_API_KEY || 'C0wctKtdsgjJYpWe';
        
        const response = await axios.get(
            `https://api.torn.com/user/?selections=log&key=${BOOKIE_API_KEY}`
        );
        
        if (response.data.error) {
            throw new Error(response.data.error.error);
        }
        
        const logs = response.data.log;
        console.log(`✅ Torn API connected successfully`);
        console.log(`📋 Found ${Object.keys(logs || {}).length} logs`);
        
    } catch (error) {
        console.error('❌ Torn API test failed:', error.message);
        console.log('⚠️  Make sure your BOOKIE_API_KEY is valid');
    }
}

// Run setup
async function main() {
    console.log('🚀 Torn Betting System Setup\n');
    
    await testTornAPI();
    await setupDatabase();
}

main(); 