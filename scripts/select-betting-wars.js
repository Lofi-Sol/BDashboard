const { MongoClient } = require('mongodb');
const fs = require('fs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://oowol003:TornData2341@torndata.vxouoj6.mongodb.net/?retryWrites=true&w=majority&appName=TornData';
const DATABASE_NAME = 'torn_data';
const COLLECTION_NAME = 'wars';
const FACTION_COLLECTION = 'factions';
const OUTPUT_FILE = 'data/betting-wars.json';
const NUM_RANDOM = 12;
const NUM_INTERESTING = 8;

async function connectToMongoDB() {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    return client;
}

async function getWars(db) {
    return db.collection(COLLECTION_NAME).find({}).toArray();
}

async function getFactions(db) {
    const factions = await db.collection(FACTION_COLLECTION).find({}).toArray();
    const byId = {};
    factions.forEach(f => { byId[f.id] = f; });
    return byId;
}

function pickRandom(arr, n) {
    const shuffled = arr.slice().sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
}

function isInterestingWar(war, factionsById) {
    // At least one faction is top 50 by respect or rank
    const f1 = factionsById[war.factions && Object.keys(war.factions)[0]];
    const f2 = factionsById[war.factions && Object.keys(war.factions)[1]];
    if (!f1 || !f2) return false;
    const topRespect = 10000000;
    const topRanks = ['Diamond I', 'Diamond II', 'Diamond III', 'Diamond'];
    return (
        (f1.respect >= topRespect || f2.respect >= topRespect) ||
        (topRanks.includes(f1.rank) || topRanks.includes(f2.rank))
    );
}

async function main() {
    let client;
    try {
        client = await connectToMongoDB();
        const db = client.db(DATABASE_NAME);
        const wars = await getWars(db);
        const factionsById = await getFactions(db);

        // Filter wars that are active or upcoming
        const eligibleWars = wars.filter(war => war.war && war.war.winner === 0);

        // Select interesting wars
        const interestingWars = eligibleWars.filter(war => isInterestingWar(war, factionsById));
        const selectedInteresting = pickRandom(interestingWars, NUM_INTERESTING);

        // Remove already selected wars
        const remainingWars = eligibleWars.filter(war => !selectedInteresting.includes(war));
        const selectedRandom = pickRandom(remainingWars, NUM_RANDOM);

        // Combine and shuffle
        const selectedWars = [...selectedInteresting, ...selectedRandom].sort(() => 0.5 - Math.random());
        const warIds = selectedWars.map(war => war.id);

        // Write to JSON file
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ warIds, lastUpdated: new Date().toISOString() }, null, 2));
        console.log(`Selected ${warIds.length} wars for betting. Saved to ${OUTPUT_FILE}`);
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