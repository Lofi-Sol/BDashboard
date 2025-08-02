const fs = require('fs');
const path = require('path');

// Function to clear test data and set up for real bets
function clearTestData() {
    try {
        const jsonPath = path.join(__dirname, '../data/user-bets.json');
        
        // Create a clean template for real betting data
        const cleanData = {
            "users": {},
            "metadata": {
                "version": "1.0",
                "created": new Date().toISOString(),
                "lastUpdated": new Date().toISOString(),
                "totalUsers": 0,
                "activeUsers": 0,
                "totalActiveBets": 0,
                "totalVolume": 0,
                "schema": {
                    "userProfile": {
                        "playerId": "string",
                        "username": "string (real player name from API)",
                        "profile": {
                            "joinDate": "ISO date string",
                            "totalBets": "number",
                            "totalVolume": "number",
                            "totalWinnings": "number",
                            "totalLosses": "number",
                            "netProfit": "number",
                            "winRate": "number (0-1)",
                            "averageBetSize": "number",
                            "largestBet": "number",
                            "favoriteFaction": "string",
                            "lastActive": "ISO date string"
                        },
                        "activeBets": "array of bet objects",
                        "betHistory": "array of completed bet objects",
                        "statistics": "object with various betting statistics",
                        "preferences": "object with user betting preferences"
                    },
                    "betObject": {
                        "betId": "string",
                        "warId": "string",
                        "factionId": "string",
                        "factionName": "string",
                        "xanaxAmount": "number",
                        "betAmount": "number",
                        "odds": "number",
                        "potentialPayout": "number",
                        "status": "string (pending|won|lost|cancelled)",
                        "timestamp": "number",
                        "placedAt": "ISO date string",
                        "resolvedAt": "ISO date string (for completed bets)",
                        "actualPayout": "number (for completed bets)",
                        "profit": "number (for completed bets)"
                    }
                }
            }
        };
        
        // Save the clean data
        fs.writeFileSync(jsonPath, JSON.stringify(cleanData, null, 2));
        
        console.log('✅ Test data cleared successfully!');
        console.log('📊 New structure created with:');
        console.log('   - 0 users');
        console.log('   - 0 active bets');
        console.log('   - 0 total volume');
        console.log('');
        console.log('🔄 Auto-sync will update Google Sheets automatically...');
        console.log('');
        console.log('📋 Ready for real betting data!');
        console.log('💡 Future bets will use real player names from the API');
        
    } catch (error) {
        console.error('❌ Error clearing test data:', error.message);
    }
}

// Function to show current data summary
function showDataSummary() {
    try {
        const jsonPath = path.join(__dirname, '../data/user-bets.json');
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        
        const userCount = Object.keys(jsonData.users || {}).length;
        const totalBets = Object.values(jsonData.users || {}).reduce((sum, user) => {
            return sum + (user.activeBets ? user.activeBets.length : 0);
        }, 0);
        
        console.log('📊 Current Data Summary:');
        console.log('========================');
        console.log(`Users: ${userCount}`);
        console.log(`Active Bets: ${totalBets}`);
        console.log(`Total Volume: ${jsonData.metadata?.totalVolume?.toLocaleString() || 0}`);
        console.log(`Last Updated: ${jsonData.metadata?.lastUpdated || 'N/A'}`);
        
        if (userCount > 0) {
            console.log('');
            console.log('👥 Current Users:');
            for (const [playerId, userData] of Object.entries(jsonData.users)) {
                console.log(`  - ${playerId}: ${userData.username} (${userData.activeBets?.length || 0} bets)`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error reading data summary:', error.message);
    }
}

// Main execution
function main() {
    const action = process.argv[2];
    
    if (action === 'clear') {
        console.log('🗑️  Clearing test data...');
        clearTestData();
    } else if (action === 'show') {
        showDataSummary();
    } else {
        console.log('📋 Test Data Management');
        console.log('=======================');
        console.log('');
        showDataSummary();
        console.log('');
        console.log('📋 Commands:');
        console.log('   node scripts/clear-test-data.js show   # Show current data');
        console.log('   node scripts/clear-test-data.js clear  # Clear test data');
        console.log('');
        console.log('⚠️  WARNING: Clear will remove all current test data!');
        console.log('💡 Use this to start fresh with real betting data.');
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { clearTestData, showDataSummary }; 