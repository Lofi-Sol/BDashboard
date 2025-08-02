const fs = require('fs');
const path = require('path');

// Function to update player names with real names
function updatePlayerNames() {
    try {
        const jsonPath = path.join(__dirname, '../data/user-bets.json');
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        
        console.log('🔄 Updating player names...');
        
        // EDIT THESE NAMES WITH THE REAL PLAYER NAMES
        const realNames = {
            "3520571": "TornPlayer1",      // Replace "TornPlayer1" with the real player name
            "3566110": "TornPlayer2"       // Replace "TornPlayer2" with the real player name
        };
        
        let updatedCount = 0;
        
        // Update each user's username
        for (const [playerId, userData] of Object.entries(jsonData.users)) {
            if (realNames[playerId]) {
                const oldName = userData.username;
                userData.username = realNames[playerId];
                console.log(`✅ Updated ${playerId}: ${oldName} → ${realNames[playerId]}`);
                updatedCount++;
            } else {
                console.log(`⚠️  No real name found for player ${playerId}, keeping: ${userData.username}`);
            }
        }
        
        // Update the metadata
        jsonData.metadata.lastUpdated = new Date().toISOString();
        
        // Save the updated JSON
        fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
        
        console.log(`✅ Updated ${updatedCount} player names successfully!`);
        console.log('🔄 Auto-sync will update Google Sheets automatically...');
        console.log('');
        console.log('📋 To customize player names:');
        console.log('   1. Edit the realNames object in this script');
        console.log('   2. Replace with actual player names');
        console.log('   3. Run this script again');
        
    } catch (error) {
        console.error('❌ Error updating player names:', error.message);
    }
}

// Show current player names
function showCurrentNames() {
    try {
        const jsonPath = path.join(__dirname, '../data/user-bets.json');
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        
        console.log('📊 Current player names:');
        console.log('========================');
        
        for (const [playerId, userData] of Object.entries(jsonData.users)) {
            console.log(`Player ID: ${playerId} → Username: ${userData.username}`);
        }
        
        console.log('');
        console.log('💡 To update with real names:');
        console.log('   1. Edit the realNames object in this script');
        console.log('   2. Replace placeholder names with real player names');
        console.log('   3. Run: node scripts/fix-player-names.js update');
        
    } catch (error) {
        console.error('❌ Error reading player names:', error.message);
    }
}

// Main execution
function main() {
    const action = process.argv[2];
    
    if (action === 'update') {
        updatePlayerNames();
    } else if (action === 'show') {
        showCurrentNames();
    } else {
        console.log('📋 Player Name Fix Script');
        console.log('==========================');
        console.log('');
        showCurrentNames();
        console.log('');
        console.log('📋 Commands:');
        console.log('   node scripts/fix-player-names.js show    # Show current names');
        console.log('   node scripts/fix-player-names.js update  # Update with real names');
        console.log('');
        console.log('💡 Instructions:');
        console.log('   1. Edit the realNames object in this script');
        console.log('   2. Replace "JohnDoe" and "JaneSmith" with real player names');
        console.log('   3. Run: node scripts/fix-player-names.js update');
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { updatePlayerNames, showCurrentNames }; 