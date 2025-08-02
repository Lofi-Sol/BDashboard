const fs = require('fs').promises;
const path = require('path');

async function clearAllBets() {
    try {
        console.log('🧹 Clearing all bets from user-bets.json...\n');
        
        // Load current user bets data
        const userBetsPath = path.join(__dirname, '../data/user-bets.json');
        const userBetsData = JSON.parse(await fs.readFile(userBetsPath, 'utf8'));
        
        console.log('📊 Current state:');
        console.log(`   - Total users: ${userBetsData.metadata.totalUsers}`);
        console.log(`   - Active users: ${userBetsData.metadata.activeUsers}`);
        console.log(`   - Total active bets: ${userBetsData.metadata.totalActiveBets}`);
        console.log(`   - Total volume: $${userBetsData.metadata.totalVolume.toLocaleString()}`);
        
        // Clear all bets for each user
        Object.values(userBetsData.users).forEach(user => {
            console.log(`\n👤 Clearing bets for ${user.username} (${user.playerId}):`);
            console.log(`   - Active bets: ${user.activeBets?.length || 0}`);
            console.log(`   - Bet history: ${user.betHistory?.length || 0}`);
            
            // Clear active bets
            user.activeBets = [];
            
            // Clear bet history
            user.betHistory = [];
            
            // Reset profile statistics
            user.profile.totalBets = 0;
            user.profile.totalVolume = 0;
            user.profile.totalWinnings = 0;
            user.profile.totalLosses = 0;
            user.profile.netProfit = 0;
            user.profile.winRate = 0;
            user.profile.averageBetSize = 0;
            user.profile.largestBet = 0;
            user.profile.favoriteFaction = "";
            
            // Clear statistics
            user.statistics.byWar = {};
            user.statistics.byFaction = {};
            user.statistics.byMonth = {};
            user.statistics.byWeek = {};
            user.statistics.byDay = {};
            
            console.log(`   ✅ Cleared all bets and reset statistics`);
        });
        
        // Update metadata
        userBetsData.metadata.activeUsers = 0;
        userBetsData.metadata.totalActiveBets = 0;
        userBetsData.metadata.totalVolume = 0;
        userBetsData.metadata.lastUpdated = new Date().toISOString();
        
        // Save the cleared data
        await fs.writeFile(userBetsPath, JSON.stringify(userBetsData, null, 2));
        
        console.log('\n✅ Successfully cleared all bets!');
        console.log('\n📊 New state:');
        console.log(`   - Total users: ${userBetsData.metadata.totalUsers}`);
        console.log(`   - Active users: ${userBetsData.metadata.activeUsers}`);
        console.log(`   - Total active bets: ${userBetsData.metadata.totalActiveBets}`);
        console.log(`   - Total volume: $${userBetsData.metadata.totalVolume.toLocaleString()}`);
        
    } catch (error) {
        console.error('❌ Error clearing bets:', error);
    }
}

// Run the clear function
clearAllBets(); 