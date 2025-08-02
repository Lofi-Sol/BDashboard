const GitHubBetsAPI = require('./github-bets-api.js');

async function testGlobalSystem() {
    console.log('🧪 Testing Global Betting System...\n');
    
    try {
        const githubAPI = new GitHubBetsAPI();
        
        // Test 1: Get current user bets
        console.log('📥 Test 1: Fetching user bets from GitHub...');
        const userBetsData = await githubAPI.getUserBets();
        console.log(`✅ Found ${Object.keys(userBetsData.users).length} users`);
        
        // Test 2: Get filtered logs
        console.log('\n📥 Test 2: Fetching filtered logs from GitHub...');
        const filteredLogsData = await githubAPI.getFilteredLogs();
        console.log(`✅ Found ${Object.keys(filteredLogsData.logs).length} filtered logs`);
        
        // Test 3: Test bet addition (mock data)
        console.log('\n🎯 Test 3: Testing bet addition...');
        const mockBetData = {
            playerId: '9999999',
            warId: '99999',
            factionId: '99999',
            factionName: 'Test Faction',
            xanaxAmount: 1,
            betAmount: 1000000,
            odds: 2.0,
            betId: 'TEST123',
            playerName: 'TestPlayer',
            timestamp: Date.now()
        };
        
        try {
            const betObject = await githubAPI.addBet(mockBetData);
            console.log('✅ Test bet added successfully:', betObject.betId);
            
            // Test 4: Test bet confirmation
            console.log('\n✅ Test 4: Testing bet confirmation...');
            const confirmedBet = await githubAPI.confirmBet(mockBetData.betId, mockBetData.playerId);
            console.log('✅ Test bet confirmed successfully:', confirmedBet.status);
            
        } catch (error) {
            console.log('⚠️  Test bet addition failed (expected if GitHub token not set):', error.message);
        }
        
        // Test 5: Show current system status
        console.log('\n📊 Test 5: Current System Status');
        console.log(`   - Total Users: ${userBetsData.metadata.totalUsers}`);
        console.log(`   - Active Bets: ${userBetsData.metadata.totalActiveBets}`);
        console.log(`   - Total Volume: ${userBetsData.metadata.totalVolume.toLocaleString()}`);
        console.log(`   - Last Updated: ${userBetsData.metadata.lastUpdated}`);
        
        // Test 6: Show recent filtered logs
        console.log('\n📋 Test 6: Recent Filtered Logs');
        const recentLogs = Object.entries(filteredLogsData.logs)
            .slice(0, 3)
            .map(([id, log]) => ({ id, ...log }));
        
        recentLogs.forEach((log, index) => {
            console.log(`   ${index + 1}. ${log.type} - ${log.item} x${log.quantity} - ${log.message}`);
        });
        
        console.log('\n✅ Global betting system test completed successfully!');
        
    } catch (error) {
        console.error('❌ Global betting system test failed:', error.message);
        console.log('\n💡 Make sure to set your GitHub token:');
        console.log('   export GITHUB_TOKEN=your_token_here');
    }
}

// Run the test
if (require.main === module) {
    testGlobalSystem()
        .then(() => {
            console.log('\n🎉 All tests completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testGlobalSystem }; 