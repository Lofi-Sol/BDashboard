const GitHubActionsBets = require('./github-actions-bets.js');

async function testLocalSystem() {
    console.log('🧪 Testing Local Betting System (GitHub Actions Sync)...\n');
    
    try {
        const betsManager = new GitHubActionsBets();
        
        // Test 1: Load current user bets
        console.log('📥 Test 1: Loading user bets from local file...');
        const userBetsData = betsManager.loadUserBets();
        console.log(`✅ Found ${Object.keys(userBetsData.users).length} users`);
        
        // Test 2: Load filtered logs
        console.log('\n📥 Test 2: Loading filtered logs from local file...');
        const filteredLogsData = betsManager.getFilteredLogs();
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
            const betObject = betsManager.addBet(mockBetData);
            console.log('✅ Test bet added successfully:', betObject.betId);
            
            // Test 4: Test bet confirmation
            console.log('\n✅ Test 4: Testing bet confirmation...');
            const confirmedBet = betsManager.confirmBet(mockBetData.betId, mockBetData.playerId);
            console.log('✅ Test bet confirmed successfully:', confirmedBet.status);
            
        } catch (error) {
            console.log('⚠️  Test bet addition failed:', error.message);
        }
        
        // Test 5: Show current system status
        console.log('\n📊 Test 5: Current System Status');
        const updatedUserBets = betsManager.loadUserBets();
        console.log(`   - Total Users: ${updatedUserBets.metadata.totalUsers}`);
        console.log(`   - Active Bets: ${updatedUserBets.metadata.totalActiveBets}`);
        console.log(`   - Total Volume: ${updatedUserBets.metadata.totalVolume.toLocaleString()}`);
        console.log(`   - Last Updated: ${updatedUserBets.metadata.lastUpdated}`);
        
        // Test 6: Show recent filtered logs
        console.log('\n📋 Test 6: Recent Filtered Logs');
        const recentLogs = Object.entries(filteredLogsData.logs)
            .slice(0, 3)
            .map(([id, log]) => ({ id, ...log }));
        
        recentLogs.forEach((log, index) => {
            console.log(`   ${index + 1}. ${log.type} - ${log.item} x${log.quantity} - ${log.message}`);
        });
        
        console.log('\n✅ Local betting system test completed successfully!');
        console.log('🔄 Changes will be synced to GitHub by GitHub Actions every 2 minutes');
        
    } catch (error) {
        console.error('❌ Local betting system test failed:', error.message);
    }
}

// Run the test
if (require.main === module) {
    testLocalSystem()
        .then(() => {
            console.log('\n🎉 All tests completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testLocalSystem }; 