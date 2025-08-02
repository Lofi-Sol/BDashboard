const fs = require('fs');
const path = require('path');

// Function to fetch real player name from API
async function fetchPlayerName(playerId) {
    try {
        // Replace with your actual API endpoint and key
        const response = await fetch(`https://api.torn.com/user/${playerId}?selections=profile&key=YOUR_API_KEY`);
        const data = await response.json();
        
        if (data && data.name) {
            return data.name;
        } else {
            console.log(`⚠️  Could not fetch name for player ${playerId}`);
            return null;
        }
    } catch (error) {
        console.log(`❌ Error fetching name for player ${playerId}:`, error.message);
        return null;
    }
}

// Function to ensure real names are used for new bets
async function ensureRealNames() {
    try {
        const jsonPath = path.join(__dirname, '../data/user-bets.json');
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        
        console.log('🔍 Checking for placeholder names...');
        
        let updatedCount = 0;
        
        // Check each user for placeholder names
        for (const [playerId, userData] of Object.entries(jsonData.users)) {
            if (userData.username && userData.username.startsWith('Player')) {
                console.log(`⚠️  Found placeholder name: ${userData.username} for player ${playerId}`);
                console.log('💡 To fix this, you can:');
                console.log('   1. Use the API to fetch real names');
                console.log('   2. Manually set the names in the JSON');
                console.log('   3. Run: node scripts/fix-player-names.js update');
            }
        }
        
        if (updatedCount === 0) {
            console.log('✅ All player names look good!');
        }
        
    } catch (error) {
        console.error('❌ Error checking player names:', error.message);
    }
}

// Function to create a template for new bets with real names
function createBetTemplate() {
    const template = {
        "betId": "GENERATED_ID",
        "warId": "WAR_ID",
        "factionId": "FACTION_ID",
        "factionName": "FACTION_NAME",
        "xanaxAmount": 0,
        "betAmount": 0,
        "odds": 0,
        "potentialPayout": 0,
        "status": "pending",
        "timestamp": Date.now(),
        "placedAt": new Date().toISOString()
    };
    
    console.log('📋 Bet Template (with real player names):');
    console.log('==========================================');
    console.log(JSON.stringify(template, null, 2));
    console.log('');
    console.log('💡 When adding new bets:');
    console.log('   1. Use real player names from the API');
    console.log('   2. Fetch player name using: fetchPlayerName(playerId)');
    console.log('   3. Update the username field with the real name');
    console.log('   4. Auto-sync will update Google Sheets automatically');
}

// Function to show best practices for real names
function showBestPractices() {
    console.log('📋 Best Practices for Real Player Names');
    console.log('========================================');
    console.log('');
    console.log('✅ DO:');
    console.log('   - Fetch real names from Torn API');
    console.log('   - Use consistent naming format');
    console.log('   - Update names when players change them');
    console.log('   - Handle API errors gracefully');
    console.log('');
    console.log('❌ DON\'T:');
    console.log('   - Use placeholder names like "Player123"');
    console.log('   - Hardcode player names');
    console.log('   - Ignore API errors');
    console.log('   - Use inconsistent naming');
    console.log('');
    console.log('🔧 Implementation:');
    console.log('   1. Create API integration for player names');
    console.log('   2. Cache player names to avoid API calls');
    console.log('   3. Update names periodically');
    console.log('   4. Handle missing/error cases gracefully');
}

// Main execution
async function main() {
    const action = process.argv[2];
    
    if (action === 'check') {
        await ensureRealNames();
    } else if (action === 'template') {
        createBetTemplate();
    } else if (action === 'practices') {
        showBestPractices();
    } else {
        console.log('📋 Real Names Management');
        console.log('========================');
        console.log('');
        console.log('📋 Commands:');
        console.log('   node scripts/ensure-real-names.js check     # Check for placeholder names');
        console.log('   node scripts/ensure-real-names.js template  # Show bet template');
        console.log('   node scripts/ensure-real-names.js practices # Show best practices');
        console.log('');
        console.log('💡 This ensures future bets use real player names from the API');
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { fetchPlayerName, ensureRealNames, createBetTemplate }; 