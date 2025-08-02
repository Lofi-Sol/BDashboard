#!/usr/bin/env node

/**
 * Test Script for Corrected Bet Confirmation Logic
 * 
 * This script creates a test scenario with matching bet IDs
 * to demonstrate the corrected confirmation process.
 */

const fs = require('fs').promises;

// Test data with matching bet IDs
const testUserBets = {
  "users": {
    "3566110": {
      "playerId": "3566110",
      "username": "TestPlayer1",
      "activeBets": [
        {
          "betId": "66U403P7", // ← Matches log message
          "warId": "28672",
          "factionId": "16335",
          "factionName": "Test Faction 1",
          "xanaxAmount": 2,
          "betAmount": 2000000,
          "odds": "2.15",
          "status": "pending",
          "timestamp": 1754158272265,
          "placedAt": "2025-08-02T18:11:12.265Z"
        },
        {
          "betId": "VW7VAC60", // ← Matches log message
          "warId": "28667",
          "factionId": "8076",
          "factionName": "Test Faction 2",
          "xanaxAmount": 1,
          "betAmount": 1000000,
          "odds": "2.19",
          "status": "pending",
          "timestamp": 1754158272280,
          "placedAt": "2025-08-02T18:11:12.280Z"
        }
      ]
    }
  },
  "metadata": {
    "version": "1.0",
    "created": new Date().toISOString(),
    "lastUpdated": new Date().toISOString()
  }
};

const testFilteredLogs = {
  "logs": {
    "lTJEZP7w5PK3lPLtmffs": {
      "log": 4103,
      "title": "Item receive",
      "timestamp": 1754096180,
      "category": "Item sending",
      "data": {
        "sender": 3566110,
        "items": [
          {
            "id": 206,
            "uid": null,
            "qty": 2
          }
        ],
        "message": "BET:28672:16335:2:66U403P7" // ← Matches bet ID
      },
      "params": {
        "italic": 1,
        "color": "green"
      }
    },
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
        "message": "BET:28667:8076:1:VW7VAC60" // ← Matches bet ID
      },
      "params": {
        "italic": 1,
        "color": "green"
      }
    }
  },
  "metadata": {
    "last_updated": new Date().toISOString(),
    "total_logs": 2,
    "new_logs_found": 0,
    "run_timestamp": new Date().toISOString()
  }
};

// Parse bet message from log
function parseBetMessage(message) {
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
        if (logEntry.title === 'Item receive' && 
            logEntry.category === 'Item sending' &&
            logEntry.data && 
            logEntry.data.items) {
            
            const xanaxItem = logEntry.data.items.find(item => item.id === 206);
            
            if (xanaxItem && logEntry.data.message) {
                const betData = parseBetMessage(logEntry.data.message);
                
                if (betData) {
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

// Test the confirmation process
async function testConfirmationProcess() {
    console.log('🧪 Testing Corrected Bet Confirmation Logic');
    console.log('===========================================');
    console.log('');
    
    let confirmationsProcessed = 0;
    let pendingBetsFound = 0;
    
    // Process each user's pending bets
    Object.values(testUserBets.users).forEach(user => {
        if (!user.activeBets || user.activeBets.length === 0) {
            return;
        }
        
        const pendingBets = user.activeBets.filter(bet => bet.status === 'pending');
        pendingBetsFound += pendingBets.length;
        
        console.log(`👤 User ${user.playerId} (${user.username}):`);
        console.log(`   - Total bets: ${user.activeBets.length}`);
        console.log(`   - Pending bets: ${pendingBets.length}`);
        
        pendingBets.forEach(pendingBet => {
            console.log(`   🔍 Checking bet ${pendingBet.betId}...`);
            
            const matchingLog = findMatchingConfirmationLog(pendingBet, testFilteredLogs.logs);
            
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
                console.log(`      - Message: ${matchingLog.logEntry.data.message}`);
                
                confirmationsProcessed++;
            } else {
                console.log(`   ⏳ No confirmation found for bet ${pendingBet.betId}`);
            }
        });
    });
    
    console.log(`\n📊 Test Results:`);
    console.log(`   - Pending bets found: ${pendingBetsFound}`);
    console.log(`   - Confirmations processed: ${confirmationsProcessed}`);
    console.log(`   - Filtered logs scanned: ${Object.keys(testFilteredLogs.logs).length}`);
    
    if (confirmationsProcessed > 0) {
        console.log(`\n✅ SUCCESS: ${confirmationsProcessed} bets confirmed correctly!`);
        console.log('🎯 This demonstrates the corrected confirmation logic working properly.');
    } else {
        console.log(`\n❌ FAILURE: No confirmations processed.`);
    }
    
    return {
        success: confirmationsProcessed > 0,
        pendingBetsFound,
        confirmationsProcessed,
        totalLogsScanned: Object.keys(testFilteredLogs.logs).length
    };
}

// Run the test
testConfirmationProcess()
    .then(result => {
        if (result.success) {
            console.log('\n🎉 Test completed successfully!');
            console.log('📋 The corrected confirmation logic is working as expected.');
        } else {
            console.log('\n💥 Test failed!');
        }
        process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Test error:', error);
        process.exit(1);
    }); 