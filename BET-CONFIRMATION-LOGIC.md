# Bet Confirmation Logic - Corrected Implementation

## Overview

This document explains the **corrected bet confirmation logic** that ensures bets are only created manually through the betting dashboard, and filtered logs are used exclusively for confirmation purposes.

## ❌ Previous Incorrect Understanding

The system was incorrectly creating new bets from filtered logs, which violated the intended workflow.

## ✅ Corrected Data Flow

### 1. Bet Creation Process (User-Initiated)

```
User places bet manually → Through betting dashboard interface
Bet saved to user-bets.json → Contains bet details with "pending" status
User sends Xanax separately → Manual transfer in Torn City with bet message
System awaits confirmation → Bet remains "pending" until transfer detected
```

### 2. Bet Confirmation Process (Log-Based Verification)

```
GitHub Actions collects logs → Fetches Torn API logs every 10 minutes
Filters for relevant transfers → Only "Item Sent" logs with Xanax + "BET:" messages
Saves to filtered-logs.json → Raw confirmation data, NOT bet creation
Confirmation matching runs → Scans filtered logs to verify pending bets
```

## 🔧 Implementation Details

### Bet Creation (Manual Only)

**Location**: `Betting/bettingdashboard.html`
**Function**: `placeBetNow()`

```javascript
// User places bet through dashboard
function placeBetNow() {
    // ... validation logic ...
    
    // Save bet to localStorage for tracking immediately
    const betResult = saveBetToTracking(selectedBet.marketId, factionId, xanaxAmount, faction.name);
    
    // Show success message with bet message for Torn City
    const betMessage = `BET:${selectedBet.marketId}:${factionId}:${xanaxAmount}:${betResult.betId}`;
}
```

**Data Storage**: 
- Saved to `user-bets.json` with `status: "pending"`
- Bet message provided to user for Torn City transfer

### Bet Confirmation (Automated)

**Location**: `scripts/confirm-bets.js`
**Function**: `processBetConfirmations()`

```javascript
// Process bet confirmations from filtered logs
async function processBetConfirmations() {
    // Load existing user bets (pending status)
    const userBetsData = await loadUserBetsData();
    const filteredLogsData = await loadFilteredLogsData();
    
    // Process each user's pending bets
    Object.values(userBetsData.users).forEach(user => {
        const pendingBets = user.activeBets.filter(bet => bet.status === 'pending');
        
        pendingBets.forEach(pendingBet => {
            // Look for matching confirmation log
            const matchingLog = findMatchingConfirmationLog(pendingBet, filteredLogsData.logs);
            
            if (matchingLog) {
                // Confirm the bet (update status only)
                pendingBet.status = 'confirmed';
                pendingBet.confirmedAt = matchingLog.logEntry.timestamp * 1000;
                pendingBet.logId = matchingLog.logId;
                pendingBet.senderId = matchingLog.logEntry.data.sender;
            }
        });
    });
}
```

## 📊 Data Files Structure

### user-bets.json
```json
{
  "users": {
    "3566110": {
      "playerId": "3566110",
      "username": "TornPlayer1",
      "activeBets": [
        {
          "betId": "IU6M1PHZ",
          "warId": "28672",
          "factionId": "16335",
          "factionName": "SMTH - November Chopin",
          "xanaxAmount": 2,
          "betAmount": 2000000,
          "odds": "2.15",
          "status": "pending", // ← Starts as pending
          "timestamp": 1754158272265,
          "placedAt": "2025-08-02T18:11:12.265Z"
        }
      ]
    }
  }
}
```

### filtered-logs.json
```json
{
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
            "id": 206, // Xanax ID
            "qty": 2
          }
        ],
        "message": "BET:28672:16335:2:IU6M1PHZ" // ← Confirmation message
      }
    }
  }
}
```

## 🔍 Confirmation Matching Logic

### Expected Bet Message Format
```
BET:warId:factionId:xanaxAmount:betId
```

### Matching Criteria
1. **Log Type**: `title: "Item receive"` AND `category: "Item sending"`
2. **Item Type**: Contains Xanax (ID: 206)
3. **Message Format**: Matches `BET:warId:factionId:xanaxAmount:betId`
4. **Bet Match**: All fields must match existing pending bet

### Matching Function
```javascript
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
                        
                        return { logEntry, logId, betData };
                    }
                }
            }
        }
    }
    
    return null;
}
```

## 🚀 Usage

### Manual Bet Placement
1. User opens betting dashboard
2. Selects war and faction
3. Enters Xanax amount
4. Clicks "Place Bet"
5. System generates bet message: `BET:28672:16335:2:IU6M1PHZ`
6. User copies message and sends Xanax in Torn City
7. Bet saved with `status: "pending"`

### Automated Confirmation
1. GitHub Actions runs every 10 minutes
2. Fetches Torn API logs
3. Filters for Xanax transfers with "BET:" messages
4. Saves to `filtered-logs.json`
5. Runs `scripts/confirm-bets.js`
6. Matches pending bets with confirmation logs
7. Updates status from "pending" to "confirmed"

### Running Confirmation Script
```bash
# Run confirmation processing
node scripts/confirm-bets.js

# Expected output:
# 🎯 Bet Confirmation Script - Corrected Logic
# 📊 Initial Statistics:
#    - Users: 2
#    - Total bets: 5
#    - Pending bets: 3
#    - Confirmed bets: 2
#    - Filtered logs: 4
# 
# ✅ Confirmed bet IU6M1PHZ for user 3566110
# ✅ Confirmed bet SKKHT3D3 for user 3566110
# 
# 📊 Confirmation Summary:
#    - Users processed: 2
#    - Pending bets found: 3
#    - Confirmations processed: 2
#    - Filtered logs scanned: 4
```

## ✅ Key Principles

1. **Bets are NEVER created from logs** - Only from manual user input
2. **Filtered logs are ONLY for confirmation** - Not bet creation
3. **Pending bets must exist first** - Before any confirmation can occur
4. **Status changes only** - From "pending" to "confirmed"
5. **Exact matching required** - All bet fields must match log data

## 🔧 Files Modified

- `scripts/fetch-faction-data.js` - Updated with confirmation logic
- `scripts/confirm-bets.js` - New dedicated confirmation script
- `server.js` - Updated bet creation and confirmation functions
- `Betting/bettingdashboard.html` - Manual bet placement interface

## 📝 Testing

### Test Confirmation Process
```bash
# Run the confirmation script
node scripts/confirm-bets.js

# Check results
cat data/user-bets.json | jq '.users["3566110"].activeBets[] | select(.status == "confirmed")'
```

### Verify Data Integrity
- All confirmed bets should have matching log entries
- No new bets should be created from logs
- Pending bets should only be updated, not duplicated

## 🎯 Summary

The corrected system ensures:
- ✅ Manual bet creation only
- ✅ Automated confirmation from logs
- ✅ No duplicate bet creation
- ✅ Proper status tracking
- ✅ Clear separation of concerns 