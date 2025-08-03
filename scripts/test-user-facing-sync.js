const fs = require('fs');
const path = require('path');
const UserFacingSheetsSync = require('./sync-user-facing-sheets');

async function testUserFacingSync() {
    console.log('🧪 Testing user-facing sheets sync...');
    
    const sync = new UserFacingSheetsSync();
    
    if (await sync.initialize()) {
        console.log('✅ API initialized successfully');
        
        if (sync.loadSpreadsheetId()) {
            console.log(`📊 Using spreadsheet: ${sync.spreadsheetId}`);
            
            // Test the sync
            await sync.syncToUserFacingSheets();
            
            console.log('✅ Test completed successfully!');
            console.log(`🔗 View your sheet: https://docs.google.com/spreadsheets/d/${sync.spreadsheetId}`);
        } else {
            console.log('❌ No spreadsheet ID found');
        }
    } else {
        console.log('❌ Failed to initialize API');
    }
}

testUserFacingSync().catch(console.error); 