#!/usr/bin/env node

/**
 * Process and filter Torn City logs for bet confirmations
 * This script is called from GitHub Actions workflows
 */

const fs = require('fs');
const path = require('path');

// Get logs response from command line argument
const logsResponse = process.argv[2];

if (!logsResponse) {
    console.error('No logs response provided');
    process.exit(1);
}

try {
    const data = JSON.parse(logsResponse);
    
    if (!data.log) {
        console.log('No logs found in response');
        process.exit(0);
    }
    
    const betLogs = [];
    const processedLogs = [];
    
    // Process each log entry
    Object.entries(data.log).forEach(([logId, logEntry]) => {
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
    
    console.log(`Found ${betLogs.length} bet confirmation logs`);
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Load existing bet logs data
    let existingData = { bet_logs: [], processed_logs: [], metadata: {} };
    try {
        const existingContent = fs.readFileSync(path.join(dataDir, 'bet-logs.json'), 'utf8');
        existingData = JSON.parse(existingContent);
    } catch (error) {
        console.log('No existing bet-logs.json found, creating new file');
    }
    
    // Add new bet logs (avoid duplicates)
    const existingLogIds = new Set(existingData.bet_logs.map(log => log.logId));
    const newBetLogs = betLogs.filter(log => !existingLogIds.has(log.logId));
    
    if (newBetLogs.length > 0) {
        existingData.bet_logs.push(...newBetLogs);
        console.log(`Added ${newBetLogs.length} new bet logs`);
    }
    
    // Update processed logs
    const existingProcessedIds = new Set(existingData.processed_logs.map(log => log.logId));
    const newProcessedLogs = processedLogs.filter(log => !existingProcessedIds.has(log.logId));
    
    if (newProcessedLogs.length > 0) {
        existingData.processed_logs.push(...newProcessedLogs);
    }
    
    // Update metadata
    existingData.metadata = {
        last_updated: new Date().toISOString(),
        total_bet_logs: existingData.bet_logs.length,
        total_processed_logs: existingData.processed_logs.length,
        new_bet_logs_found: newBetLogs.length,
        new_processed_logs: newProcessedLogs.length,
        run_timestamp: new Date().toISOString()
    };
    
    // Write updated data
    fs.writeFileSync(path.join(dataDir, 'bet-logs.json'), JSON.stringify(existingData, null, 2));
    
    console.log('✅ Bet logs processed and saved');
    console.log(`Total bet logs: ${existingData.bet_logs.length}`);
    console.log(`Total processed logs: ${existingData.processed_logs.length}`);
    
} catch (error) {
    console.error('❌ Error processing logs:', error);
    process.exit(1);
} 