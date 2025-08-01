const { MongoClient } = require('mongodb');
const axios = require('axios');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://oowol003:TornData2341@torndata.vxouoj6.mongodb.net/?retryWrites=true&w=majority&appName=TornData';
const DATABASE_NAME = 'torn_data';
const COLLECTION_NAME = 'wars';
const TORN_API_KEY = process.env.TORN_API_KEY;

async function connectToMongoDB() {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    return client;
}

async function fetchWarsFromTorn() {
    if (!TORN_API_KEY) throw new Error('TORN_API_KEY not set');
    const url = `https://api.torn.com/torn/?selections=rankedwars&key=${TORN_API_KEY}`;
    const response = await axios.get(url);
    if (response.data.error) throw new Error('Torn API error: ' + response.data.error.error);
    return response.data.rankedwars || {};
}

async function upsertWars(db, wars) {
    const collection = db.collection(COLLECTION_NAME);
    let upserted = 0;
    for (const [warId, warData] of Object.entries(wars)) {
        await collection.updateOne(
            { id: warId },
            { $set: { ...warData, id: warId, lastUpdated: new Date() } },
            { upsert: true }
        );
        upserted++;
    }
    return upserted;
}

async function main() {
    let client;
    try {
        client = await connectToMongoDB();
        const db = client.db(DATABASE_NAME);
        const wars = await fetchWarsFromTorn();
        const upserted = await upsertWars(db, wars);
        console.log(`Upserted ${upserted} wars into MongoDB.`);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    } finally {
        if (client) await client.close();
    }
}

if (require.main === module) {
    main();
}