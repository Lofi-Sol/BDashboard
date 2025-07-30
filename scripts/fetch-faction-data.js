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

async function fetchFactionData(factionIds = []) {
    let client;
    try {
        client = await connectToMongoDB();
        const db = client.db(DATABASE_NAME);
        const collection = db.collection(COLLECTION_NAME);
        
        let query = {};
        if (factionIds.length > 0) {
            query = { id: { $in: factionIds } };
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
        
        console.log(`Fetched ${factions.length} factions from MongoDB`);
        return factionData;
        
    } catch (error) {
        console.error('Failed to fetch faction data from MongoDB:', error);
        return {};
    } finally {
        if (client) {
            await client.close();
        }
    }
}

// Export for use in other modules
module.exports = { fetchFactionData };

// If run directly, fetch all factions
if (require.main === module) {
    fetchFactionData()
        .then(data => {
            console.log('Faction data:', data);
            process.exit(0);
        })
        .catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
} 