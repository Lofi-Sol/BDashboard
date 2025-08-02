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
        const betsCollection = db.collection('confirmed-bets');
        
        // Create indexes for better performance
        
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
        const betsCount = await betsCollection.countDocuments();
        
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



// Run setup
async function main() {
    console.log('🚀 Torn Betting System Setup\n');
    
    await setupDatabase();
}

main(); 