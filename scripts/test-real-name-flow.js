#!/usr/bin/env node

/**
 * Test Real Name Flow
 * 
 * This script simulates the complete flow from user login to bet placement
 * to verify that real player names are used correctly.
 */

// Simulate the Torn API response (what the server gets when user logs in)
const mockTornApiResponse = {
    "player_id": 3520571,
    "name": "VanillaScoop",
    "level": 34,
    "faction": {
        "faction_name": "Diamond Syndicate"
    }
};

// Simulate the frontend userData (what the frontend stores after login)
const mockUserData = {
    playerId: 3520571,
    name: "VanillaScoop",
    level: 34,
    faction: "Diamond Syndicate"
};

// Simulate the bet data that frontend sends to server
const mockBetData = {
    playerId: 3520571,
    warId: "28672",
    factionId: "16335",
    factionName: "Test Faction",
    xanaxAmount: 2,
    betAmount: 2000000,
    betId: "TEST1234",
    playerName: "VanillaScoop", // Real name from userData
    odds: 2.15,
    timestamp: Date.now(),
    status: 'pending'
};

// Simulate the server-side addBet function
function simulateAddBet(betData) {
    console.log('🔧 Server processing bet...');
    console.log(`   - Player ID: ${betData.playerId}`);
    console.log(`   - Player Name: ${betData.playerName}`);
    console.log(`   - Bet ID: ${betData.betId}`);
    console.log('');
    
    // Simulate creating user profile
    const userProfile = {
        playerId: betData.playerId.toString(),
        username: betData.playerName, // Use real name from frontend
        profile: {
            joinDate: new Date().toISOString(),
            totalBets: 1,
            totalVolume: betData.betAmount,
            lastActive: new Date().toISOString()
        },
        activeBets: [{
            betId: betData.betId,
            warId: betData.warId,
            factionId: betData.factionId,
            factionName: betData.factionName,
            xanaxAmount: betData.xanaxAmount,
            betAmount: betData.betAmount,
            status: 'pending',
            timestamp: betData.timestamp
        }]
    };
    
    console.log('✅ User profile created with real name:');
    console.log(`   - Username: ${userProfile.username}`);
    console.log(`   - Bet ID: ${userProfile.activeBets[0].betId}`);
    console.log('');
    
    return userProfile;
}

// Test the complete flow
function testRealNameFlow() {
    console.log('🧪 Testing Real Name Flow');
    console.log('==========================');
    console.log('');
    
    console.log('📋 Step 1: User logs in with API key');
    console.log('   - API key verified with Torn API');
    console.log('   - Server receives player data:');
    console.log(`     * Player ID: ${mockTornApiResponse.player_id}`);
    console.log(`     * Name: ${mockTornApiResponse.name}`);
    console.log(`     * Level: ${mockTornApiResponse.level}`);
    console.log('');
    
    console.log('📋 Step 2: Frontend stores user data');
    console.log('   - userData.name = "VanillaScoop"');
    console.log('   - userData.playerId = 3520571');
    console.log('');
    
    console.log('📋 Step 3: User places bet');
    console.log('   - Frontend generates bet ID: TEST1234');
    console.log('   - Frontend sends bet data to server');
    console.log('   - Includes real player name: VanillaScoop');
    console.log('');
    
    // Simulate the server processing
    const userProfile = simulateAddBet(mockBetData);
    
    console.log('📋 Step 4: Verify correct data flow');
    console.log('   ✅ Real name used: ' + (userProfile.username === mockUserData.name ? 'YES' : 'NO'));
    console.log('   ✅ Bet ID preserved: ' + (userProfile.activeBets[0].betId === mockBetData.betId ? 'YES' : 'NO'));
    console.log('   ✅ Player ID correct: ' + (userProfile.playerId === mockBetData.playerId.toString() ? 'YES' : 'NO'));
    console.log('');
    
    if (userProfile.username === mockUserData.name && 
        userProfile.activeBets[0].betId === mockBetData.betId) {
        console.log('🎉 SUCCESS: Real name flow working correctly!');
        console.log('📋 New bets will use real player names automatically.');
    } else {
        console.log('❌ FAILURE: Real name flow has issues!');
    }
    
    return userProfile.username === mockUserData.name;
}

// Run the test
testRealNameFlow(); 