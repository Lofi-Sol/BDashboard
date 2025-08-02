const fs = require('fs');
const path = require('path');

// Function to convert timestamp to readable date
function formatDate(timestamp) {
    return new Date(timestamp).toISOString();
}

// Function to convert array to CSV string
function arrayToCSV(data, headers) {
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
}

// Function to flatten nested objects for CSV
function flattenObject(obj, prefix = '') {
    const flattened = {};
    
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const newKey = prefix ? `${prefix}_${key}` : key;
            
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                Object.assign(flattened, flattenObject(obj[key], newKey));
            } else {
                flattened[newKey] = obj[key];
            }
        }
    }
    
    return flattened;
}

// Main conversion function
function convertUserBetsToCSV() {
    try {
        // Read the JSON file
        const jsonPath = path.join(__dirname, '../data/user-bets.json');
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        
        const outputDir = path.join(__dirname, '../data/sheets-export');
        
        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // 1. User Profiles CSV
        const userProfiles = [];
        for (const [playerId, userData] of Object.entries(jsonData.users)) {
            const profile = {
                playerId: userData.playerId,
                username: userData.username,
                ...flattenObject(userData.profile)
            };
            userProfiles.push(profile);
        }
        
        const profileHeaders = [
            'playerId', 'username', 'joinDate', 'totalBets', 'totalVolume', 
            'totalWinnings', 'totalLosses', 'netProfit', 'winRate', 
            'averageBetSize', 'largestBet', 'favoriteFaction', 'lastActive'
        ];
        
        const profilesCSV = arrayToCSV(userProfiles, profileHeaders);
        fs.writeFileSync(path.join(outputDir, 'user-profiles.csv'), profilesCSV);
        
        // 2. Active Bets CSV
        const activeBets = [];
        for (const [playerId, userData] of Object.entries(jsonData.users)) {
            for (const bet of userData.activeBets) {
                const betData = {
                    playerId: userData.playerId,
                    username: userData.username,
                    ...bet
                };
                activeBets.push(betData);
            }
        }
        
        const betHeaders = [
            'playerId', 'username', 'betId', 'warId', 'factionId', 'factionName',
            'xanaxAmount', 'betAmount', 'odds', 'potentialPayout', 'status',
            'timestamp', 'placedAt'
        ];
        
        const betsCSV = arrayToCSV(activeBets, betHeaders);
        fs.writeFileSync(path.join(outputDir, 'active-bets.csv'), betsCSV);
        
        // 3. User Statistics by Faction CSV
        const factionStats = [];
        for (const [playerId, userData] of Object.entries(jsonData.users)) {
            for (const [factionId, stats] of Object.entries(userData.statistics.byFaction)) {
                const statData = {
                    playerId: userData.playerId,
                    username: userData.username,
                    factionId: factionId,
                    ...stats
                };
                factionStats.push(statData);
            }
        }
        
        const factionHeaders = [
            'playerId', 'username', 'factionId', 'factionName', 'totalBets',
            'totalVolume', 'wins', 'losses', 'winRate'
        ];
        
        const factionCSV = arrayToCSV(factionStats, factionHeaders);
        fs.writeFileSync(path.join(outputDir, 'faction-statistics.csv'), factionCSV);
        
        // 4. User Preferences CSV
        const userPreferences = [];
        for (const [playerId, userData] of Object.entries(jsonData.users)) {
            const prefs = {
                playerId: userData.playerId,
                username: userData.username,
                ...flattenObject(userData.preferences)
            };
            userPreferences.push(prefs);
        }
        
        const prefHeaders = [
            'playerId', 'username', 'defaultBetSize', 'favoriteFactions',
            'riskTolerance', 'autoBetting', 'notifications_betResults',
            'notifications_newWars', 'notifications_oddsChanges'
        ];
        
        const prefsCSV = arrayToCSV(userPreferences, prefHeaders);
        fs.writeFileSync(path.join(outputDir, 'user-preferences.csv'), prefsCSV);
        
        // 5. Summary Statistics CSV
        const summaryData = [{
            totalUsers: jsonData.metadata.totalUsers,
            activeUsers: jsonData.metadata.activeUsers,
            totalActiveBets: jsonData.metadata.totalActiveBets,
            totalVolume: jsonData.metadata.totalVolume,
            created: jsonData.metadata.created,
            lastUpdated: jsonData.metadata.lastUpdated
        }];
        
        const summaryHeaders = [
            'totalUsers', 'activeUsers', 'totalActiveBets', 'totalVolume',
            'created', 'lastUpdated'
        ];
        
        const summaryCSV = arrayToCSV(summaryData, summaryHeaders);
        fs.writeFileSync(path.join(outputDir, 'summary-statistics.csv'), summaryCSV);
        
        console.log('✅ Successfully converted user-bets.json to CSV files for Google Sheets!');
        console.log('📁 Files created in: data/sheets-export/');
        console.log('📊 Files created:');
        console.log('   - user-profiles.csv');
        console.log('   - active-bets.csv');
        console.log('   - faction-statistics.csv');
        console.log('   - user-preferences.csv');
        console.log('   - summary-statistics.csv');
        console.log('\n📋 To import into Google Sheets:');
        console.log('   1. Open Google Sheets');
        console.log('   2. File → Import → Upload → Select any CSV file');
        console.log('   3. Choose "Replace current sheet" or "Insert new sheet"');
        console.log('   4. Click "Import data"');
        
    } catch (error) {
        console.error('❌ Error converting to CSV:', error.message);
    }
}

// Run the conversion
convertUserBetsToCSV(); 