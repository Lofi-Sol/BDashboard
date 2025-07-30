const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function syncFactionData() {
  const uri = 'mongodb+srv://oowol003:TornData2341@torndata.vxouoj6.mongodb.net/?retryWrites=true&w=majority&appName=TornData';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const factionsCollection = db.collection('factions');
    
    // Get all faction data
    console.log('📊 Fetching faction data...');
    const factions = await factionsCollection.find({}).toArray();
    
    // Transform data for better readability
    const factionData = {
      lastUpdated: new Date().toISOString(),
      totalFactions: factions.length,
      factions: factions.map(faction => ({
        id: faction.id,
        name: faction.name,
        respect: faction.respect || 0,
        rank: faction.rank || 'Unranked',
        members: faction.members || 0,
        position: faction.position || null,
        lastUpdated: faction.lastUpdated || new Date().toISOString()
      }))
    };
    
    // Ensure data directory exists
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Write to JSON file
    const outputPath = path.join(dataDir, 'factions.json');
    fs.writeFileSync(outputPath, JSON.stringify(factionData, null, 2));
    
    console.log(`✅ Successfully synced ${factions.length} factions to ${outputPath}`);
    console.log(`📅 Last updated: ${factionData.lastUpdated}`);
    
    // Log some statistics
    const rankedFactions = factions.filter(f => f.rank && f.rank !== 'Unranked').length;
    const totalRespect = factions.reduce((sum, f) => sum + (f.respect || 0), 0);
    const avgMembers = factions.reduce((sum, f) => sum + (f.members || 0), 0) / factions.length;
    
    console.log(`📈 Statistics:`);
    console.log(`   - Ranked factions: ${rankedFactions}/${factions.length}`);
    console.log(`   - Total respect: ${totalRespect.toLocaleString()}`);
    console.log(`   - Average members: ${Math.round(avgMembers)}`);
    
  } catch (error) {
    console.error('❌ Error syncing faction data:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the sync function
if (require.main === module) {
  syncFactionData();
}

module.exports = { syncFactionData }; 