#!/usr/bin/env node

/**
 * Test Script to Demonstrate Log Matching Logic
 * Shows why confirmations aren't happening when bet IDs don't match
 */

const fs = require('fs').promises;

// Load the actual data
async function loadData() {
    const userBetsData = JSON.parse(await fs.readFile('./data/user-bets.json', 'utf8'));
    const filteredLogsData = JSON.parse(await fs.readFile('./data/filtered-logs.json', 'utf8'));
    return { userBetsData, filteredLogsData };
}

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

// Test the matching logic
async function testMatchingLogic() {
    console.log('🧪 Testing Log Matching Logic');
    console.log('================================');
    console.log('');
    
    const { userBetsData, filteredLogsData } = await loadData();
    
    // Find the specific bet and log we want to test
    const testBet = userBetsData.users["3576736"].activeBets.find(bet => bet.betId === "H3FTS6FB");
    const testLog = filteredLogsData.logs["REfKB3FGXR53i7TEOxgI"];
    
    console.log('📋 Test Case: Bet H3FTS6FB vs Log REfKB3FGXR53i7TEOxgI');
    console.log('');
    
    console.log('🎯 Pending Bet Details:');
    console.log(`   - Bet ID: ${testBet.betId}`);
    console.log(`   - War ID: ${testBet.warId}`);
    console.log(`   - Faction ID: ${testBet.factionId}`);
    console.log(`   - Xanax Amount: ${testBet.xanaxAmount}`);
    console.log(`   - Status: ${testBet.status}`);
    console.log('');
    
    console.log('📝 Log Entry Details:');
    console.log(`   - Log ID: REfKB3FGXR53i7TEOxgI`);
    console.log(`   - Sender: ${testLog.data.sender}`);
    console.log(`   - Message: ${testLog.data.message}`);
    console.log(`   - Xanax Amount: ${testLog.data.items[0].qty}`);
    console.log('');
    
    // Parse the log message
    const logBetData = parseBetMessage(testLog.data.message);
    
    console.log('🔍 Parsed Log Message:');
    console.log(`   - War ID: ${logBetData.warId}`);
    console.log(`   - Faction ID: ${logBetData.factionId}`);
    console.log(`   - Xanax Amount: ${logBetData.xanaxAmount}`);
    console.log(`   - Bet ID: ${logBetData.betId}`);
    console.log('');
    
    // Test each matching criterion
    console.log('✅ Matching Criteria Check:');
    const warMatch = parseInt(testBet.warId) === logBetData.warId;
    const factionMatch = parseInt(testBet.factionId) === logBetData.factionId;
    const xanaxMatch = testBet.xanaxAmount === logBetData.xanaxAmount;
    const betIdMatch = testBet.betId === logBetData.betId;
    
    console.log(`   - War ID Match: ${warMatch} (${testBet.warId} === ${logBetData.warId})`);
    console.log(`   - Faction ID Match: ${factionMatch} (${testBet.factionId} === ${logBetData.factionId})`);
    console.log(`   - Xanax Amount Match: ${xanaxMatch} (${testBet.xanaxAmount} === ${logBetData.xanaxAmount})`);
    console.log(`   - Bet ID Match: ${betIdMatch} (${testBet.betId} === ${logBetData.betId})`);
    console.log('');
    
    const allMatch = warMatch && factionMatch && xanaxMatch && betIdMatch;
    
    if (allMatch) {
        console.log('🎉 ALL CRITERIA MATCH - Bet would be confirmed!');
    } else {
        console.log('❌ NOT ALL CRITERIA MATCH - Bet remains pending');
        console.log('');
        console.log('📋 Why this is correct behavior:');
        console.log('   - The system should only confirm bets when ALL fields match');
        console.log('   - This prevents false confirmations');
        console.log('   - Bet IDs must match exactly for security');
        console.log('   - This ensures only the correct bet is confirmed');
    }
    
    console.log('');
    console.log('🔧 Expected Workflow:');
    console.log('   1. User places bet through dashboard → Gets unique bet ID');
    console.log('   2. User sends Xanax with exact bet message → Includes same bet ID');
    console.log('   3. System finds matching log → Confirms bet');
    console.log('   4. If bet IDs don\'t match → Bet remains pending (correct behavior)');
}

// Run the test
testMatchingLogic()
    .then(() => {
        console.log('✅ Test completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Test error:', error);
        process.exit(1);
    }); 