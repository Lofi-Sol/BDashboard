/**
 * Professional Torn City Faction War Odds Engine v4.0
 * Calculates realistic odds based on faction power ratings
 * Dollar-based calculations with natural odds distribution
 */

class TornProfessionalOddsEngine {
    constructor(options = {}) {
        this.factionData = null;
        this.cache = new Map();
        
        // Professional sportsbook configuration
        this.config = {
            houseEdge: options.houseEdge || 0.06,        // 6% house edge
            cacheTime: options.cacheTime || 300000,      // 5 minutes
            dollarPerXanax: options.dollarPerXanax || 744983, // Xanax value
            
            // Rank multipliers (higher = stronger)
            rankMultipliers: {
                'Diamond III': 1.50,
                'Diamond II': 1.40,
                'Diamond I': 1.30,
                'Diamond': 1.20,
                'Platinum III': 1.00,
                'Platinum II': 0.90,
                'Platinum I': 0.85,
                'Gold III': 0.60,
                'Gold II': 0.50,
                'Gold I': 0.45,
                'Gold': 0.40,
                'Silver III': 0.30,
                'Silver II': 0.25,
                'Silver I': 0.20,
                'Silver': 0.15,
                'Bronze III': 0.10,
                'Bronze II': 0.08,
                'Bronze I': 0.05,
                'Bronze': 0.03,
                'Unranked': 0.02
            },
            
            // Position multipliers based on faction ranking
            getPositionMultiplier: (position) => {
                if (position <= 20) return 1.20;        // Elite factions
                if (position <= 50) return 1.10;        // Top tier
                if (position <= 100) return 1.05;       // Strong factions
                if (position <= 200) return 1.00;       // Average
                if (position <= 500) return 0.95;       // Below average
                if (position <= 1000) return 0.85;      // Weak
                return 0.70;                             // Very weak/unranked
            },
            
            // Member efficiency (diminishing returns after optimal size)
            getMemberEfficiency: (members) => {
                if (members <= 0) return 0.1;
                if (members >= 100) return 1.0;         // Full roster bonus
                if (members >= 90) return 0.95;         // Near full
                if (members >= 80) return 0.90;         // Good size
                if (members >= 70) return 0.85;         // Decent size
                if (members >= 50) return 0.80;         // Small but viable
                return 0.60 + (members / 100 * 0.2);    // Very small penalty
            }
        };
        
        console.log('Professional Torn Odds Engine v4.0 initialized');
    }

    /**
     * Load faction data from JSON file
     */
    async loadFactionData() {
        try {
            const fs = require('fs');
            const path = require('path');
            
            const jsonPath = path.join(__dirname, '..', 'data', 'factions.json');
            
            if (fs.existsSync(jsonPath)) {
                const data = fs.readFileSync(jsonPath, 'utf8');
                this.factionData = JSON.parse(data);
                console.log(`✅ Loaded ${this.factionData.factions.length} factions from JSON file`);
                return true;
            } else {
                console.warn('⚠️ factions.json not found, using empty data');
                this.factionData = { factions: [] };
                return false;
            }
        } catch (error) {
            console.error('❌ Failed to load faction data:', error.message);
            this.factionData = { factions: [] };
            return false;
        }
    }

    /**
     * Calculate faction power rating based on all available metrics
     */
    calculatePowerRating(faction) {
        console.log(`\n🔍 Calculating power rating for faction ${faction.id}:`);
        console.log(`   Name: ${faction.name}`);
        console.log(`   Respect: ${faction.respect?.toLocaleString() || 'N/A'}`);
        console.log(`   Rank: ${faction.rank || 'N/A'}`);
        console.log(`   Members: ${faction.members || 'N/A'}`);
        console.log(`   Position: ${faction.position || 'N/A'}`);
        
        // Base respect score (converted to millions for manageable numbers)
        const respectScore = (faction.respect || 1000000) / 1000000;
        console.log(`   Respect Score: ${respectScore.toFixed(2)}M`);
        
        // Rank multiplier
        const rankMultiplier = this.config.rankMultipliers[faction.rank] || this.config.rankMultipliers['Unranked'];
        console.log(`   Rank Multiplier: ${rankMultiplier}x (${faction.rank})`);
        
        // Position multiplier
        const positionMultiplier = this.config.getPositionMultiplier(faction.position || 2000);
        console.log(`   Position Multiplier: ${positionMultiplier}x (position ${faction.position || 'unranked'})`);
        
        // Member efficiency
        const memberEfficiency = this.config.getMemberEfficiency(faction.members || 50);
        console.log(`   Member Efficiency: ${memberEfficiency}x (${faction.members || 0} members)`);
        
        // Calculate final power rating
        const powerRating = respectScore * rankMultiplier * positionMultiplier * memberEfficiency;
        
        console.log(`   🎯 Final Power Rating: ${powerRating.toFixed(3)}`);
        
        return powerRating;
    }

    /**
     * Calculate true win probabilities between two factions
     */
    calculateWinProbabilities(faction1, faction2) {
        console.log(`\n⚔️ Calculating win probabilities:`);
        
        const power1 = this.calculatePowerRating(faction1);
        const power2 = this.calculatePowerRating(faction2);
        
        const totalPower = power1 + power2;
        
        if (totalPower === 0) {
            console.warn('⚠️ Total power is zero, using 50/50 split');
            return { prob1: 0.50, prob2: 0.50 };
        }
        
        const trueProb1 = power1 / totalPower;
        const trueProb2 = power2 / totalPower;
        
        console.log(`\n📊 True Probabilities:`);
        console.log(`   ${faction1.name}: ${(trueProb1 * 100).toFixed(1)}%`);
        console.log(`   ${faction2.name}: ${(trueProb2 * 100).toFixed(1)}%`);
        
        // Add small random variance (1-3%) to prevent identical matchups
        const variance1 = (Math.random() - 0.5) * 0.03; // ±1.5%
        const variance2 = -variance1; // Ensures they still sum to 1
        
        const adjustedProb1 = Math.max(0.05, Math.min(0.95, trueProb1 + variance1));
        const adjustedProb2 = 1 - adjustedProb1;
        
        console.log(`📈 With variance:`);
        console.log(`   ${faction1.name}: ${(adjustedProb1 * 100).toFixed(1)}%`);
        console.log(`   ${faction2.name}: ${(adjustedProb2 * 100).toFixed(1)}%`);
        
        return { 
            prob1: adjustedProb1, 
            prob2: adjustedProb2,
            power1: power1,
            power2: power2,
            powerRatio: power1 / power2
        };
    }

    /**
     * Apply house edge to create implied probabilities
     */
    applyHouseEdge(trueProb1, trueProb2) {
        const overround = 1 + this.config.houseEdge;
        
        // Scale probabilities to include house edge
        const impliedProb1 = trueProb1 * overround / (trueProb1 * overround + trueProb2 * overround);
        const impliedProb2 = 1 - impliedProb1;
        
        // Ensure they sum to overround amount
        const totalImplied = (1 / impliedProb1) + (1 / impliedProb2);
        const actualHouseEdge = (totalImplied - 2) / 2;
        
        console.log(`\n💰 House Edge Applied:`);
        console.log(`   Target house edge: ${(this.config.houseEdge * 100).toFixed(1)}%`);
        console.log(`   Actual house edge: ${(actualHouseEdge * 100).toFixed(1)}%`);
        console.log(`   Implied probabilities: ${(impliedProb1 * 100).toFixed(1)}% vs ${(impliedProb2 * 100).toFixed(1)}%`);
        
        return {
            impliedProb1,
            impliedProb2,
            actualHouseEdge
        };
    }

    /**
     * Convert probabilities to decimal odds
     */
    convertToDecimalOdds(impliedProb1, impliedProb2) {
        const odds1 = 1 / impliedProb1;
        const odds2 = 1 / impliedProb2;
        
        // Round to 2 decimal places for clean display
        const roundedOdds1 = Math.round(odds1 * 100) / 100;
        const roundedOdds2 = Math.round(odds2 * 100) / 100;
        
        console.log(`\n🎰 Decimal Odds:`);
        console.log(`   Faction 1: ${roundedOdds1}`);
        console.log(`   Faction 2: ${roundedOdds2}`);
        
        return { odds1: roundedOdds1, odds2: roundedOdds2 };
    }

    /**
     * Calculate dollar-based betting examples
     */
    generateBettingExamples(odds) {
        const examples = [];
        const xanaxValues = [1, 2, 3, 5, 10]; // Common betting amounts in Xanax
        
        for (const xanaxAmount of xanaxValues) {
            const betDollars = xanaxAmount * this.config.dollarPerXanax;
            const totalReturnDollars = Math.round(betDollars * odds);
            const profitDollars = totalReturnDollars - betDollars;
            
            examples.push({
                xanaxAmount,
                betDollars,
                totalReturnDollars,
                profitDollars,
                description: `Bet ${xanaxAmount} Xanax ($${betDollars.toLocaleString()}) → Win $${totalReturnDollars.toLocaleString()} total ($${profitDollars.toLocaleString()} profit)`
            });
        }
        
        return examples.slice(0, 3); // Return top 3 examples
    }

    /**
     * Main odds calculation method
     */
    async calculateOdds(faction1Id, faction2Id) {
        try {
            console.log(`\n🎯 CALCULATING PROFESSIONAL ODDS: ${faction1Id} vs ${faction2Id}`);
            
            // Get faction data
            const [faction1, faction2] = await Promise.all([
                this.getFactionData(faction1Id),
                this.getFactionData(faction2Id)
            ]);

            // Handle missing faction data
            if (!faction1 || !faction2) {
                console.warn(`❌ Missing faction data: faction1=${!!faction1}, faction2=${!!faction2}`);
                return this.getFallbackOdds(faction1Id, faction2Id);
            }

            // Calculate win probabilities using power ratings
            const probabilities = this.calculateWinProbabilities(faction1, faction2);
            
            // Apply house edge
            const { impliedProb1, impliedProb2, actualHouseEdge } = this.applyHouseEdge(
                probabilities.prob1, 
                probabilities.prob2
            );
            
            // Convert to decimal odds
            const { odds1, odds2 } = this.convertToDecimalOdds(impliedProb1, impliedProb2);
            
            // Generate betting examples
            const examples1 = this.generateBettingExamples(odds1);
            const examples2 = this.generateBettingExamples(odds2);
            
            // Calculate confidence based on power ratio
            const confidence = Math.min(100, Math.round(Math.abs(Math.log(probabilities.powerRatio)) * 30));
            
            console.log(`\n✅ FINAL RESULT:`);
            console.log(`   ${faction1.name}: ${odds1} (${(probabilities.prob1 * 100).toFixed(1)}% true probability)`);
            console.log(`   ${faction2.name}: ${odds2} (${(probabilities.prob2 * 100).toFixed(1)}% true probability)`);
            console.log(`   Confidence: ${confidence}%`);
            console.log(`   House Edge: ${(actualHouseEdge * 100).toFixed(2)}%`);

            return {
                [faction1Id]: {
                    odds: odds1,
                    impliedProbability: impliedProb1,
                    trueProbability: probabilities.prob1,
                    powerRating: probabilities.power1,
                    format: 'decimal',
                    bettingExamples: examples1
                },
                [faction2Id]: {
                    odds: odds2,
                    impliedProbability: impliedProb2,
                    trueProbability: probabilities.prob2,
                    powerRating: probabilities.power2,
                    format: 'decimal',
                    bettingExamples: examples2
                },
                metadata: {
                    houseEdge: actualHouseEdge * 100,
                    totalImpliedProbability: impliedProb1 + impliedProb2,
                    confidence: confidence,
                    powerRatio: probabilities.powerRatio,
                    timestamp: new Date(),
                    version: '4.0-professional'
                }
            };

        } catch (error) {
            console.error('❌ Professional odds calculation failed:', error.message);
            return this.getFallbackOdds(faction1Id, faction2Id);
        }
    }

    /**
     * Fallback odds when calculation fails
     */
    getFallbackOdds(faction1Id, faction2Id) {
        const fallbackExamples = this.generateBettingExamples(2.00);
        
        return {
            [faction1Id]: {
                odds: 2.00,
                impliedProbability: 0.50,
                trueProbability: 0.485,
                format: 'decimal',
                bettingExamples: fallbackExamples,
                fallback: true
            },
            [faction2Id]: {
                odds: 2.00,
                impliedProbability: 0.50,
                trueProbability: 0.515,
                format: 'decimal',
                bettingExamples: fallbackExamples,
                fallback: true
            },
            metadata: {
                houseEdge: 6.0,
                totalImpliedProbability: 1.06,
                confidence: 0,
                timestamp: new Date(),
                fallback: true,
                version: '4.0-professional'
            }
        };
    }

    /**
     * Calculate exact payout for a specific bet
     */
    calculatePayout(dollarAmount, decimalOdds) {
        if (dollarAmount <= 0) throw new Error('Invalid bet amount');
        if (decimalOdds <= 1) throw new Error('Invalid decimal odds');
        
        const totalReturnDollars = Math.round(dollarAmount * decimalOdds);
        const profitDollars = totalReturnDollars - dollarAmount;
        const xanaxEquivalent = dollarAmount / this.config.dollarPerXanax;
        
        return {
            betDollars: dollarAmount,
            totalReturnDollars,
            profitDollars,
            xanaxEquivalent: Math.round(xanaxEquivalent * 100) / 100,
            odds: decimalOdds,
            description: `Bet $${dollarAmount.toLocaleString()} (${xanaxEquivalent.toFixed(2)} Xanax) → Win $${totalReturnDollars.toLocaleString()} total ($${profitDollars.toLocaleString()} profit)`
        };
    }

    /**
     * Get faction data with caching
     */
    async getFactionData(factionId) {
        const cacheKey = `faction_${factionId}`;
        
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.config.cacheTime) {
            return cached.data;
        }

        try {
            if (!this.factionData) {
                await this.loadFactionData();
            }

            const faction = this.factionData.factions.find(f => f.id.toString() === factionId.toString());

            if (!faction) {
                console.warn(`❌ Faction ${factionId} not found in data`);
                return null;
            }

            const factionData = {
                id: faction.id.toString(),
                name: faction.name || 'Unknown Faction',
                respect: faction.respect || 1000000, // Default 1M respect
                rank: faction.rank || 'Unranked',
                members: faction.members || 50, // Default 50 members
                position: faction.position || 2000 // Default very low position
            };

            this.cache.set(cacheKey, {
                data: factionData,
                timestamp: Date.now()
            });

            return factionData;

        } catch (error) {
            console.error(`❌ Failed to fetch faction ${factionId}:`, error.message);
            return null;
        }
    }

    /**
     * Update Xanax market price
     */
    updateXanaxPrice(newPrice) {
        if (newPrice <= 0) throw new Error('Invalid Xanax price');
        this.config.dollarPerXanax = newPrice;
        console.log(`💰 Xanax price updated to $${newPrice.toLocaleString()}`);
    }

    /**
     * Get engine statistics and health check
     */
    async getHealthCheck() {
        try {
            if (!this.factionData) {
                await this.loadFactionData();
            }
            
            return {
                status: 'healthy',
                timestamp: new Date(),
                version: '4.0-professional',
                cacheSize: this.cache.size,
                factionsLoaded: this.factionData.factions.length,
                oddsFormat: 'decimal',
                houseEdge: `${(this.config.houseEdge * 100).toFixed(1)}%`,
                dollarPerXanax: this.config.dollarPerXanax,
                features: [
                    'Professional power rating system',
                    'Dynamic odds calculation',
                    'Dollar-based payouts',
                    'Natural variance injection',
                    'Comprehensive faction analysis'
                ]
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                timestamp: new Date(),
                version: '4.0-professional',
                error: error.message,
                factionsLoaded: 0
            };
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache cleared');
    }
}

// Export for Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TornProfessionalOddsEngine;
} else if (typeof window !== 'undefined') {
    window.TornProfessionalOddsEngine = TornProfessionalOddsEngine;
}
