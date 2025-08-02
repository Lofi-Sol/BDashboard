const fs = require('fs').promises;
const path = require('path');

async function testCurrentBetIssue() {
    try {
        console.log('🔍 Testing current bet issues...\n');
        
        // Load user bets data
        const userBetsPath = path.join(__dirname, '../data/user-bets.json');
        const userBetsData = JSON.parse(await fs.readFile(userBetsPath, 'utf8'));
        
        console.log('📊 Current User Bets Data:');
        console.log('==========================');
        
        Object.values(userBetsData.users).forEach(user => {
            console.log(`\n👤 Player ${user.playerId}:`);
            console.log(`   - Username: ${user.username}`);
            console.log(`   - Active Bets: ${user.activeBets?.length || 0}`);
            
            if (user.activeBets && user.activeBets.length > 0) {
                user.activeBets.forEach((bet, index) => {
                    console.log(`   - Bet ${index + 1}:`);
                    console.log(`     * Bet ID: ${bet.betId}`);
                    console.log(`     * War ID: ${bet.warId}`);
                    console.log(`     * Faction: ${bet.factionName} (${bet.factionId})`);
                    console.log(`     * Xanax: ${bet.xanaxAmount}`);
                    console.log(`     * Status: ${bet.status}`);
                    console.log(`     * Timestamp: ${new Date(bet.timestamp).toLocaleString()}`);
                });
            }
        });
        
        console.log('\n🔍 Issues Found:');
        console.log('================');
        
        // Check for placeholder usernames
        Object.values(userBetsData.users).forEach(user => {
            if (user.username && user.username.startsWith('Player')) {
                console.log(`❌ Placeholder username found: ${user.username} for player ${user.playerId}`);
            }
        });
        
        // Check for bet ID mismatches
        Object.values(userBetsData.users).forEach(user => {
            if (user.activeBets) {
                user.activeBets.forEach(bet => {
                    if (bet.betId && bet.betId.length !== 8) {
                        console.log(`⚠️  Unexpected bet ID length: ${bet.betId} (length: ${bet.betId.length})`);
                    }
                });
            }
        });
        
        console.log('\n✅ Test completed!');
        
    } catch (error) {
        console.error('❌ Error testing bet issues:', error);
    }
}

// Run the test
testCurrentBetIssue(); 