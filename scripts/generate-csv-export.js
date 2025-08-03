const fs = require('fs');
const path = require('path');

// Generate CSV export with confirmed bets
function generateCSVExport() {
    console.log('📊 Generating CSV Export with Confirmed Bets');
    console.log('============================================');
    
    try {
        // Read the user-bets.json file
        const jsonPath = path.join(__dirname, '../data/user-bets.json');
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        
        // Ensure sheets-export directory exists
        const exportDir = path.join(__dirname, '../data/sheets-export');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }
        
        // 1. Generate Active Bets CSV
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
        
        const betHeaders = [
            'playerId', 'username', 'betId', 'warId', 'factionId', 'factionName',
            'xanaxAmount', 'betAmount', 'odds', 'potentialPayout', 'status',
            'timestamp', 'placedAt'
        ];
        
        const betCSV = [betHeaders];
        activeBets.forEach(bet => {
            betCSV.push([
                bet.playerId,
                bet.username,
                bet.betId,
                bet.warId,
                bet.factionId,
                bet.factionName,
                bet.xanaxAmount,
                bet.betAmount,
                bet.odds,
                bet.potentialPayout,
                bet.status,
                bet.timestamp,
                bet.placedAt
            ]);
        });
        
        fs.writeFileSync(
            path.join(exportDir, 'active-bets.csv'),
            betCSV.map(row => row.join(',')).join('\n')
        );
        
        console.log(`✅ Generated active-bets.csv with ${activeBets.length} bets`);
        console.log(`   - Confirmed bets: ${activeBets.filter(bet => bet.status === 'confirmed').length}`);
        console.log(`   - Pending bets: ${activeBets.filter(bet => bet.status === 'pending').length}`);
        
        // 2. Generate User Profiles CSV
        const userProfiles = [];
        for (const [playerId, userData] of Object.entries(jsonData.users)) {
            const profile = {
                playerId: userData.playerId,
                username: userData.username,
                joinDate: userData.profile.joinDate,
                totalBets: userData.profile.totalBets,
                totalVolume: userData.profile.totalVolume,
                totalWinnings: userData.profile.totalWinnings,
                totalLosses: userData.profile.totalLosses,
                netProfit: userData.profile.netProfit,
                winRate: userData.profile.winRate,
                averageBetSize: userData.profile.averageBetSize,
                largestBet: userData.profile.largestBet,
                favoriteFaction: userData.profile.favoriteFaction,
                lastActive: userData.profile.lastActive
            };
            userProfiles.push(profile);
        }
        
        const profileHeaders = [
            'playerId', 'username', 'joinDate', 'totalBets', 'totalVolume', 
            'totalWinnings', 'totalLosses', 'netProfit', 'winRate', 
            'averageBetSize', 'largestBet', 'favoriteFaction', 'lastActive'
        ];
        
        const profileCSV = [profileHeaders];
        userProfiles.forEach(profile => {
            profileCSV.push([
                profile.playerId,
                profile.username,
                profile.joinDate,
                profile.totalBets,
                profile.totalVolume,
                profile.totalWinnings,
                profile.totalLosses,
                profile.netProfit,
                profile.winRate,
                profile.averageBetSize,
                profile.largestBet,
                profile.favoriteFaction,
                profile.lastActive
            ]);
        });
        
        fs.writeFileSync(
            path.join(exportDir, 'user-profiles.csv'),
            profileCSV.map(row => row.join(',')).join('\n')
        );
        
        console.log(`✅ Generated user-profiles.csv with ${userProfiles.length} users`);
        
        // Show confirmed bets in the export
        const confirmedBets = activeBets.filter(bet => bet.status === 'confirmed');
        if (confirmedBets.length > 0) {
            console.log('\n✅ Confirmed bets included in export:');
            confirmedBets.forEach(bet => {
                console.log(`   - ${bet.username}: Bet ${bet.betId} - ${bet.factionName} (${bet.xanaxAmount} Xanax)`);
            });
        }
        
        console.log('\n📁 CSV files generated in data/sheets-export/');
        console.log('   - active-bets.csv');
        console.log('   - user-profiles.csv');
        
    } catch (error) {
        console.error('❌ Error generating CSV export:', error.message);
    }
}

// Run the export
generateCSVExport(); 