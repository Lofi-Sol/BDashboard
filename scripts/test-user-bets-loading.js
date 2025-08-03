const fs = require('fs');
const path = require('path');

async function testUserBetsLoading() {
    console.log('🧪 Testing User Bets Loading...\n');
    
    try {
        // Load user-bets.json
        const userBetsPath = path.join(__dirname, '../data/user-bets.json');
        const userBetsData = JSON.parse(fs.readFileSync(userBetsPath, 'utf8'));
        
        console.log('📊 User Bets Data Summary:');
        console.log(`   - Total users: ${Object.keys(userBetsData.users).length}`);
        
        // Check each user's bets
        for (const [playerId, user] of Object.entries(userBetsData.users)) {
            console.log(`\n👤 User: ${user.username} (${playerId})`);
            console.log(`   - Active bets: ${user.activeBets.length}`);
            console.log(`   - Bet history: ${user.betHistory.length}`);
            console.log(`   - Total volume: $${(user.profile.totalVolume / 1000000).toFixed(1)}M`);
            
            if (user.activeBets.length > 0) {
                console.log('   📋 Active bets:');
                user.activeBets.forEach((bet, index) => {
                    console.log(`     ${index + 1}. Bet ID: ${bet.betId}`);
                    console.log(`        War: ${bet.warId}, Faction: ${bet.factionName}`);
                    console.log(`        Amount: $${(bet.betAmount / 1000000).toFixed(1)}M, Status: ${bet.status}`);
                });
            }
        }
        
        // Test the getUserProfile function
        console.log('\n🔍 Testing getUserProfile function...');
        
        // Simulate the server's getUserProfile function
        function getUserProfile(playerId) {
            const playerIdStr = playerId.toString();
            if (!userBetsData.users[playerIdStr]) {
                return null;
            }
            return userBetsData.users[playerIdStr];
        }
        
        // Test with existing users
        const testPlayerIds = Object.keys(userBetsData.users);
        for (const playerId of testPlayerIds) {
            const profile = getUserProfile(playerId);
            if (profile) {
                console.log(`✅ Found profile for player ${playerId}: ${profile.username}`);
                console.log(`   - Active bets: ${profile.activeBets.length}`);
                console.log(`   - Bet history: ${profile.betHistory.length}`);
            } else {
                console.log(`❌ No profile found for player ${playerId}`);
            }
        }
        
        // Test with non-existent user
        const nonExistentPlayerId = '9999999';
        const nonExistentProfile = getUserProfile(nonExistentPlayerId);
        console.log(`\n🔍 Test non-existent user ${nonExistentPlayerId}: ${nonExistentProfile ? 'Found' : 'Not found'}`);
        
        console.log('\n✅ User bets loading test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error testing user bets loading:', error.message);
    }
}

// Run the test
if (require.main === module) {
    testUserBetsLoading()
        .then(() => {
            console.log('\n🎉 All tests completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testUserBetsLoading }; 