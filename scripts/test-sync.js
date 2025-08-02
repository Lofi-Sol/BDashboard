const fs = require('fs');
const path = require('path');

// Test script to demonstrate the sync functionality
console.log('🧪 Google Sheets Auto-Sync Test Script');
console.log('=====================================');

// Check if credentials file exists
const credentialsPath = path.join(__dirname, '../google-sheets-credentials.json');
if (fs.existsSync(credentialsPath)) {
    console.log('✅ Google Sheets credentials found!');
    console.log('📋 You can now run:');
    console.log('   node scripts/setup-google-sheets-sync.js');
    console.log('   node scripts/auto-sync-watcher.js');
} else {
    console.log('❌ Google Sheets credentials not found!');
    console.log('📋 Please follow the setup instructions:');
    console.log('   1. Read: scripts/setup-instructions.md');
    console.log('   2. Set up Google Sheets API credentials');
    console.log('   3. Save as: google-sheets-credentials.json');
}

// Check if user-bets.json exists
const userBetsPath = path.join(__dirname, '../data/user-bets.json');
if (fs.existsSync(userBetsPath)) {
    const stats = fs.statSync(userBetsPath);
    const fileSize = (stats.size / 1024).toFixed(2);
    console.log(`✅ user-bets.json found (${fileSize} KB)`);
    
    // Show sample data structure
    try {
        const data = JSON.parse(fs.readFileSync(userBetsPath, 'utf8'));
        const userCount = Object.keys(data.users || {}).length;
        const totalBets = Object.values(data.users || {}).reduce((sum, user) => {
            return sum + (user.activeBets ? user.activeBets.length : 0);
        }, 0);
        
        console.log(`📊 Data summary:`);
        console.log(`   - Users: ${userCount}`);
        console.log(`   - Active bets: ${totalBets}`);
        console.log(`   - Total volume: ${data.metadata?.totalVolume?.toLocaleString() || 0}`);
    } catch (error) {
        console.log('⚠️  Error reading user-bets.json:', error.message);
    }
} else {
    console.log('❌ user-bets.json not found!');
}

console.log('\n📋 Next Steps:');
console.log('1. Follow setup instructions in scripts/setup-instructions.md');
console.log('2. Get Google Sheets API credentials');
console.log('3. Run: node scripts/setup-google-sheets-sync.js');
console.log('4. Start auto-sync: node scripts/auto-sync-watcher.js');

console.log('\n🔄 Alternative: Manual CSV Export');
console.log('If you prefer manual CSV export instead of auto-sync:');
console.log('   node scripts/convert-to-sheets.js');
console.log('   (This creates CSV files you can manually import to Google Sheets)'); 