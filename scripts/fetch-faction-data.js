const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://oowol003:TornData2341@torndata.vxouoj6.mongodb.net/?retryWrites=true&w=majority&appName=TornData';
const DATABASE_NAME = 'torn_data';
const COLLECTION_NAME = 'factions';

// Data file paths
const USER_BETS_FILE = './data/user-bets.json';
const FILTERED_LOGS_FILE = './data/filtered-logs.json';

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

// Load user bets data
async function loadUserBetsData() {
    try {
        const data = await fs.readFile(USER_BETS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading user bets data:', error);
        return { users: {}, metadata: { version: "1.0", created: new Date().toISOString() } };
    }
}

// Save user bets data
async function saveUserBetsData(data) {
    try {
        data.metadata.lastUpdated = new Date().toISOString();
        await fs.writeFile(USER_BETS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving user bets data:', error);
        return false;
    }
}

// Load filtered logs data
async function loadFilteredLogsData() {
    try {
        const data = await fs.readFile(FILTERED_LOGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading filtered logs data:', error);
        return { logs: {}, metadata: { last_updated: new Date().toISOString() } };
    }
}

// Process bet confirmations from filtered logs
async function processBetConfirmations() {
    console.log('🔍 Processing bet confirmations from filtered logs...');
    
    try {
        // Load current data
        const userBetsData = await loadUserBetsData();
        const filteredLogsData = await loadFilteredLogsData();
        
        let confirmationsProcessed = 0;
        let pendingBetsFound = 0;
        
        // Process each user's pending bets
        Object.values(userBetsData.users).forEach(user => {
            if (!user.activeBets) return;
            
            // Find pending bets for this user
            const pendingBets = user.activeBets.filter(bet => bet.status === 'pending');
            pendingBetsFound += pendingBets.length;
            
            console.log(`👤 User ${user.playerId}: ${pendingBets.length} pending bets`);
            
            pendingBets.forEach(pendingBet => {
                // Look for matching confirmation log
                const matchingLog = findMatchingConfirmationLog(pendingBet, filteredLogsData.logs);
                
                if (matchingLog) {
                    // Confirm the bet
                    pendingBet.status = 'confirmed';
                    pendingBet.confirmedAt = matchingLog.timestamp * 1000;
                    pendingBet.logId = Object.keys(filteredLogsData.logs).find(key => 
                        filteredLogsData.logs[key] === matchingLog
                    );
                    pendingBet.senderId = matchingLog.data.sender;
                    
                    console.log(`✅ Confirmed bet ${pendingBet.betId} for user ${user.playerId}`);
                    confirmationsProcessed++;
                }
            });
        });
        
        // Save updated data
        await saveUserBetsData(userBetsData);
        
        console.log(`📊 Confirmation Summary:`);
        console.log(`   - Pending bets found: ${pendingBetsFound}`);
        console.log(`   - Confirmations processed: ${confirmationsProcessed}`);
        console.log(`   - Filtered logs scanned: ${Object.keys(filteredLogsData.logs).length}`);
        
        return {
            success: true,
            pendingBetsFound,
            confirmationsProcessed,
            totalLogsScanned: Object.keys(filteredLogsData.logs).length
        };
        
    } catch (error) {
        console.error('❌ Error processing bet confirmations:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Find matching confirmation log for a pending bet
function findMatchingConfirmationLog(pendingBet, logs) {
    for (const [logId, logEntry] of Object.entries(logs)) {
        // Check if this is a bet confirmation log
        if (logEntry.title === 'Item receive' && 
            logEntry.category === 'Item sending' &&
            logEntry.data && 
            logEntry.data.items) {
            
            // Check if any item is Xanax (ID: 206)
            const xanaxItem = logEntry.data.items.find(item => item.id === 206);
            
            if (xanaxItem && logEntry.data.message) {
                // Check if message matches bet format: BET:warId:factionId:amount:betId
                const betMatch = logEntry.data.message.match(/^BET:(\d+):(\d+):(\d+):([A-Z0-9]+)$/);
                
                if (betMatch) {
                    const [, warId, factionId, xanaxAmount, betId] = betMatch;
                    
                    // Check if this log matches our pending bet
                    if (betId === pendingBet.betId &&
                        parseInt(warId) === parseInt(pendingBet.warId) &&
                        parseInt(factionId) === parseInt(pendingBet.factionId) &&
                        parseInt(xanaxAmount) === pendingBet.xanaxAmount) {
                        
                        console.log(`🎯 Found matching log for bet ${pendingBet.betId}:`);
                        console.log(`   - Log ID: ${logId}`);
                        console.log(`   - Sender: ${logEntry.data.sender}`);
                        console.log(`   - Message: ${logEntry.data.message}`);
                        
                        return logEntry;
                    }
                }
            }
        }
    }
    
    return null;
}

// Get confirmation statistics
async function getConfirmationStats() {
    try {
        const userBetsData = await loadUserBetsData();
        const filteredLogsData = await loadFilteredLogsData();
        
        let totalPendingBets = 0;
        let totalConfirmedBets = 0;
        let totalUsers = 0;
        
        Object.values(userBetsData.users).forEach(user => {
            if (user.activeBets && user.activeBets.length > 0) {
                totalUsers++;
                const pendingBets = user.activeBets.filter(bet => bet.status === 'pending');
                const confirmedBets = user.activeBets.filter(bet => bet.status === 'confirmed');
                
                totalPendingBets += pendingBets.length;
                totalConfirmedBets += confirmedBets.length;
            }
        });
        
        return {
            totalUsers,
            totalPendingBets,
            totalConfirmedBets,
            totalFilteredLogs: Object.keys(filteredLogsData.logs).length,
            lastUpdated: userBetsData.metadata?.lastUpdated || 'Unknown'
        };
        
    } catch (error) {
        console.error('Error getting confirmation stats:', error);
        return null;
    }
}

// Export functions for use in other modules
module.exports = { 
    fetchFactionData,
    processBetConfirmations,
    getConfirmationStats,
    loadUserBetsData,
    saveUserBetsData
};

// If run directly, process confirmations
if (require.main === module) {
    processBetConfirmations()
        .then(result => {
            if (result.success) {
                console.log('✅ Bet confirmation processing completed successfully');
                console.log(`📊 Results: ${result.confirmationsProcessed} confirmations processed`);
            } else {
                console.error('❌ Bet confirmation processing failed:', result.error);
            }
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
} 