#!/usr/bin/env node

/**
 * Process bet confirmations from filtered logs
 * This script is called from GitHub Actions workflows
 */

const fs = require('fs');
const path = require('path');

try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Load bet logs
    let betLogsData = { bet_logs: [], processed_logs: [], metadata: {} };
    try {
        const betLogsContent = fs.readFileSync(path.join(dataDir, 'bet-logs.json'), 'utf8');
        betLogsData = JSON.parse(betLogsContent);
    } catch (error) {
        console.log('No bet-logs.json found');
        process.exit(0);
    }
    
    // Load bets data
    let betsData = { active_bets: [], completed_bets: [], statistics: {}, metadata: {} };
    try {
        const betsContent = fs.readFileSync(path.join(dataDir, 'bets.json'), 'utf8');
        betsData = JSON.parse(betsContent);
    } catch (error) {
        console.log('No bets.json found, creating new file');
    }
    
    // Find unprocessed bet logs
    const unprocessedBetLogs = betLogsData.bet_logs.filter(log => !log.processed);
    console.log(`Found ${unprocessedBetLogs.length} unprocessed bet logs`);
    
    let confirmationsProcessed = 0;
    let newBetsAdded = 0;
    
    // Process each unprocessed bet log
    unprocessedBetLogs.forEach(betLog => {
        // Check if this bet already exists in active bets
        const existingBet = betsData.active_bets.find(bet => bet.betId === betLog.betId);
        
        if (existingBet) {
            // Update existing bet status to confirmed
            existingBet.status = 'confirmed';
            existingBet.logId = betLog.logId;
            existingBet.confirmedAt = betLog.timestamp * 1000; // Convert to milliseconds
            existingBet.senderId = betLog.sender;
            existingBet.confirmedBy = betLog.sender;
            
            console.log(`✅ Confirmed existing bet: ${betLog.betId} (War: ${betLog.warId}, Faction: ${betLog.factionId}, Xanax: ${betLog.xanaxAmount})`);
            confirmationsProcessed++;
        } else {
            // Create new bet entry from log
            const newBet = {
                betId: betLog.betId,
                playerId: betLog.sender,
                warId: betLog.warId,
                factionId: betLog.factionId,
                xanaxAmount: betLog.xanaxAmount,
                betAmount: betLog.xanaxAmount * 744983, // Xanax price
                status: 'confirmed',
                timestamp: betLog.timestamp * 1000,
                logId: betLog.logId,
                confirmedAt: betLog.timestamp * 1000,
                senderId: betLog.sender,
                confirmedBy: betLog.sender,
                message: betLog.message
            };
            
            betsData.active_bets.unshift(newBet);
            console.log(`➕ Added new confirmed bet: ${betLog.betId} (War: ${betLog.warId}, Faction: ${betLog.factionId}, Xanax: ${betLog.xanaxAmount})`);
            newBetsAdded++;
        }
        
        // Mark bet log as processed
        betLog.processed = true;
    });
    
    // Update statistics
    const pendingBets = betsData.active_bets.filter(bet => bet.status === 'pending');
    const confirmedBets = betsData.active_bets.filter(bet => bet.status === 'confirmed');
    const wonBets = betsData.active_bets.filter(bet => bet.status === 'won');
    const lostBets = betsData.active_bets.filter(bet => bet.status === 'lost');
    
    betsData.statistics = {
        total_bets: betsData.active_bets.length + betsData.completed_bets.length,
        total_volume: betsData.active_bets.reduce((sum, bet) => sum + (bet.betAmount || 0), 0),
        pending_bets: pendingBets.length,
        confirmed_bets: confirmedBets.length,
        won_bets: wonBets.length,
        lost_bets: lostBets.length,
        total_payouts: wonBets.reduce((sum, bet) => sum + (bet.payoutAmount || 0), 0),
        total_profit: wonBets.reduce((sum, bet) => sum + (bet.payoutAmount || 0), 0) - 
                     lostBets.reduce((sum, bet) => sum + (bet.betAmount || 0), 0),
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
    
    // Update bet logs metadata
    betLogsData.metadata = {
        last_updated: new Date().toISOString(),
        total_bet_logs: betLogsData.bet_logs.length,
        total_processed_logs: betLogsData.processed_logs.length,
        new_bet_logs_found: 0,
        new_processed_logs: 0,
        run_timestamp: new Date().toISOString(),
        confirmations_processed: confirmationsProcessed,
        new_bets_added: newBetsAdded
    };
    
    // Save updated data
    fs.writeFileSync(path.join(dataDir, 'bets.json'), JSON.stringify(betsData, null, 2));
    fs.writeFileSync(path.join(dataDir, 'bet-logs.json'), JSON.stringify(betLogsData, null, 2));
    
    console.log('✅ Bet confirmations processed');
    console.log(`Confirmations processed: ${confirmationsProcessed}`);
    console.log(`New bets added: ${newBetsAdded}`);
    console.log(`Total active bets: ${betsData.active_bets.length}`);
    console.log(`Pending bets: ${pendingBets.length}`);
    console.log(`Confirmed bets: ${confirmedBets.length}`);
    
} catch (error) {
    console.error('❌ Error processing bet confirmations:', error);
    process.exit(1);
} 