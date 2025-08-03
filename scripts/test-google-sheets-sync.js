const fs = require('fs');
const path = require('path');

// Test Google Sheets sync functionality
async function testGoogleSheetsSync() {
    console.log('🧪 Testing Google Sheets Sync');
    console.log('=============================');
    
    try {
        // Check if Google Sheets credentials exist
        const credentialsFile = 'google-sheets-credentials.json';
        if (!fs.existsSync(credentialsFile)) {
            console.log('❌ Google Sheets credentials not found');
            console.log('📋 To set up Google Sheets sync:');
            console.log('   1. Go to https://console.developers.google.com/');
            console.log('   2. Create a new project or select existing one');
            console.log('   3. Enable Google Sheets API');
            console.log('   4. Create credentials (Service Account)');
            console.log('   5. Download JSON credentials file');
            console.log('   6. Save as "google-sheets-credentials.json" in this directory');
            return;
        }
        
        console.log('✅ Google Sheets credentials found');
        
        // Test the public endpoint to get confirmed bets
        console.log('\n📡 Testing public endpoint for confirmed bets...');
        
        const axios = require('axios');
        const response = await axios.get('http://localhost:3000/api/betting/public-bets/3576736');
        
        if (response.data.success) {
            const userData = response.data;
            const confirmedBets = userData.bets.activeBets.filter(bet => bet.status === 'confirmed');
            
            console.log(`✅ Found ${confirmedBets.length} confirmed bets for user ${userData.player.name}:`);
            confirmedBets.forEach(bet => {
                console.log(`   - Bet ${bet.betId}: ${bet.factionName} (${bet.xanaxAmount} Xanax) - Confirmed at ${new Date(bet.confirmedAt).toLocaleString()}`);
            });
            
            // Test the Google Sheets sync
            console.log('\n📊 Testing Google Sheets sync...');
            
            // Load the GoogleSheetsSync class
            const GoogleSheetsSync = require('./setup-google-sheets-sync.js');
            const sync = new GoogleSheetsSync();
            
            if (await sync.initialize()) {
                console.log('✅ Google Sheets API initialized');
                
                // Test syncing the data
                await sync.syncToGoogleSheets();
                
                console.log('✅ Google Sheets sync completed');
                console.log(`🔗 View your sheet: https://docs.google.com/spreadsheets/d/${sync.spreadsheetId}`);
            } else {
                console.log('❌ Failed to initialize Google Sheets API');
            }
        } else {
            console.log('❌ Failed to get user data from public endpoint');
        }
        
    } catch (error) {
        console.error('❌ Error testing Google Sheets sync:', error.message);
    }
}

// Test the user-bets.json file directly
function testUserBetsData() {
    console.log('\n📁 Testing user-bets.json data...');
    
    try {
        const userBetsData = JSON.parse(fs.readFileSync('./data/user-bets.json', 'utf8'));
        
        let totalConfirmedBets = 0;
        let totalPendingBets = 0;
        
        Object.values(userBetsData.users).forEach(user => {
            if (user.activeBets) {
                const confirmedBets = user.activeBets.filter(bet => bet.status === 'confirmed');
                const pendingBets = user.activeBets.filter(bet => bet.status === 'pending');
                
                totalConfirmedBets += confirmedBets.length;
                totalPendingBets += pendingBets.length;
                
                if (confirmedBets.length > 0) {
                    console.log(`   - User ${user.playerId} (${user.username}): ${confirmedBets.length} confirmed, ${pendingBets.length} pending`);
                }
            }
        });
        
        console.log(`\n📊 Summary:`);
        console.log(`   - Total confirmed bets: ${totalConfirmedBets}`);
        console.log(`   - Total pending bets: ${totalPendingBets}`);
        
        if (totalConfirmedBets > 0) {
            console.log('✅ Confirmed bets are available for Google Sheets sync');
        } else {
            console.log('⚠️  No confirmed bets found - sync will show empty data');
        }
        
    } catch (error) {
        console.error('❌ Error reading user-bets.json:', error.message);
    }
}

// Run tests
async function main() {
    await testGoogleSheetsSync();
    testUserBetsData();
}

main().catch(console.error); 