/**
 * Decimal Odds Engine for Torn City Faction War Betting
 * Optimized for whole Xanax betting with clean payouts
 */

class TornDecimalOddsEngine {
    constructor(options = {}) {
        this.factionData = null;
        this.cache = new Map();
        
        // Decimal odds configuration
        this.config = {
            houseEdge: options.houseEdge || 0.06,        // 6% house edge
            cacheTime: options.cacheTime || 300000,      // 5 minutes
            maxProbability: 0.80,                        // 80% max (allows more extreme odds)
            minProbability: 0.20,                        // 20% min (allows more extreme odds)
            xanaxPrice: options.xanaxPrice || 744983,    // Current Xanax market price
            
            // Probability weights
            rankWeight: 0.50,
            respectWeight: 0.35,
            memberWeight: 0.15,
            
            // Clean decimal odds that work with whole Xanax
            allowedOdds: [
                1.20,  // Bet 5 Xanax → Win 6 Xanax total (1 profit)
                1.25,  // Bet 4 Xanax → Win 5 Xanax total (1 profit)
                1.33,  // Bet 3 Xanax → Win 4 Xanax total (1 profit)
                1.50,  // Bet 2 Xanax → Win 3 Xanax total (1 profit)
                1.67,  // Bet 3 Xanax → Win 5 Xanax total (2 profit)
                2.00,  // Bet 1 Xanax → Win 2 Xanax total (1 profit) - EVEN MONEY
                2.50,  // Bet 2 Xanax → Win 5 Xanax total (3 profit)
                3.00,  // Bet 1 Xanax → Win 3 Xanax total (2 profit)
                4.00,  // Bet 1 Xanax → Win 4 Xanax total (3 profit)
                5.00   // Bet 1 Xanax → Win 5 Xanax total (4 profit)
            ]
        };
        
        console.log('TornDecimalOddsEngine initialized with Xanax-friendly odds');
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
     * Main odds calculation method - returns decimal odds
     */
    async calculateOdds(faction1Id, faction2Id) {
        try {
            console.log(`Calculating decimal odds for factions ${faction1Id} vs ${faction2Id}`);
            
            // Fetch faction data
            const [faction1, faction2] = await Promise.all([
                this.getFactionData(faction1Id),
                this.getFactionData(faction2Id)
            ]);

            if (!faction1 || !faction2) {
                console.error(`Missing faction data: faction1=${!!faction1}, faction2=${!!faction2}`);
                throw new Error('Faction data not found');
            }

            // Calculate true probabilities
            const trueProbability1 = this.calculateWinProbability(faction1, faction2);
            const trueProbability2 = 1 - trueProbability1;

            // Apply house edge
            const bettingOdds = this.applyHouseEdge(trueProbability1, trueProbability2);

            // Convert to clean decimal odds
            const odds1 = this.convertToCleanDecimalOdds(bettingOdds.prob1);
            const odds2 = this.convertToCleanDecimalOdds(bettingOdds.prob2);

            console.log(`True probabilities: ${(trueProbability1 * 100).toFixed(1)}% vs ${(trueProbability2 * 100).toFixed(1)}%`);
            console.log(`Decimal odds: ${odds1} vs ${odds2}`);
            console.log(`House edge: ${((bettingOdds.totalImpliedProb - 1) * 100).toFixed(2)}%`);

            return {
                [faction1Id]: {
                    odds: odds1,
                    impliedProbability: 1 / odds1,
                    trueProbability: trueProbability1,
                    format: 'decimal',
                    bettingExamples: this.getBettingExamples(odds1)
                },
                [faction2Id]: {
                    odds: odds2,
                    impliedProbability: 1 / odds2,
                    trueProbability: trueProbability2,
                    format: 'decimal',
                    bettingExamples: this.getBettingExamples(odds2)
                },
                metadata: {
                    houseEdge: (bettingOdds.totalImpliedProb - 1) * 100,
                    totalImpliedProbability: bettingOdds.totalImpliedProb,
                    confidence: this.calculateConfidence(trueProbability1),
                    timestamp: new Date()
                }
            };

        } catch (error) {
            console.error('Decimal odds calculation failed:', error.message);
            throw error;
        }
    }

    /**
     * Convert probability to nearest clean decimal odds with better differentiation
     */
    convertToCleanDecimalOdds(probability) {
        // Convert probability to ideal decimal odds
        const idealOdds = 1 / probability;
        
        // Use a more focused set of odds that work well with Xanax betting
        const allowedOdds = [
            1.25, 1.33, 1.50, 1.67, 1.75, 1.80, 1.90, 2.00, 2.10, 2.20, 2.30, 2.40, 2.50, 2.60, 2.70, 2.80, 2.90, 3.00, 3.25, 3.50, 4.00, 5.00
        ];
        
        // Find the closest allowed odds
        let closestOdds = allowedOdds[0];
        let smallestDiff = Math.abs(idealOdds - closestOdds);
        
        for (const odds of allowedOdds) {
            const diff = Math.abs(idealOdds - odds);
            if (diff < smallestDiff) {
                smallestDiff = diff;
                closestOdds = odds;
            }
        }
        
        // Add some variation to avoid too many identical odds
        // If the probability is very close to 0.5 (50%), add some randomness
        if (Math.abs(probability - 0.5) < 0.05) {
            // For close matches, use odds around 2.00 with some variation
            const closeMatchOdds = [1.90, 2.00, 2.10, 1.80, 2.20];
            closestOdds = closeMatchOdds[Math.floor(Math.random() * closeMatchOdds.length)];
        }
        
        return closestOdds;
    }

    /**
     * Get betting examples for decimal odds
     */
    getBettingExamples(odds) {
        const examples = [];
        
        // Generate practical betting examples
        for (let bet = 1; bet <= 5; bet++) {
            const totalReturn = bet * odds;
            const profit = totalReturn - bet;
            
            // Only show if total return is a whole number
            if (Number.isInteger(totalReturn)) {
                examples.push({
                    bet: bet,
                    totalReturn: totalReturn,
                    profit: profit,
                    description: `Bet ${bet} Xanax → Win ${totalReturn} Xanax total (${profit} profit)`
                });
            }
        }
        
        // If no clean examples, show the simplest one
        if (examples.length === 0) {
            const bet = 1;
            const totalReturn = Math.round(bet * odds);
            const profit = totalReturn - bet;
            examples.push({
                bet: bet,
                totalReturn: totalReturn,
                profit: profit,
                description: `Bet ${bet} Xanax → Win ~${totalReturn} Xanax total (~${profit} profit)`
            });
        }
        
        return examples.slice(0, 3); // Return top 3 examples
    }

    /**
     * Calculate payout for decimal odds
     */
    calculatePayout(xanaxAmount, decimalOdds) {
        if (xanaxAmount <= 0) throw new Error('Invalid Xanax amount');
        if (decimalOdds <= 1) throw new Error('Invalid decimal odds');
        
        const totalReturnXanax = Math.round(xanaxAmount * decimalOdds);
        const profitXanax = totalReturnXanax - xanaxAmount;
        
        return {
            xanaxStake: xanaxAmount,
            xanaxTotalReturn: totalReturnXanax,
            xanaxProfit: profitXanax,
            dollarStake: xanaxAmount * this.config.xanaxPrice,
            dollarTotalReturn: totalReturnXanax * this.config.xanaxPrice,
            dollarProfit: profitXanax * this.config.xanaxPrice,
            odds: decimalOdds,
            description: `Bet ${xanaxAmount} Xanax → Win ${totalReturnXanax} Xanax total (${profitXanax} profit)`
        };
    }

    /**
     * Get all possible clean bets for given odds
     */
    getAllPossibleBets(decimalOdds, maxXanax = 10) {
        const possibleBets = [];
        
        for (let bet = 1; bet <= maxXanax; bet++) {
            const totalReturn = bet * decimalOdds;
            const profit = totalReturn - bet;
            
            // Check if total return is a whole number (or very close)
            if (Math.abs(totalReturn - Math.round(totalReturn)) < 0.01) {
                const roundedReturn = Math.round(totalReturn);
                const roundedProfit = roundedReturn - bet;
                
                possibleBets.push({
                    bet: bet,
                    totalReturn: roundedReturn,
                    profit: roundedProfit,
                    dollarStake: bet * this.config.xanaxPrice,
                    dollarReturn: roundedReturn * this.config.xanaxPrice,
                    dollarProfit: roundedProfit * this.config.xanaxPrice
                });
            }
        }
        
        return possibleBets;
    }

    // ... (keeping the same helper methods from the previous engine)
    calculateWinProbability(faction1, faction2) {
        const rankProb = this.calculateRankProbability(faction1.rank, faction2.rank);
        const respectProb = this.calculateRespectProbability(faction1.respect, faction2.respect);
        const memberProb = this.calculateMemberProbability(faction1.members, faction2.members);
        
        // Calculate weighted probability
        let totalProbability = (
            (rankProb * this.config.rankWeight) +
            (respectProb * this.config.respectWeight) + 
            (memberProb * this.config.memberWeight)
        );
        
        // Add some variation based on faction differences
        const respectDiff = Math.abs((faction1.respect || 0) - (faction2.respect || 0));
        const memberDiff = Math.abs((faction1.members || 0) - (faction2.members || 0));
        
        // If there are significant differences, amplify the probability
        if (respectDiff > 1000000 || memberDiff > 10) {
            const amplification = Math.min(0.1, (respectDiff / 10000000) + (memberDiff / 100));
            if (totalProbability > 0.5) {
                totalProbability += amplification;
            } else {
                totalProbability -= amplification;
            }
        }
        
        return Math.max(this.config.minProbability, Math.min(this.config.maxProbability, totalProbability));
    }

    applyHouseEdge(prob1, prob2) {
        const overround = 1 + this.config.houseEdge;
        const impliedProb1 = prob1 * overround;
        const impliedProb2 = prob2 * overround;
        
        const maxProb = Math.max(impliedProb1, impliedProb2);
        if (maxProb > this.config.maxProbability) {
            const scaleFactor = this.config.maxProbability / maxProb;
            return {
                prob1: impliedProb1 * scaleFactor,
                prob2: impliedProb2 * scaleFactor,
                totalImpliedProb: (impliedProb1 + impliedProb2) * scaleFactor
            };
        }
        
        return {
            prob1: impliedProb1,
            prob2: impliedProb2,
            totalImpliedProb: impliedProb1 + impliedProb2
        };
    }

    calculateRankProbability(rank1, rank2) {
        const rankValues = {
            'Diamond I': 15, 'Diamond II': 14, 'Diamond III': 13, 'Diamond': 12,
            'Platinum I': 11, 'Platinum II': 10, 'Platinum III': 9, 'Platinum': 8,
            'Gold I': 7, 'Gold II': 6, 'Gold III': 5, 'Gold': 4,
            'Silver I': 3, 'Silver II': 2, 'Silver III': 1, 'Silver': 1,
            'Bronze I': 0.5, 'Bronze II': 0.3, 'Bronze III': 0.1, 'Bronze': 0.1,
            'Unranked': 0.05
        };

        const value1 = rankValues[rank1] || 0.05;
        const value2 = rankValues[rank2] || 0.05;
        
        const total = value1 + value2;
        return total > 0 ? value1 / total : 0.5;
    }

    calculateRespectProbability(respect1, respect2) {
        if (!respect1 && !respect2) return 0.5;
        
        // Use cube root for better differentiation of large respect differences
        const cubeRoot1 = Math.pow(respect1 || 0, 1/3);
        const cubeRoot2 = Math.pow(respect2 || 0, 1/3);
        
        const total = cubeRoot1 + cubeRoot2;
        return total > 0 ? cubeRoot1 / total : 0.5;
    }

    calculateMemberProbability(members1, members2) {
        const efficiency1 = this.getMemberEfficiency(members1 || 0);
        const efficiency2 = this.getMemberEfficiency(members2 || 0);
        
        const total = efficiency1 + efficiency2;
        return total > 0 ? efficiency1 / total : 0.5;
    }

    getMemberEfficiency(members) {
        if (members <= 25) {
            return members;
        } else {
            return 25 + Math.sqrt(members - 25) * 2;
        }
    }

    calculateConfidence(probability) {
        const deviation = Math.abs(probability - 0.5);
        return Math.round(deviation * 200);
    }

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
                console.warn(`Faction ${factionId} not found in JSON data`);
                return null;
            }

            const factionData = {
                id: faction.id.toString(),
                name: faction.name || 'Unknown Faction',
                respect: faction.respect || 0,
                rank: faction.rank || 'Unranked',
                members: faction.members || 0,
                position: faction.position || 999
            };

            this.cache.set(cacheKey, {
                data: factionData,
                timestamp: Date.now()
            });

            return factionData;

        } catch (error) {
            console.error(`Failed to fetch faction ${factionId}:`, error.message);
            return null;
        }
    }

    /**
     * Update Xanax market price
     */
    updateXanaxPrice(newPrice) {
        if (newPrice <= 0) throw new Error('Invalid Xanax price');
        this.config.xanaxPrice = newPrice;
        console.log(`Xanax price updated to $${newPrice.toLocaleString()}`);
    }

    /**
     * Get current Xanax price
     */
    getXanaxPrice() {
        return this.config.xanaxPrice;
    }

    /**
     * Get engine statistics
     */
    getStats() {
        return {
            cacheSize: this.cache.size,
            config: { ...this.config },
            version: '3.0.0-decimal',
            oddsFormat: 'decimal',
            houseEdge: `${(this.config.houseEdge * 100).toFixed(1)}%`,
            allowedOdds: this.config.allowedOdds
        };
    }

    clearCache() {
        this.cache.clear();
    }

    async healthCheck() {
        try {
            if (!this.factionData) {
                await this.loadFactionData();
            }
            
            return {
                status: 'healthy',
                timestamp: new Date(),
                cacheSize: this.cache.size,
                factionsLoaded: this.factionData.factions.length,
                oddsFormat: 'decimal',
                houseEdge: `${(this.config.houseEdge * 100).toFixed(1)}%`,
                allowedOdds: this.config.allowedOdds,
                lastUpdated: this.factionData.lastUpdated
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                timestamp: new Date(),
                error: error.message,
                factionsLoaded: 0
            };
        }
    }
}

// Export for Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TornDecimalOddsEngine;
} else if (typeof window !== 'undefined') {
    window.TornDecimalOddsEngine = TornDecimalOddsEngine;
}
