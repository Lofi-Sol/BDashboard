const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const TORN_API_KEY = process.env.TORN_API_KEY;
const OUTPUT_FILE = 'data/betting-wars.json';
const FACTIONS_FILE = 'data/factions.json';
const NUM_RANDOM = 12;
const NUM_INTERESTING = 8;
const MAX_WEEKS_HISTORY = 2; // Keep 2 weeks of war history

async function fetchWarsFromTorn() {
    try {
        const response = await axios.get(`https://api.torn.com/torn/?selections=rankedwars&key=${TORN_API_KEY}`);
        
        if (response.data.error) {
            throw new Error(`Torn API error: ${response.data.error.error}`);
        }
        
        return response.data.rankedwars || {};
    } catch (error) {
        console.error('Error fetching wars from Torn API:', error.message);
        throw error;
    }
}

function loadFactionsFromLocal() {
    try {
        if (!fs.existsSync(FACTIONS_FILE)) {
            console.warn(`Factions file not found: ${FACTIONS_FILE}`);
            return {};
        }
        
        const factionsData = JSON.parse(fs.readFileSync(FACTIONS_FILE, 'utf8'));
        const factionsById = {};
        
        if (factionsData.factions && Array.isArray(factionsData.factions)) {
            factionsData.factions.forEach(faction => {
                factionsById[faction.id] = faction;
            });
        }
        
        console.log(`Loaded ${Object.keys(factionsById).length} factions from local file`);
        return factionsById;
    } catch (error) {
        console.error('Error loading factions from local file:', error.message);
        return {};
    }
}

function pickRandom(arr, n) {
    const shuffled = arr.slice().sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
}

function isInterestingWar(war, factionsById) {
    if (!war.factions || Object.keys(war.factions).length < 2) return false;
    
    const factionIds = Object.keys(war.factions);
    const f1 = factionsById[factionIds[0]];
    const f2 = factionsById[factionIds[1]];
    
    if (!f1 || !f2) return false;
    
    // At least one faction is top 50 by respect or rank
    const topRespect = 10000000; // 10M respect
    const topRanks = ['Diamond I', 'Diamond II', 'Diamond III', 'Diamond'];
    
    return (
        (f1.respect >= topRespect || f2.respect >= topRespect) ||
        (topRanks.includes(f1.rank) || topRanks.includes(f2.rank))
    );
}

function isWarUpcoming(war) {
    if (!war.war) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const warStart = war.war.start;
    
    // War hasn't started yet (start time is in the future)
    return warStart > now;
}

function loadExistingWars() {
    try {
        if (!fs.existsSync(OUTPUT_FILE)) {
            return { weeks: [] };
        }
        
        const data = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
        return data.weeks ? data : { weeks: [] };
    } catch (error) {
        console.error('Error loading existing wars:', error.message);
        return { weeks: [] };
    }
}

function cleanupOldWeeks(weeks) {
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - (MAX_WEEKS_HISTORY * 7 * 24 * 60 * 60 * 1000));
    
    return weeks.filter(week => {
        const weekDate = new Date(week.weekStart);
        return weekDate >= twoWeeksAgo;
    });
}

async function main() {
    try {
        console.log('Fetching wars from Torn API...');
        const wars = await fetchWarsFromTorn();
        
        console.log('Loading factions from local file...');
        const factionsById = loadFactionsFromLocal();
        
        console.log(`Found ${Object.keys(wars).length} total wars`);
        
        // Filter wars that are upcoming (haven't started yet)
        const upcomingWars = Object.entries(wars).filter(([id, war]) => {
            const isUpcoming = isWarUpcoming(war);
            if (!isUpcoming) {
                console.log(`Skipping war ${id} - already started at ${new Date(war.war.start * 1000).toISOString()}`);
            }
            return isUpcoming;
        });
        
        console.log(`Found ${upcomingWars.length} upcoming wars`);
        
        // Load existing war history
        const existingData = loadExistingWars();
        let weeks = existingData.weeks || [];
        
        // Clean up old weeks (keep only last 2 weeks)
        weeks = cleanupOldWeeks(weeks);
        console.log(`Keeping ${weeks.length} weeks of history`);
        
        if (upcomingWars.length === 0) {
            console.log('No upcoming wars found. Creating empty betting wars file.');
            const output = {
                weeks: weeks,
                lastUpdated: new Date().toISOString(),
                message: "No upcoming wars available"
            };
            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
            return;
        }
        
        // Convert to array of war objects with ID
        const warObjects = upcomingWars.map(([id, war]) => ({
            id: parseInt(id),
            ...war
        }));
        
        // Select interesting wars
        const interestingWars = warObjects.filter(war => isInterestingWar(war, factionsById));
        const selectedInteresting = pickRandom(interestingWars, Math.min(NUM_INTERESTING, interestingWars.length));
        
        console.log(`Found ${interestingWars.length} interesting wars, selected ${selectedInteresting.length}`);
        
        // Remove already selected wars
        const remainingWars = warObjects.filter(war => !selectedInteresting.includes(war));
        const selectedRandom = pickRandom(remainingWars, Math.min(NUM_RANDOM, remainingWars.length));
        
        console.log(`Selected ${selectedRandom.length} random wars from ${remainingWars.length} remaining`);
        
        // Combine and get war IDs
        const selectedWars = [...selectedInteresting, ...selectedRandom];
        const warIds = selectedWars.map(war => war.id);
        
        // Create new week entry
        const currentWeek = {
            weekStart: new Date().toISOString(),
            wars: warIds,
            totalWars: warIds.length,
            randomWars: selectedRandom.length,
            interestingWars: selectedInteresting.length,
            message: `Selected ${warIds.length} upcoming wars for betting`
        };
        
        // Add new week to history
        weeks.push(currentWeek);
        
        // Write to JSON file with history
        const output = {
            weeks: weeks,
            lastUpdated: new Date().toISOString(),
            currentWeek: currentWeek,
            message: `Updated with ${warIds.length} new wars, maintaining ${weeks.length} weeks of history`
        };
        
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
        console.log(`✅ Selected ${warIds.length} upcoming wars for betting:`);
        console.log(`   - ${selectedInteresting.length} interesting wars`);
        console.log(`   - ${selectedRandom.length} random wars`);
        console.log(`   - Maintaining ${weeks.length} weeks of history`);
        console.log(`   - Saved to ${OUTPUT_FILE}`);
        
        // Log selected war details
        selectedWars.forEach(war => {
            const factionIds = Object.keys(war.factions);
            const f1 = factionsById[factionIds[0]];
            const f2 = factionsById[factionIds[1]];
            const startTime = new Date(war.war.start * 1000).toISOString();
            console.log(`   War ${war.id}: ${f1?.name || 'Unknown'} vs ${f2?.name || 'Unknown'} (starts: ${startTime})`);
        });
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}