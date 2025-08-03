const fs = require('fs');
const { google } = require('googleapis');

// Configuration
const CREDENTIALS_FILE = 'google-sheets-credentials.json';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function checkAndCreateSheets() {
    try {
        // Load credentials
        const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
        
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: SCOPES
        });

        const sheets = google.sheets({ version: 'v4', auth: auth });
        
        // Load spreadsheet ID
        const spreadsheetId = fs.readFileSync('user-facing-spreadsheet-id.txt', 'utf8').trim();
        console.log(`📊 Checking spreadsheet: ${spreadsheetId}`);
        
        // Get spreadsheet details
        const response = await sheets.spreadsheets.get({
            spreadsheetId: spreadsheetId
        });
        
        console.log('📋 Existing sheets:');
        response.data.sheets.forEach(sheet => {
            console.log(`  - ${sheet.properties.title}`);
        });
        
        // Define required sheets
        const requiredSheets = [
            'Confirmed Bets',
            'Pending Bets', 
            'User Statistics',
            'Bet History',
            'Faction Performance'
        ];
        
        const existingSheetNames = response.data.sheets.map(sheet => sheet.properties.title);
        const missingSheets = requiredSheets.filter(sheetName => !existingSheetNames.includes(sheetName));
        
        if (missingSheets.length > 0) {
            console.log('\n❌ Missing sheets:');
            missingSheets.forEach(sheet => console.log(`  - ${sheet}`));
            
            // Create missing sheets
            console.log('\n🔧 Creating missing sheets...');
            const requests = missingSheets.map(sheetName => ({
                addSheet: {
                    properties: {
                        title: sheetName,
                        gridProperties: {
                            rowCount: 1000,
                            columnCount: 20
                        }
                    }
                }
            }));
            
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: spreadsheetId,
                resource: {
                    requests: requests
                }
            });
            
            console.log('✅ Created missing sheets!');
        } else {
            console.log('\n✅ All required sheets exist!');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkAndCreateSheets(); 