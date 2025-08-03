const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Configuration
const CREDENTIALS_FILE = 'google-sheets-credentials.json';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

class UserFacingSheets {
    constructor() {
        this.auth = null;
        this.sheets = null;
        this.spreadsheetId = null;
    }

    // Initialize Google Sheets API
    async initialize() {
        try {
            if (!fs.existsSync(CREDENTIALS_FILE)) {
                console.log('❌ Google Sheets credentials not found!');
                return false;
            }

            const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
            
            this.auth = new google.auth.GoogleAuth({
                credentials,
                scopes: SCOPES
            });

            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            console.log('✅ Google Sheets API initialized successfully!');
            return true;
        } catch (error) {
            console.error('❌ Error initializing Google Sheets API:', error.message);
            return false;
        }
    }

    // Create a new user-facing Google Sheet
    async createUserFacingSpreadsheet() {
        try {
            const resource = {
                properties: {
                    title: 'Torn City Betting Dashboard - User Data'
                },
                sheets: [
                    { properties: { title: 'Confirmed Bets', gridProperties: { rowCount: 1000, columnCount: 15 } } },
                    { properties: { title: 'Pending Bets', gridProperties: { rowCount: 1000, columnCount: 15 } } },
                    { properties: { title: 'User Statistics', gridProperties: { rowCount: 1000, columnCount: 20 } } },
                    { properties: { title: 'Bet History', gridProperties: { rowCount: 1000, columnCount: 15 } } },
                    { properties: { title: 'Faction Performance', gridProperties: { rowCount: 1000, columnCount: 15 } } }
                ]
            };

            const response = await this.sheets.spreadsheets.create({
                resource,
                fields: 'spreadsheetId'
            });

            this.spreadsheetId = response.data.spreadsheetId;
            
            // Save spreadsheet ID for future use
            fs.writeFileSync('user-facing-spreadsheet-id.txt', this.spreadsheetId);
            
            console.log('✅ Created new user-facing Google Sheet!');
            console.log(`📊 Spreadsheet ID: ${this.spreadsheetId}`);
            console.log(`🔗 URL: https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`);
            
            return this.spreadsheetId;
        } catch (error) {
            console.error('❌ Error creating spreadsheet:', error.message);
            return null;
        }
    }

    // Load existing spreadsheet ID
    loadSpreadsheetId() {
        try {
            if (fs.existsSync('user-facing-spreadsheet-id.txt')) {
                this.spreadsheetId = fs.readFileSync('user-facing-spreadsheet-id.txt', 'utf8').trim();
                console.log(`📊 Using existing user-facing spreadsheet: ${this.spreadsheetId}`);
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }
}

// Main execution
async function main() {
    const sheets = new UserFacingSheets();
    
    if (await sheets.initialize()) {
        if (!sheets.loadSpreadsheetId()) {
            await sheets.createUserFacingSpreadsheet();
        }
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = UserFacingSheets;
