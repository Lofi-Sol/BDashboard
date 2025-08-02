#!/usr/bin/env node

/**
 * Bet Confirmation Script - Corrected Logic
 * 
 * This script implements the proper bet confirmation flow:
 * 1. Bets are created manually through the betting dashboard (NOT from logs)
 * 2. Bets are saved with "pending" status in user-bets.json
 * 3. This script scans filtered-logs.json for confirmation data
 * 4. Only updates existing pending bets to "confirmed" status
 * 5. NEVER creates new bets from logs
 */

const fs = require('fs').promises;
const path = require('path');

// Data file paths
const USER_BETS_FILE = './data/user-bets.json';
const FILTERED_LOGS_FILE = './data/filtered-logs.json';

// Load user bets data
async function loadUserBetsData() {
    try {
        const data = await fs.readFile(USER_BETS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading user bets data:', error);
        return { users: {}, metadata: { version: "1.0", created: new Date().toISOString() } };
    }
}

// Save user bets data
async function saveUserBetsData(data) {
    try {
        data.metadata.lastUpdated = new Date().toISOString();
        await fs.writeFile(USER_BETS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving user bets data:', error);
        return false;
    }
}

// Load filtered logs data
async function loadFilteredLogsData() {
    try {
        const data = await fs.readFile(FILTERED_LOGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading filtered logs data:', error);
        return { logs: {}, metadata: { last_updated: new Date().toISOString() } };
    }
}

// Parse bet message from log
function parseBetMessage(message) {
    // Expected format: BET:warId:factionId:xanaxAmount:betId
    const betMatch = message.match(/^BET:(\d+):(\d+):(\d+):([A-Z0-9]+)$/);
    
    if (!betMatch) {
        return null;
    }
    
    const [, warId, factionId, xanaxAmount, betId] = betMatch;
    
    return {
        warId: parseInt(warId),
        factionId: parseInt(factionId),
        xanaxAmount: parseInt(xanaxAmount),
        betId: betId
    };
}

// Find matching confirmation log for a pending bet
function findMatchingConfirmationLog(pendingBet, logs) {
    for (const [logId, logEntry] of Object.entries(logs)) {
        // Check if this is a bet confirmation log
        if (logEntry.title === 'Item receive' && 
            logEntry.category === 'Item sending' &&
            logEntry.data && 
            logEntry.data.items) {
            
            // Check if any item is Xanax (ID: 206)
            const xanaxItem = logEntry.data.items.find(item => item.id === 206);
            
            if (xanaxItem && logEntry.data.message) {
                const betData = parseBetMessage(logEntry.data.message);
                
                if (betData) {
                    // Check if this log matches our pending bet
                    if (betData.betId === pendingBet.betId &&
                        betData.warId === parseInt(pendingBet.warId) &&
                        betData.factionId === parseInt(pendingBet.factionId) &&
                        betData.xanaxAmount === pendingBet.xanaxAmount) {
                        
                        return {
                            logEntry,
                            logId,
                            betData
                        };
                    }
                }
            }
        }
    }
    
    return null;
}

// Process bet confirmations from filtered logs
async function processBetConfirmations() {
    console.log('🔍 Processing bet confirmations from filtered logs...');
    console.log('📋 Corrected Logic: Only confirming existing pending bets, never creating new bets');
    
    try {
        // Load current data
        const userBetsData = await loadUserBetsData();
        const filteredLogsData = await loadFilteredLogsData();
        
        let confirmationsProcessed = 0;
        let pendingBetsFound = 0;
        let usersProcessed = 0;
        
        console.log(`📊 Starting confirmation process:`);
        console.log(`   - Users in system: ${Object.keys(userBetsData.users).length}`);
        console.log(`   - Filtered logs available: ${Object.keys(filteredLogsData.logs).length}`);
        
        // Process each user's pending bets
        Object.values(userBetsData.users).forEach(user => {
            if (!user.activeBets || user.activeBets.length === 0) {
                return;
            }
            
            // Find pending bets for this user
            const pendingBets = user.activeBets.filter(bet => bet.status === 'pending');
            
            if (pendingBets.length === 0) {
                return;
            }
            
            usersProcessed++;
            pendingBetsFound += pendingBets.length;
            
            console.log(`\n👤 User ${user.playerId} (${user.username || 'Unknown'}):`);
            console.log(`   - Total bets: ${user.activeBets.length}`);
            console.log(`   - Pending bets: ${pendingBets.length}`);
            
            pendingBets.forEach(pendingBet => {
                console.log(`   🔍 Checking bet ${pendingBet.betId}...`);
                
                // Look for matching confirmation log
                const matchingLog = findMatchingConfirmationLog(pendingBet, filteredLogsData.logs);
                
                if (matchingLog) {
                    // Confirm the bet
                    pendingBet.status = 'confirmed';
                    pendingBet.confirmedAt = matchingLog.logEntry.timestamp * 1000;
                    pendingBet.logId = matchingLog.logId;
                    pendingBet.senderId = matchingLog.logEntry.data.sender;
                    pendingBet.confirmedBy = matchingLog.logEntry.data.sender;
                    
                    console.log(`   ✅ Confirmed bet ${pendingBet.betId}:`);
                    console.log(`      - War: ${pendingBet.warId}`);
                    console.log(`      - Faction: ${pendingBet.factionName}`);
                    console.log(`      - Amount: ${pendingBet.xanaxAmount} Xanax`);
                    console.log(`      - Log ID: ${matchingLog.logId}`);
                    console.log(`      - Sender: ${matchingLog.logEntry.data.sender}`);
                    
                    confirmationsProcessed++;
                } else {
                    console.log(`   ⏳ No confirmation found for bet ${pendingBet.betId}`);
                }
            });
        });
        
        // Save updated data
        const saveSuccess = await saveUserBetsData(userBetsData);
        
        if (!saveSuccess) {
            throw new Error('Failed to save updated user bets data');
        }
        
        console.log(`\n📊 Confirmation Summary:`);
        console.log(`   - Users processed: ${usersProcessed}`);
        console.log(`   - Pending bets found: ${pendingBetsFound}`);
        console.log(`   - Confirmations processed: ${confirmationsProcessed}`);
        console.log(`   - Filtered logs scanned: ${Object.keys(filteredLogsData.logs).length}`);
        
        if (confirmationsProcessed > 0) {
            console.log(`\n✅ Successfully confirmed ${confirmationsProcessed} bets!`);
        } else {
            console.log(`\nℹ️  No new confirmations found. All pending bets remain pending.`);
        }
        
        return {
            success: true,
            usersProcessed,
            pendingBetsFound,
            confirmationsProcessed,
            totalLogsScanned: Object.keys(filteredLogsData.logs).length
        };
        
    } catch (error) {
        console.error('❌ Error processing bet confirmations:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Get confirmation statistics
async function getConfirmationStats() {
    try {
        const userBetsData = await loadUserBetsData();
        const filteredLogsData = await loadFilteredLogsData();
        
        let totalPendingBets = 0;
        let totalConfirmedBets = 0;
        let totalUsers = 0;
        let totalBets = 0;
        
        Object.values(userBetsData.users).forEach(user => {
            if (user.activeBets && user.activeBets.length > 0) {
                totalUsers++;
                totalBets += user.activeBets.length;
                
                const pendingBets = user.activeBets.filter(bet => bet.status === 'pending');
                const confirmedBets = user.activeBets.filter(bet => bet.status === 'confirmed');
                
                totalPendingBets += pendingBets.length;
                totalConfirmedBets += confirmedBets.length;
            }
        });
        
        return {
            totalUsers,
            totalBets,
            totalPendingBets,
            totalConfirmedBets,
            totalFilteredLogs: Object.keys(filteredLogsData.logs).length,
            lastUpdated: userBetsData.metadata?.lastUpdated || 'Unknown'
        };
        
    } catch (error) {
        console.error('Error getting confirmation stats:', error);
        return null;
    }
}

// Main execution
async function main() {
    console.log('🎯 Bet Confirmation Script - Corrected Logic');
    console.log('============================================');
    console.log('');
    console.log('📋 Process Flow:');
    console.log('   1. Load existing user bets (pending status)');
    console.log('   2. Scan filtered logs for confirmation data');
    console.log('   3. Match pending bets with confirmation logs');
    console.log('   4. Update status from "pending" to "confirmed"');
    console.log('   5. NEVER create new bets from logs');
    console.log('');
    
    // Get initial stats
    const initialStats = await getConfirmationStats();
    if (initialStats) {
        console.log('📊 Initial Statistics:');
        console.log(`   - Users: ${initialStats.totalUsers}`);
        console.log(`   - Total bets: ${initialStats.totalBets}`);
        console.log(`   - Pending bets: ${initialStats.totalPendingBets}`);
        console.log(`   - Confirmed bets: ${initialStats.totalConfirmedBets}`);
        console.log(`   - Filtered logs: ${initialStats.totalFilteredLogs}`);
        console.log('');
    }
    
    // Process confirmations
    const result = await processBetConfirmations();
    
    if (result.success) {
        console.log('\n✅ Confirmation processing completed successfully!');
        
        // Get final stats
        const finalStats = await getConfirmationStats();
        if (finalStats) {
            console.log('\n📊 Final Statistics:');
            console.log(`   - Users: ${finalStats.totalUsers}`);
            console.log(`   - Total bets: ${finalStats.totalBets}`);
            console.log(`   - Pending bets: ${finalStats.totalPendingBets}`);
            console.log(`   - Confirmed bets: ${finalStats.totalConfirmedBets}`);
            console.log(`   - Filtered logs: ${finalStats.totalFilteredLogs}`);
        }
        
        process.exit(0);
    } else {
        console.error('\n❌ Confirmation processing failed:', result.error);
        process.exit(1);
    }
}

// Export functions for use in other modules
module.exports = { 
    processBetConfirmations,
    getConfirmationStats,
    loadUserBetsData,
    saveUserBetsData
};

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
} 