const { MongoClient } = require('mongodb');
const axios = require('axios');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://oowol003:TornData2341@torndata.vxouoj6.mongodb.net/?retryWrites=true&w=majority&appName=TornData';
const DATABASE_NAME = 'torn_data';
const COLLECTION_NAME = 'factions';

// Torn API configuration
const TORN_API_BASE = 'https://api.torn.com/v2';
const API_KEY = process.env.TORN_API_KEY;

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

async function fetchFactionData(offset = 0) {
    try {
        const url = `${TORN_API_BASE}/torn/factionhof?limit=100&offset=${offset}&cat=rank&key=${API_KEY}`;
        console.log(`Fetching faction data from offset ${offset}...`);
        
        const response = await axios.get(url);
        
        if (response.data.error) {
            console.error('API Error:', response.data.error);
            return null;
        }
        
        return response.data.factionhof || [];
    } catch (error) {
        console.error('Failed to fetch faction data:', error.message);
        return null;
    }
}

async function updateFactionInDatabase(db, factionData) {
    try {
        const collection = db.collection(COLLECTION_NAME);
        
        // Check if document exists first
        const existingDoc = await collection.findOne({ id: factionData.id });
        
        if (existingDoc) {
            // Document exists - update without touching created_at
            const updateDoc = {
                name: factionData.name,
                members: factionData.members,
                position: factionData.position,
                rank: factionData.rank,
                respect: factionData.values?.respect || 0,
                chain: factionData.values?.chain || null,
                chain_duration: factionData.values?.chain_duration || null,
                last_updated: new Date()
            };
            
            const result = await collection.updateOne(
                { id: factionData.id },
                { $set: updateDoc }
            );
            
            if (result.modifiedCount > 0) {
                console.log(`🔄 Updated faction: ${factionData.name} (ID: ${factionData.id})`);
            } else {
                console.log(`⏭️  No changes for faction: ${factionData.name} (ID: ${factionData.id})`);
            }
            
            return result;
        } else {
            // Document doesn't exist - insert new with created_at
            const insertDoc = {
                id: factionData.id,
                name: factionData.name,
                members: factionData.members,
                position: factionData.position,
                rank: factionData.rank,
                respect: factionData.values?.respect || 0,
                chain: factionData.values?.chain || null,
                chain_duration: factionData.values?.chain_duration || null,
                last_updated: new Date(),
                created_at: new Date()
            };
            
            const result = await collection.insertOne(insertDoc);
            
            console.log(`✅ Inserted new faction: ${factionData.name} (ID: ${factionData.id})`);
            
            return { upsertedCount: 1, modifiedCount: 0 };
        }
    } catch (error) {
        console.error(`Failed to update faction ${factionData.id}:`, error);
        return null;
    }
}

async function testFactionCollection() {
    let client;
    try {
        client = await connectToMongoDB();
        const db = client.db(DATABASE_NAME);
        
        console.log('🧪 Testing faction data collection...');
        console.log(`📅 Test time: ${new Date().toISOString()}`);
        
        // Test with just the first batch (100 factions)
        const factions = await fetchFactionData(0);
        
        if (!factions || factions.length === 0) {
            console.log('❌ No factions found in API response');
            return;
        }
        
        console.log(`📦 Processing ${factions.length} factions for testing...`);
        
        let totalFactions = 0;
        let totalUpdated = 0;
        let totalInserted = 0;
        
        for (const faction of factions) {
            const result = await updateFactionInDatabase(db, faction);
            if (result) {
                totalFactions++;
                if (result.upsertedCount > 0) {
                    totalInserted++;
                } else if (result.modifiedCount > 0) {
                    totalUpdated++;
                }
            }
        }
        
        console.log('\n📈 Test Summary:');
        console.log(`   Total factions processed: ${totalFactions}`);
        console.log(`   New factions inserted: ${totalInserted}`);
        console.log(`   Existing factions updated: ${totalUpdated}`);
        console.log(`   Unchanged factions: ${totalFactions - totalInserted - totalUpdated}`);
        
        // Get collection stats
        const collection = db.collection(COLLECTION_NAME);
        const totalInDB = await collection.countDocuments();
        console.log(`   Total factions in database: ${totalInDB}`);
        
        // Show sample of inserted data
        const sampleDocs = await collection.find().limit(3).toArray();
        console.log('\n📋 Sample inserted documents:');
        sampleDocs.forEach(doc => {
            console.log(`  ID: ${doc.id}, Name: ${doc.name}, Respect: ${doc.respect?.toLocaleString()}, Rank: ${doc.rank}`);
        });
        
        console.log('\n✅ Test completed successfully!');
        
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
if (!API_KEY) {
    console.error('❌ TORN_API_KEY environment variable is required');
    console.log('💡 Set it with: export TORN_API_KEY=your_api_key_here');
    process.exit(1);
}

testFactionCollection()
    .then(() => {
        console.log('✅ Faction collection test completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Faction collection test failed:', error);
        process.exit(1);
    }); 