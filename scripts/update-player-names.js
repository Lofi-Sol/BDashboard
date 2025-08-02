const fs = require('fs');
const path = require('path');

// Function to fetch player name from API
async function fetchPlayerName(playerId) {
    try {
        // You'll need to replace this with your actual API endpoint
        const response = await fetch(`https://api.torn.com/user/${playerId}?selections=profile&key=YOUR_API_KEY`);
        const data = await response.json();
        
        if (data && data.name) {
            return data.name;
        } else {
            console.log(`⚠️  Could not fetch name for player ${playerId}, using fallback`);
            return `Player${playerId}`;
        }
    } catch (error) {
        console.log(`❌ Error fetching name for player ${playerId}:`, error.message);
        return `Player${playerId}`;
    }
}

// Function to update player names in the JSON file
async function updatePlayerNames() {
    try {
        const jsonPath = path.join(__dirname, '../data/user-bets.json');
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        
        console.log('🔄 Updating player names...');
        
        // Update each user's username
        for (const [playerId, userData] of Object.entries(jsonData.users)) {
            console.log(`📝 Fetching name for player ${playerId}...`);
            
            // For now, let's use some example names
            // In a real implementation, you would call the API here
            const realNames = {
                "3520571": "JohnDoe",
                "3566110": "JaneSmith"
            };
            
            const realName = realNames[playerId] || await fetchPlayerName(playerId);
            
            // Update the username
            userData.username = realName;
            
            console.log(`✅ Updated ${playerId} to: ${realName}`);
        }
        
        // Update the metadata
        jsonData.metadata.lastUpdated = new Date().toISOString();
        
        // Save the updated JSON
        fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
        
        console.log('✅ Player names updated successfully!');
        console.log('🔄 Auto-sync will update Google Sheets automatically...');
        
    } catch (error) {
        console.error('❌ Error updating player names:', error.message);
    }
}

// Function to manually set player names (if you know them)
function setPlayerNames() {
    try {
        const jsonPath = path.join(__dirname, '../data/user-bets.json');
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        
        console.log('🔄 Setting player names...');
        
        // Set the real player names here
        const realNames = {
            "3520571": "JohnDoe",      // Replace with actual player name
            "3566110": "JaneSmith"     // Replace with actual player name
        };
        
        // Update each user's username
        for (const [playerId, userData] of Object.entries(jsonData.users)) {
            if (realNames[playerId]) {
                const oldName = userData.username;
                userData.username = realNames[playerId];
                console.log(`✅ Updated ${playerId}: ${oldName} → ${realNames[playerId]}`);
            }
        }
        
        // Update the metadata
        jsonData.metadata.lastUpdated = new Date().toISOString();
        
        // Save the updated JSON
        fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
        
        console.log('✅ Player names set successfully!');
        console.log('🔄 Auto-sync will update Google Sheets automatically...');
        
    } catch (error) {
        console.error('❌ Error setting player names:', error.message);
    }
}

// Main execution
async function main() {
    const action = process.argv[2];
    
    if (action === 'fetch') {
        await updatePlayerNames();
    } else if (action === 'set') {
        setPlayerNames();
    } else {
        console.log('📋 Usage:');
        console.log('   node scripts/update-player-names.js set    # Set names manually');
        console.log('   node scripts/update-player-names.js fetch  # Fetch from API (requires API key)');
        console.log('');
        console.log('💡 To set real player names:');
        console.log('   1. Edit the realNames object in the script');
        console.log('   2. Replace with actual player names');
        console.log('   3. Run: node scripts/update-player-names.js set');
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { updatePlayerNames, setPlayerNames }; 