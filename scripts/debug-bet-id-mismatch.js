const fs = require('fs').promises;
const path = require('path');

async function debugBetIdMismatch() {
    try {
        console.log('🔍 Debugging bet ID mismatch...\n');
        
        // Load user bets data
        const userBetsPath = path.join(__dirname, '../data/user-bets.json');
        const userBetsData = JSON.parse(await fs.readFile(userBetsPath, 'utf8'));
        
        console.log('📊 Current Bet Data:');
        console.log('====================');
        
        Object.values(userBetsData.users).forEach(user => {
            if (user.activeBets && user.activeBets.length > 0) {
                user.activeBets.forEach((bet, index) => {
                    console.log(`\n🎯 Bet ${index + 1}:`);
                    console.log(`   - Bet ID: ${bet.betId}`);
                    console.log(`   - War ID: ${bet.warId}`);
                    console.log(`   - Faction ID: ${bet.factionId}`);
                    console.log(`   - Xanax Amount: ${bet.xanaxAmount}`);
                    
                    // Generate what the bet message should be
                    const expectedMessage = `BET:${bet.warId}:${bet.factionId}:${bet.xanaxAmount}:${bet.betId}`;
                    console.log(`   - Expected Message: ${expectedMessage}`);
                    
                    // Check if the bet ID matches the expected format
                    if (bet.betId.length === 8) {
                        console.log(`   ✅ Bet ID length is correct (8 characters)`);
                    } else {
                        console.log(`   ❌ Bet ID length is incorrect: ${bet.betId.length} characters`);
                    }
                });
            }
        });
        
        console.log('\n🔍 Analysis:');
        console.log('============');
        console.log('1. The JSON shows bet ID: 1GQK6L6I (8 characters)');
        console.log('2. User reports seeing: NUNGIEPO');
        console.log('3. This suggests a frontend caching or display issue');
        console.log('4. The bet message should be: BET:28766:8989:1:1GQK6L6I');
        
        console.log('\n💡 Possible causes:');
        console.log('- Browser localStorage cache');
        console.log('- Frontend generating different ID');
        console.log('- Race condition in bet creation');
        console.log('- Display showing cached data');
        
    } catch (error) {
        console.error('❌ Error debugging bet ID mismatch:', error);
    }
}

// Run the debug
debugBetIdMismatch(); 