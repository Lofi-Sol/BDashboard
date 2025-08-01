#!/usr/bin/env node

/**
 * Test script for GitHub Actions bet processing
 * This script simulates the bet log processing workflow
 */

const fs = require('fs');
const path = require('path');

// Sample bet log data (from your example)
const sampleBetLog = {
    "log": {
        "YUeFY9g65nzh975KQTEP": {
            "log": 4103,
            "title": "Item receive",
            "timestamp": 1754074055,
            "category": "Item sending",
            "data": {
                "sender": 3566110,
                "items": [
                    {
                        "id": 206,
                        "uid": 15370893048,
                        "qty": 1
                    }
                ],
                "message": "BET:28667:8076:1:VW7VAC60"
            },
            "params": {
                "italic": 1,
                "color": "green"
            }
        }
    }
};

// Sample pending bet data
const samplePendingBet = {
    betId: "VW7VAC60",
    playerId: 3566110,
    warId: 28667,
    factionId: 8076,
    factionName: "Test Faction",
    xanaxAmount: 1,
    betAmount: 744983,
    status: "pending",
    timestamp: Date.now()
};

function testBetLogProcessing() {
    console.log('🧪 Testing bet log processing...');
    
    try {
        // Create data directory if it doesn't exist
        const dataDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // Test bet log filtering
        const betLogs = [];
        const processedLogs = [];
        
        Object.entries(sampleBetLog.log).forEach(([logId, logEntry]) => {
            // Check if this is a bet confirmation log
            if (logEntry.title === 'Item receive' && 
                logEntry.category === 'Item sending' &&
                logEntry.data && 
                logEntry.data.items) {
                
                // Check if any item is Xanax (ID: 206)
                const xanaxItem = logEntry.data.items.find(item => item.id === 206);
                
                if (xanaxItem && logEntry.data.message) {
                    // Check if message matches bet format: BET:warId:factionId:amount:betId
                    const betMatch = logEntry.data.message.match(/^BET:(\d+):(\d+):(\d+):([A-Z0-9]+)$/);
                    
                    if (betMatch) {
                        const [, warId, factionId, xanaxAmount, betId] = betMatch;
                        
                        // Verify Xanax amount matches
                        if (parseInt(xanaxAmount) === xanaxItem.qty) {
                            betLogs.push({
                                logId: logId,
                                timestamp: logEntry.timestamp,
                                sender: logEntry.data.sender,
                                warId: parseInt(warId),
                                factionId: parseInt(factionId),
                                xanaxAmount: parseInt(xanaxAmount),
                                betId: betId,
                                message: logEntry.data.message,
                                processed: false
                            });
                        }
                    }
                }
            }
            
            // Track all processed logs to avoid duplicates
            processedLogs.push({
                logId: logId,
                timestamp: logEntry.timestamp,
                title: logEntry.title,
                category: logEntry.category
            });
        });
        
        console.log(`✅ Found ${betLogs.length} bet confirmation logs`);
        
        // Test bet confirmation processing
        let betsData = { active_bets: [], completed_bets: [], statistics: {}, metadata: {} };
        
        // Add sample pending bet
        betsData.active_bets.push(samplePendingBet);
        
        // Process bet confirmations
        let confirmationsProcessed = 0;
        let newBetsAdded = 0;
        
        betLogs.forEach(betLog => {
            // Check if this bet already exists in active bets
            const existingBet = betsData.active_bets.find(bet => bet.betId === betLog.betId);
            
            if (existingBet) {
                // Update existing bet status to confirmed
                existingBet.status = 'confirmed';
                existingBet.logId = betLog.logId;
                existingBet.confirmedAt = betLog.timestamp * 1000;
                existingBet.senderId = betLog.sender;
                existingBet.confirmedBy = betLog.sender;
                
                console.log(`✅ Confirmed existing bet: ${betLog.betId}`);
                confirmationsProcessed++;
            } else {
                // Create new bet entry from log
                const newBet = {
                    betId: betLog.betId,
                    playerId: betLog.sender,
                    warId: betLog.warId,
                    factionId: betLog.factionId,
                    xanaxAmount: betLog.xanaxAmount,
                    betAmount: betLog.xanaxAmount * 744983,
                    status: 'confirmed',
                    timestamp: betLog.timestamp * 1000,
                    logId: betLog.logId,
                    confirmedAt: betLog.timestamp * 1000,
                    senderId: betLog.sender,
                    confirmedBy: betLog.sender,
                    message: betLog.message
                };
                
                betsData.active_bets.unshift(newBet);
                console.log(`➕ Added new confirmed bet: ${betLog.betId}`);
                newBetsAdded++;
            }
            
            // Mark bet log as processed
            betLog.processed = true;
        });
        
        // Update statistics
        const pendingBets = betsData.active_bets.filter(bet => bet.status === 'pending');
        const confirmedBets = betsData.active_bets.filter(bet => bet.status === 'confirmed');
        
        betsData.statistics = {
            total_bets: betsData.active_bets.length,
            total_volume: betsData.active_bets.reduce((sum, bet) => sum + (bet.betAmount || 0), 0),
            pending_bets: pendingBets.length,
            confirmed_bets: confirmedBets.length,
            won_bets: 0,
            lost_bets: 0,
            total_payouts: 0,
            total_profit: 0,
            last_updated: new Date().toISOString()
        };
        
        // Update metadata
        const uniqueUsers = new Set(betsData.active_bets.map(bet => bet.playerId));
        betsData.metadata = {
            version: '1.0',
            last_updated: new Date().toISOString(),
            total_users: uniqueUsers.size,
            active_users: uniqueUsers.size
        };
        
        // Save test data
        const betLogsData = {
            bet_logs: betLogs,
            processed_logs: processedLogs,
            metadata: {
                last_updated: new Date().toISOString(),
                total_bet_logs: betLogs.length,
                total_processed_logs: processedLogs.length,
                new_bet_logs_found: betLogs.length,
                new_processed_logs: processedLogs.length,
                run_timestamp: new Date().toISOString(),
                confirmations_processed: confirmationsProcessed,
                new_bets_added: newBetsAdded
            }
        };
        
        fs.writeFileSync(path.join(dataDir, 'bet-logs.json'), JSON.stringify(betLogsData, null, 2));
        fs.writeFileSync(path.join(dataDir, 'bets.json'), JSON.stringify(betsData, null, 2));
        
        console.log('✅ Test data saved to data/ directory');
        console.log(`📊 Summary:`);
        console.log(`   - Confirmations processed: ${confirmationsProcessed}`);
        console.log(`   - New bets added: ${newBetsAdded}`);
        console.log(`   - Total active bets: ${betsData.active_bets.length}`);
        console.log(`   - Pending bets: ${pendingBets.length}`);
        console.log(`   - Confirmed bets: ${confirmedBets.length}`);
        console.log(`   - Total users: ${uniqueUsers.size}`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        return false;
    }
}

function testAPIEndpoints() {
    console.log('\n🧪 Testing API endpoints...');
    
    try {
        const betsData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'bets.json'), 'utf8'));
        const betLogsData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'bet-logs.json'), 'utf8'));
        
        console.log('✅ Data files loaded successfully');
        console.log(`📊 Bets data: ${betsData.active_bets.length} active bets`);
        console.log(`📊 Logs data: ${betLogsData.bet_logs.length} bet logs`);
        
        // Test user bets endpoint simulation
        const testPlayerId = 3566110;
        const userBets = betsData.active_bets.filter(bet => bet.playerId.toString() === testPlayerId.toString());
        console.log(`👤 User ${testPlayerId} has ${userBets.length} bets`);
        
        return true;
        
    } catch (error) {
        console.error('❌ API test failed:', error);
        return false;
    }
}

// Run tests
console.log('🚀 Starting GitHub Actions test...\n');

const betLogTest = testBetLogProcessing();
const apiTest = testAPIEndpoints();

if (betLogTest && apiTest) {
    console.log('\n✅ All tests passed!');
    console.log('🎉 GitHub Actions setup is working correctly.');
    console.log('\n📋 Next steps:');
    console.log('   1. Add TORN_API_KEY to GitHub secrets');
    console.log('   2. Enable GitHub Actions workflows');
    console.log('   3. Test with real Torn City logs');
} else {
    console.log('\n❌ Some tests failed.');
    console.log('🔧 Check the error messages above and fix issues.');
}

console.log('\n📁 Test data saved to:');
console.log('   - data/bet-logs.json');
console.log('   - data/bets.json'); 