const GitHubBetsAPI = require('./github-bets-api.js');

async function processGlobalBetConfirmations() {
    console.log('🌍 Starting global bet confirmation process...');
    
    try {
        const githubAPI = new GitHubBetsAPI();
        
        // Get current user bets from GitHub
        console.log('📥 Fetching user bets from GitHub...');
        const userBetsData = await githubAPI.getUserBets();
        
        // Get filtered logs from GitHub
        console.log('📥 Fetching filtered logs from GitHub...');
        const filteredLogsData = await githubAPI.getFilteredLogs();
        
        console.log(`📊 Found ${Object.keys(userBetsData.users).length} users with bets`);
        console.log(`📊 Found ${Object.keys(filteredLogsData.logs).length} filtered logs`);
        
        let confirmedCount = 0;
        let pendingCount = 0;
        
        // Process each user's pending bets
        for (const [playerId, user] of Object.entries(userBetsData.users)) {
            const pendingBets = user.activeBets.filter(bet => bet.status === 'pending');
            
            if (pendingBets.length === 0) {
                continue;
            }
            
            console.log(`\n👤 Processing ${pendingBets.length} pending bets for ${user.username} (${playerId})`);
            
            for (const bet of pendingBets) {
                const matchingLog = findMatchingConfirmationLog(bet, filteredLogsData.logs);
                
                if (matchingLog) {
                    console.log(`✅ Confirming bet ${bet.betId} - Found matching log: ${matchingLog.id}`);
                    
                    try {
                        await githubAPI.confirmBet(bet.betId, playerId);
                        confirmedCount++;
                    } catch (error) {
                        console.error(`❌ Error confirming bet ${bet.betId}:`, error.message);
                    }
                } else {
                    console.log(`⏳ Bet ${bet.betId} still pending - No confirmation log found`);
                    pendingCount++;
                }
            }
        }
        
        console.log(`\n🎯 Confirmation Summary:`);
        console.log(`✅ Confirmed: ${confirmedCount} bets`);
        console.log(`⏳ Still pending: ${pendingCount} bets`);
        
        if (confirmedCount > 0) {
            console.log('🔄 Updated user-bets.json on GitHub with confirmed bets');
        }
        
    } catch (error) {
        console.error('❌ Error in global bet confirmation process:', error.message);
        process.exit(1);
    }
}

// Find matching confirmation log for a bet
function findMatchingConfirmationLog(bet, logs) {
    const betMessage = `BET:${bet.warId}:${bet.factionId}:${bet.xanaxAmount}:${bet.betId}`;
    
    for (const [logId, log] of Object.entries(logs)) {
        if (log.type === 'Item Sent' && 
            log.item === 'Xanax' && 
            log.quantity === bet.xanaxAmount &&
            log.message === betMessage) {
            return { id: logId, ...log };
        }
    }
    
    return null;
}

// Run the confirmation process
if (require.main === module) {
    processGlobalBetConfirmations()
        .then(() => {
            console.log('✅ Global bet confirmation process completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Global bet confirmation process failed:', error);
            process.exit(1);
        });
}

module.exports = { processGlobalBetConfirmations, findMatchingConfirmationLog }; 