const fs = require('fs');
const { google } = require('googleapis');

async function testPermissions() {
    try {
        console.log('🧪 Testing Google Sheets Permissions...');
        
        // Load credentials
        const credentials = JSON.parse(fs.readFileSync('google-sheets-credentials.json', 'utf8'));
        console.log('✅ Credentials loaded');
        
        // Initialize auth
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        
        const sheets = google.sheets({ version: 'v4', auth });
        console.log('✅ Google Sheets API initialized');
        
        // Test with existing spreadsheet ID
        const spreadsheetId = '1pgmqBXrmnHjwxwawNJaCHWnlc6Hv6R6090PDAlKaMXI';
        
        // Try to read the spreadsheet
        const response = await sheets.spreadsheets.get({
            spreadsheetId: spreadsheetId
        });
        
        console.log('✅ Successfully accessed spreadsheet!');
        console.log(`📊 Title: ${response.data.properties.title}`);
        console.log(`📋 Sheets: ${response.data.sheets.map(s => s.properties.title).join(', ')}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testPermissions();
