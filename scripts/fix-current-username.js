const fs = require('fs').promises;
const path = require('path');

async function fixCurrentUsername() {
    try {
        console.log('🔧 Fixing current username...\n');
        
        // Load user bets data
        const userBetsPath = path.join(__dirname, '../data/user-bets.json');
        const userBetsData = JSON.parse(await fs.readFile(userBetsPath, 'utf8'));
        
        // Find the user with placeholder name
        const playerId = '3576736';
        const user = userBetsData.users[playerId];
        
        if (user && user.username.startsWith('Player')) {
            console.log(`🔄 Updating username for player ${playerId}:`);
            console.log(`   - Old name: ${user.username}`);
            
            // Update to real name (you can replace this with the actual name)
            const realName = 'FlowerJar'; // Replace with actual name from API
            user.username = realName;
            
            console.log(`   - New name: ${user.username}`);
            
            // Save the updated data
            await fs.writeFile(userBetsPath, JSON.stringify(userBetsData, null, 2));
            
            console.log('✅ Username updated successfully!');
        } else {
            console.log('ℹ️  No placeholder username found to update');
        }
        
    } catch (error) {
        console.error('❌ Error fixing username:', error);
    }
}

// Run the fix
fixCurrentUsername(); 