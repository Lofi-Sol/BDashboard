const axios = require('axios');

// Test the /api/betting/my-bets/:playerId endpoint
async function testServerEndpoint() {
    try {
        console.log('🧪 Testing server endpoint...');
        
        // Test with a player ID that has confirmed bets
        const testPlayerId = '3576736'; // FlowerJar has confirmed bets
        const testApiKey = 'test'; // This will fail authentication but we can see the response
        
        console.log(`📡 Testing endpoint for player: ${testPlayerId}`);
        
        const response = await axios.get(`http://localhost:3000/api/betting/my-bets/${testPlayerId}?apiKey=${testApiKey}`);
        
        console.log('✅ Server response:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ Server error:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
}

// Test the user-bets.json file directly
function testUserBetsFile() {
    try {
        console.log('\n📁 Testing user-bets.json file...');
        
        const fs = require('fs');
        const userBetsData = JSON.parse(fs.readFileSync('./data/user-bets.json', 'utf8'));
        
        console.log('✅ User bets data loaded:');
        console.log(`   - Total users: ${Object.keys(userBetsData.users).length}`);
        
        // Check for confirmed bets
        let totalConfirmedBets = 0;
        let totalPendingBets = 0;
        
        Object.values(userBetsData.users).forEach(user => {
            if (user.activeBets) {
                const confirmedBets = user.activeBets.filter(bet => bet.status === 'confirmed');
                const pendingBets = user.activeBets.filter(bet => bet.status === 'pending');
                
                totalConfirmedBets += confirmedBets.length;
                totalPendingBets += pendingBets.length;
                
                if (confirmedBets.length > 0) {
                    console.log(`   - User ${user.playerId} (${user.username}): ${confirmedBets.length} confirmed, ${pendingBets.length} pending`);
                    confirmedBets.forEach(bet => {
                        console.log(`     ✅ Confirmed bet ${bet.betId}: ${bet.factionName} (${bet.xanaxAmount} Xanax)`);
                    });
                }
            }
        });
        
        console.log(`\n📊 Summary:`);
        console.log(`   - Total confirmed bets: ${totalConfirmedBets}`);
        console.log(`   - Total pending bets: ${totalPendingBets}`);
        
    } catch (error) {
        console.error('❌ Error reading user-bets.json:', error.message);
    }
}

// Run tests
async function main() {
    console.log('🎯 Testing Bet Confirmation System');
    console.log('==================================');
    
    await testServerEndpoint();
    testUserBetsFile();
}

main().catch(console.error); 