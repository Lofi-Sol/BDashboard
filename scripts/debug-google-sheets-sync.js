const fs = require('fs');
const path = require('path');

// Debug Google Sheets sync data
function debugGoogleSheetsSync() {
    console.log('🔍 Debugging Google Sheets Sync Data');
    console.log('====================================');
    
    try {
        // Read the user-bets.json file
        const jsonPath = path.join(__dirname, '../data/user-bets.json');
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        
        console.log('✅ User bets data loaded:');
        console.log(`   - Total users: ${Object.keys(jsonData.users).length}`);
        
        // Check each user for confirmed bets
        Object.values(jsonData.users).forEach(user => {
            if (user.activeBets && user.activeBets.length > 0) {
                const confirmedBets = user.activeBets.filter(bet => bet.status === 'confirmed');
                const pendingBets = user.activeBets.filter(bet => bet.status === 'pending');
                
                console.log(`\n👤 User ${user.playerId} (${user.username}):`);
                console.log(`   - Total bets: ${user.activeBets.length}`);
                console.log(`   - Confirmed bets: ${confirmedBets.length}`);
                console.log(`   - Pending bets: ${pendingBets.length}`);
                
                if (confirmedBets.length > 0) {
                    console.log('   ✅ Confirmed bets:');
                    confirmedBets.forEach(bet => {
                        console.log(`     - Bet ${bet.betId}: ${bet.factionName} (${bet.xanaxAmount} Xanax) - Status: ${bet.status}`);
                    });
                }
                
                if (pendingBets.length > 0) {
                    console.log('   ⏳ Pending bets:');
                    pendingBets.forEach(bet => {
                        console.log(`     - Bet ${bet.betId}: ${bet.factionName} (${bet.xanaxAmount} Xanax) - Status: ${bet.status}`);
                    });
                }
            }
        });
        
        // Simulate the Google Sheets sync data processing
        console.log('\n📊 Simulating Google Sheets sync data processing:');
        
        const activeBets = [];
        for (const [playerId, userData] of Object.entries(jsonData.users)) {
            for (const bet of userData.activeBets) {
                const betData = {
                    playerId: userData.playerId,
                    username: userData.username,
                    betId: bet.betId,
                    warId: bet.warId,
                    factionId: bet.factionId,
                    factionName: bet.factionName,
                    xanaxAmount: bet.xanaxAmount,
                    betAmount: bet.betAmount,
                    odds: bet.odds,
                    potentialPayout: bet.potentialPayout,
                    status: bet.status,
                    timestamp: bet.timestamp,
                    placedAt: bet.placedAt
                };
                activeBets.push(betData);
            }
        }
        
        console.log(`   - Total bets processed: ${activeBets.length}`);
        console.log(`   - Confirmed bets: ${activeBets.filter(bet => bet.status === 'confirmed').length}`);
        console.log(`   - Pending bets: ${activeBets.filter(bet => bet.status === 'pending').length}`);
        
        // Show all bets that would be synced
        console.log('\n📋 All bets that would be synced to Google Sheets:');
        activeBets.forEach(bet => {
            console.log(`   - ${bet.username}: Bet ${bet.betId} - ${bet.factionName} (${bet.xanaxAmount} Xanax) - Status: ${bet.status}`);
        });
        
    } catch (error) {
        console.error('❌ Error debugging Google Sheets sync:', error.message);
    }
}

// Run debug
debugGoogleSheetsSync(); 