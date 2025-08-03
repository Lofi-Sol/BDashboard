const axios = require('axios');

async function testServerEndpoint() {
    console.log('🧪 Testing Server Endpoint for User Bets...\n');
    
    try {
        // Test the /api/betting/my-bets/:playerId endpoint
        const testPlayerId = '3520571'; // VanillaScoop
        const testApiKey = 'test-key'; // We'll use a test key
        
        console.log(`🔍 Testing endpoint for player: ${testPlayerId}`);
        
        const response = await axios.get(`http://localhost:3000/api/betting/my-bets/${testPlayerId}?apiKey=${testApiKey}`);
        
        console.log('✅ Server response:');
        console.log('   - Status:', response.status);
        console.log('   - Success:', response.data.success);
        
        if (response.data.success) {
            console.log('   - Player:', response.data.player);
            console.log('   - Active bets:', response.data.bets.activeBets.length);
            console.log('   - Bet history:', response.data.bets.betHistory.length);
            
            if (response.data.bets.activeBets.length > 0) {
                console.log('   📋 Active bets:');
                response.data.bets.activeBets.forEach((bet, index) => {
                    console.log(`     ${index + 1}. Bet ID: ${bet.betId}`);
                    console.log(`        War: ${bet.warId}, Faction: ${bet.factionName}`);
                    console.log(`        Amount: $${(bet.betAmount / 1000000).toFixed(1)}M, Status: ${bet.status}`);
                });
            }
        } else {
            console.log('   - Error:', response.data.error);
        }
        
    } catch (error) {
        console.error('❌ Error testing server endpoint:', error.message);
        
        if (error.response) {
            console.log('   - Response status:', error.response.status);
            console.log('   - Response data:', error.response.data);
        }
    }
}

// Run the test
if (require.main === module) {
    testServerEndpoint()
        .then(() => {
            console.log('\n🎉 Server endpoint test completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testServerEndpoint }; 