const fs = require('fs').promises;
const path = require('path');

async function testBetCreationFlow() {
    try {
        console.log('🧪 Testing bet creation flow...\n');
        
        // Simulate the frontend bet creation process
        const mockBetData = {
            playerId: '3520571',
            playerName: 'TestPlayer',
            betId: 'TEST1234',
            warId: '28794',
            factionId: '41803',
            factionName: 'THE TEABAGGERS',
            xanaxAmount: 1,
            betAmount: 744983,
            odds: 2.7,
            status: 'pending',
            timestamp: Date.now()
        };
        
        console.log('📝 Mock bet data:');
        console.log(JSON.stringify(mockBetData, null, 2));
        
        // Load current user bets data
        const userBetsPath = path.join(__dirname, '../data/user-bets.json');
        const userBetsData = JSON.parse(await fs.readFile(userBetsPath, 'utf8'));
        
        console.log('\n📊 Current user data before test:');
        const existingUser = userBetsData.users[mockBetData.playerId];
        if (existingUser) {
            console.log(`   - Username: ${existingUser.username}`);
            console.log(`   - Active bets: ${existingUser.activeBets?.length || 0}`);
        } else {
            console.log('   - User does not exist yet');
        }
        
        // Simulate the addBetToUserProfile logic
        const playerId = mockBetData.playerId.toString();
        
        // Initialize user if doesn't exist
        if (!userBetsData.users[playerId]) {
            console.log('\n🆕 Creating new user...');
            userBetsData.users[playerId] = {
                playerId: playerId,
                username: mockBetData.playerName || `Player${playerId}`,
                profile: {
                    joinDate: new Date().toISOString(),
                    totalBets: 0,
                    totalVolume: 0,
                    totalWinnings: 0,
                    totalLosses: 0,
                    netProfit: 0,
                    winRate: 0.0,
                    averageBetSize: 0,
                    largestBet: 0,
                    favoriteFaction: "",
                    lastActive: new Date().toISOString()
                },
                activeBets: [],
                betHistory: [],
                statistics: {
                    byWar: {},
                    byFaction: {},
                    byMonth: {},
                    byWeek: {},
                    byDay: {}
                },
                preferences: {
                    defaultBetSize: 1000000,
                    favoriteFactions: [],
                    riskTolerance: "medium",
                    autoBetting: false,
                    notifications: {
                        betResults: true,
                        newWars: true,
                        oddsChanges: false
                    }
                }
            };
        } else {
            console.log('\n🔄 Updating existing user...');
            // Update username for existing user if real name is provided
            if (mockBetData.playerName && userBetsData.users[playerId].username !== mockBetData.playerName) {
                console.log(`   - Updating username: ${userBetsData.users[playerId].username} → ${mockBetData.playerName}`);
                userBetsData.users[playerId].username = mockBetData.playerName;
            } else {
                console.log(`   - No username update needed`);
                console.log(`   - Current: ${userBetsData.users[playerId].username}`);
                console.log(`   - Received: ${mockBetData.playerName}`);
            }
        }
        
        const user = userBetsData.users[playerId];
        
        // Create enhanced bet object for user profile
        const enhancedBet = {
            betId: mockBetData.betId,
            warId: mockBetData.warId,
            factionId: mockBetData.factionId,
            factionName: mockBetData.factionName,
            xanaxAmount: mockBetData.xanaxAmount,
            betAmount: mockBetData.betAmount,
            odds: mockBetData.odds,
            potentialPayout: Math.round(mockBetData.betAmount * mockBetData.odds),
            status: mockBetData.status,
            timestamp: mockBetData.timestamp,
            placedAt: new Date(mockBetData.timestamp).toISOString()
        };
        
        console.log('\n📝 Enhanced bet object:');
        console.log(JSON.stringify(enhancedBet, null, 2));
        
        // Add to active bets
        user.activeBets.unshift(enhancedBet);
        
        console.log('\n✅ Test completed!');
        console.log(`   - Final username: ${user.username}`);
        console.log(`   - Bet ID saved: ${enhancedBet.betId}`);
        console.log(`   - Total active bets: ${user.activeBets.length}`);
        
    } catch (error) {
        console.error('❌ Error testing bet creation flow:', error);
    }
}

// Run the test
testBetCreationFlow(); 