const TornProfessionalOddsEngine = require('../Betting/odds-engine-v4.js');

async function testNewOddsEngine() {
    console.log('🚀 Testing Professional Torn Odds Engine v4.0\n');
    
    // Initialize the new odds engine
    const oddsEngine = new TornProfessionalOddsEngine({
        houseEdge: 0.06,        // 6% house edge
        dollarPerXanax: 744983, // Current Xanax value
        cacheTime: 300000       // 5 minutes cache
    });
    
    // Load faction data
    console.log('📋 Loading faction data...');
    await oddsEngine.loadFactionData();
    
    // Test some interesting faction matchups
    const testMatchups = [
        { faction1: 8468, faction2: 16628, description: 'Bloodbath and Beyond vs Chain Reaction' },
        { faction1: 9533, faction2: 89, description: 'Natural Selection vs Catalysis' },
        { faction1: 10174, faction2: 9041, description: 'AQUA-Poseidon vs PT-Calculated' },
        { faction1: 11747, faction2: 16312, description: 'Natural Selection II vs 39th Street Killers X' },
        { faction1: 18736, faction2: 230, description: 'Monarch Research vs PT-Family' }
    ];
    
    console.log('\n🎯 Testing Professional Odds Calculations:\n');
    
    for (const matchup of testMatchups) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🏆 MATCHUP: ${matchup.description}`);
        console.log(`${'='.repeat(60)}`);
        
        try {
            const odds = await oddsEngine.calculateOdds(matchup.faction1, matchup.faction2);
            
            console.log('\n📊 FINAL ODDS SUMMARY:');
            console.log(`   Faction ${matchup.faction1}: ${odds[matchup.faction1].odds} odds`);
            console.log(`   Faction ${matchup.faction2}: ${odds[matchup.faction2].odds} odds`);
            console.log(`   House Edge: ${odds.metadata.houseEdge.toFixed(2)}%`);
            console.log(`   Confidence: ${odds.metadata.confidence}%`);
            console.log(`   Power Ratio: ${odds.metadata.powerRatio.toFixed(3)}`);
            
            // Show betting examples for first faction
            console.log('\n💰 Betting Examples (Faction 1):');
            odds[matchup.faction1].bettingExamples.forEach((example, index) => {
                console.log(`   ${index + 1}. ${example.description}`);
            });
            
        } catch (error) {
            console.error(`❌ Error calculating odds for ${matchup.description}:`, error.message);
        }
    }
    
    // Test health check
    console.log('\n' + '='.repeat(60));
    console.log('🏥 ENGINE HEALTH CHECK');
    console.log('='.repeat(60));
    
    const health = await oddsEngine.getHealthCheck();
    console.log('Health Status:', health);
    
    // Test payout calculation
    console.log('\n' + '='.repeat(60));
    console.log('💵 PAYOUT CALCULATION TEST');
    console.log('='.repeat(60));
    
    const testBet = oddsEngine.calculatePayout(1000000, 2.50); // $1M bet at 2.50 odds
    console.log('Test Bet Result:', testBet);
    
    // Test Xanax price update
    console.log('\n' + '='.repeat(60));
    console.log('💰 XANAX PRICE UPDATE TEST');
    console.log('='.repeat(60));
    
    oddsEngine.updateXanaxPrice(750000); // Update to $750k
    const newTestBet = oddsEngine.calculatePayout(1000000, 2.50);
    console.log('Updated Bet Result:', newTestBet);
    
    console.log('\n✅ Professional Odds Engine v4.0 test completed!');
}

// Run the test
testNewOddsEngine().catch(console.error);
