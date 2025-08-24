const fs = require('fs').promises;
const path = require('path');

async function extractWeeklyFactionData() {
    try {
        console.log('🔍 Loading betting wars configuration...');
        
        // Load betting wars configuration
        const bettingWarsPath = path.join(__dirname, '../data/betting-wars.json');
        const bettingWarsData = JSON.parse(await fs.readFile(bettingWarsPath, 'utf8'));
        
        // Get current week's wars
        const currentWeek = bettingWarsData.currentWeek;
        const warIds = currentWeek.wars;
        
        console.log(`📊 Found ${warIds.length} wars for current week:`);
        console.log(`Week Start: ${currentWeek.weekStart}`);
        console.log(`War IDs: ${warIds.join(', ')}`);
        
        // Load factions data
        console.log('📋 Loading factions data...');
        const factionsPath = path.join(__dirname, '../data/factions.json');
        const factionsData = JSON.parse(await fs.readFile(factionsPath, 'utf8'));
        
        // Create a map for quick faction lookup
        const factionMap = new Map();
        factionsData.factions.forEach(faction => {
            factionMap.set(faction.id, faction);
        });
        
        console.log(`📈 Loaded ${factionMap.size} factions from database`);
        
        // Extract faction data for the selected wars
        const weeklyFactionData = {
            metadata: {
                weekStart: currentWeek.weekStart,
                totalWars: currentWeek.totalWars,
                randomWars: currentWeek.randomWars,
                interestingWars: currentWeek.interestingWars,
                extractedAt: new Date().toISOString(),
                source: "Torn City Faction Data"
            },
            wars: [],
            factions: [],
            statistics: {
                totalFactions: 0,
                totalRespect: 0,
                averageRespect: 0,
                rankDistribution: {},
                memberCountDistribution: {}
            }
        };
        
        // Since we don't have the actual war data with faction IDs, 
        // we'll create a comprehensive faction dataset for analysis
        console.log('🔍 Extracting faction data for analysis...');
        
        // Get all factions and add them to the dataset
        const allFactions = factionsData.factions.map(faction => ({
            id: faction.id,
            name: faction.name,
            respect: faction.respect,
            rank: faction.rank,
            members: faction.members,
            position: faction.position,
            lastUpdated: faction.lastUpdated
        }));
        
        weeklyFactionData.factions = allFactions;
        weeklyFactionData.statistics.totalFactions = allFactions.length;
        
        // Calculate statistics
        const totalRespect = allFactions.reduce((sum, faction) => sum + (faction.respect || 0), 0);
        const averageRespect = totalRespect / allFactions.length;
        
        weeklyFactionData.statistics.totalRespect = totalRespect;
        weeklyFactionData.statistics.averageRespect = Math.round(averageRespect);
        
        // Calculate rank distribution
        const rankDistribution = {};
        allFactions.forEach(faction => {
            const rank = faction.rank || 'Unknown';
            rankDistribution[rank] = (rankDistribution[rank] || 0) + 1;
        });
        weeklyFactionData.statistics.rankDistribution = rankDistribution;
        
        // Calculate member count distribution
        const memberCountDistribution = {};
        allFactions.forEach(faction => {
            const memberCount = faction.members || 0;
            const range = memberCount < 50 ? '0-49' :
                         memberCount < 75 ? '50-74' :
                         memberCount < 90 ? '75-89' :
                         memberCount < 100 ? '90-99' : '100+';
            memberCountDistribution[range] = (memberCountDistribution[range] || 0) + 1;
        });
        weeklyFactionData.statistics.memberCountDistribution = memberCountDistribution;
        
        // Create war entries with placeholder data (since we don't have actual war faction data)
        warIds.forEach((warId, index) => {
            weeklyFactionData.wars.push({
                warId: warId,
                warIndex: index + 1,
                status: "upcoming",
                factions: [], // This would be populated with actual war faction data
                estimatedStartTime: null,
                lastUpdated: new Date().toISOString()
            });
        });
        
        // Save the extracted data
        const outputPath = path.join(__dirname, '../data/weekly-faction-data.json');
        await fs.writeFile(outputPath, JSON.stringify(weeklyFactionData, null, 2));
        
        console.log('✅ Weekly faction data extracted successfully!');
        console.log(`📁 Saved to: ${outputPath}`);
        console.log('\n📊 Summary:');
        console.log(`- Total Wars: ${weeklyFactionData.wars.length}`);
        console.log(`- Total Factions: ${weeklyFactionData.statistics.totalFactions}`);
        console.log(`- Total Respect: ${weeklyFactionData.statistics.totalRespect.toLocaleString()}`);
        console.log(`- Average Respect: ${weeklyFactionData.statistics.averageRespect.toLocaleString()}`);
        console.log(`- Top Ranks: ${Object.keys(weeklyFactionData.statistics.rankDistribution).slice(0, 5).join(', ')}`);
        
        // Also create a simplified version for easier analysis
        const simplifiedData = {
            metadata: weeklyFactionData.metadata,
            topFactions: allFactions
                .sort((a, b) => (b.respect || 0) - (a.respect || 0))
                .slice(0, 100)
                .map(faction => ({
                    id: faction.id,
                    name: faction.name,
                    respect: faction.respect,
                    rank: faction.rank,
                    members: faction.members,
                    position: faction.position
                })),
            statistics: weeklyFactionData.statistics
        };
        
        const simplifiedPath = path.join(__dirname, '../data/weekly-faction-data-simplified.json');
        await fs.writeFile(simplifiedPath, JSON.stringify(simplifiedData, null, 2));
        
        console.log(`📄 Simplified version saved to: ${simplifiedPath}`);
        console.log(`🏆 Top 100 factions by respect included in simplified version`);
        
    } catch (error) {
        console.error('❌ Error extracting weekly faction data:', error);
        process.exit(1);
    }
}

// Run the extraction
extractWeeklyFactionData();
