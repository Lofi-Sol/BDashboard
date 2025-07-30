const { MongoClient } = require('mongodb');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://oowol003:TornData2341@torndata.vxouoj6.mongodb.net/?retryWrites=true&w=majority&appName=TornData';
const DATABASE_NAME = 'torn_data';
const COLLECTION_NAME = 'factions';

async function connectToMongoDB() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('Connected to MongoDB');
        return client;
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}

async function cleanupDatabase() {
    let client;
    try {
        client = await connectToMongoDB();
        const db = client.db(DATABASE_NAME);
        const collection = db.collection(COLLECTION_NAME);
        
        console.log('🧹 Starting database cleanup...');
        
        // Check current documents
        const count = await collection.countDocuments();
        console.log(`📊 Current documents in collection: ${count}`);
        
        if (count > 0) {
            // Show sample documents to understand the structure
            const sampleDocs = await collection.find().limit(3).toArray();
            console.log('📋 Sample documents:');
            sampleDocs.forEach(doc => {
                console.log(`  ID: ${doc.id}, Name: ${doc.name}, Created: ${doc.created_at}`);
            });
            
            // Delete all documents to start fresh
            const deleteResult = await collection.deleteMany({});
            console.log(`🗑️  Deleted ${deleteResult.deletedCount} documents`);
        }
        
        // Verify collection is empty
        const newCount = await collection.countDocuments();
        console.log(`✅ Collection now has ${newCount} documents`);
        
        console.log('🎉 Database cleanup completed successfully!');
        
    } catch (error) {
        console.error('❌ Database cleanup failed:', error);
        throw error;
    } finally {
        if (client) {
            await client.close();
            console.log('🔌 Disconnected from MongoDB');
        }
    }
}

// Run the cleanup
cleanupDatabase()
    .then(() => {
        console.log('✅ Cleanup completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    }); 