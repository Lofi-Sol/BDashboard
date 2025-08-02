#!/usr/bin/env node

/**
 * Update Real Player Names Script
 * 
 * This script updates existing user data with real player names
 * from the Torn API instead of placeholder names like "TornPlayer2"
 */

const fs = require('fs').promises;

// Sample player data from Torn API (you can replace with actual API calls)
const playerData = {
    "3566110": {
        "name": "VanillaScoop",
        "player_id": 3566110
    },
    "3576736": {
        "name": "RobBendetti", 
        "player_id": 3576736
    }
};

async function updateRealPlayerNames() {
    console.log('🔄 Updating Real Player Names');
    console.log('==============================');
    console.log('');
    
    try {
        // Load current user bets data
        const userBetsData = JSON.parse(await fs.readFile('./data/user-bets.json', 'utf8'));
        
        let updatedCount = 0;
        
        // Update each user's username with real name
        Object.keys(userBetsData.users).forEach(playerId => {
            const user = userBetsData.users[playerId];
            const realName = playerData[playerId]?.name;
            
            if (realName && user.username !== realName) {
                console.log(`👤 Updating player ${playerId}:`);
                console.log(`   - Old name: ${user.username}`);
                console.log(`   - New name: ${realName}`);
                console.log('');
                
                user.username = realName;
                updatedCount++;
            } else if (!realName) {
                console.log(`⚠️  No real name found for player ${playerId} (${user.username})`);
            } else {
                console.log(`✅ Player ${playerId} already has correct name: ${user.username}`);
            }
        });
        
        if (updatedCount > 0) {
            // Save updated data
            await fs.writeFile('./data/user-bets.json', JSON.stringify(userBetsData, null, 2));
            console.log(`✅ Updated ${updatedCount} player names successfully!`);
        } else {
            console.log('ℹ️  No player names needed updating.');
        }
        
        console.log('');
        console.log('📊 Summary:');
        console.log(`   - Total users: ${Object.keys(userBetsData.users).length}`);
        console.log(`   - Updated names: ${updatedCount}`);
        console.log(`   - Unchanged names: ${Object.keys(userBetsData.users).length - updatedCount}`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error updating player names:', error);
        return false;
    }
}

// Function to fetch real player names from Torn API
async function fetchPlayerNames(apiKey) {
    console.log('🌐 Fetching real player names from Torn API...');
    console.log('');
    
    const playerNames = {};
    
    // List of player IDs to fetch
    const playerIds = ['3566110', '3576736'];
    
    for (const playerId of playerIds) {
        try {
            const response = await fetch(`https://api.torn.com/user/${playerId}?selections=profile&key=${apiKey}`);
            const data = await response.json();
            
            if (data.error) {
                console.log(`❌ Error fetching player ${playerId}: ${data.error}`);
                continue;
            }
            
            if (data.name) {
                playerNames[playerId] = {
                    name: data.name,
                    player_id: parseInt(playerId)
                };
                console.log(`✅ Fetched name for player ${playerId}: ${data.name}`);
            }
            
            // Rate limiting - wait 1 second between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.log(`❌ Error fetching player ${playerId}: ${error.message}`);
        }
    }
    
    return playerNames;
}

// Main execution
async function main() {
    console.log('🎯 Update Real Player Names');
    console.log('============================');
    console.log('');
    
    // Check if API key is provided
    const apiKey = process.argv[2];
    
    if (apiKey) {
        console.log('🔑 Using provided API key to fetch real names...');
        const realNames = await fetchPlayerNames(apiKey);
        
        if (Object.keys(realNames).length > 0) {
            // Update the playerData with real names
            Object.assign(playerData, realNames);
        }
    } else {
        console.log('ℹ️  No API key provided, using sample data');
        console.log('💡 To fetch real names, run: node scripts/update-real-player-names.js YOUR_API_KEY');
        console.log('');
    }
    
    // Update the user data
    const success = await updateRealPlayerNames();
    
    if (success) {
        console.log('');
        console.log('🎉 Player name update completed successfully!');
        console.log('📋 New bets will now use real player names automatically.');
    } else {
        console.log('');
        console.log('💥 Player name update failed!');
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { updateRealPlayerNames, fetchPlayerNames }; 