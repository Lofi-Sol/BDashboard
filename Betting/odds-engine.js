/**
 * Simplified Torn City Faction War Odds Engine
 * Clean, focused implementation without over-engineering
 */

class TornOddsEngine {
    constructor(mongoDb, options = {}) {
        this.db = mongoDb;
        this.cache = new Map();
        
        // Simple configuration - only essentials
        this.config = {
            houseEdge: options.houseEdge || 0.06,        // 6%
            cacheTime: options.cacheTime || 300000,      // 5 minutes
            maxOdds: options.maxOdds || 90,              // 90%
            minOdds: options.minOdds || 10,              // 10%
            
            // Probability weights
            rankWeight: 0.50,     // 50% - Most important
            respectWeight: 0.35,  // 35% - Secondary
            memberWeight: 0.15    // 15% - Least important
        };
        
        console.log('TornOddsEngine initialized (simplified)');
    }

    /**
     * Main odds calculation method
     */
    async calculateOdds(faction1Id, faction2Id) {
        try {
            console.log(`Calculating odds for factions ${faction1Id} vs ${faction2Id}`);
            
            // Fetch faction data
            const [faction1, faction2] = await Promise.all([
                this.getFactionData(faction1Id),
                this.getFactionData(faction2Id)
            ]);

            if (!faction1 || !faction2) {
                console.error(`Missing faction data: faction1=${!!faction1}, faction2=${!!faction2}`);
                throw new Error('Faction data not found');
            }

            console.log(`Faction data loaded: ${faction1.name} (${faction1.rank}, ${faction1.respect}) vs ${faction2.name} (${faction2.rank}, ${faction2.respect})`);

            // Calculate base probabilities
            const probability1 = this.calculateWinProbability(faction1, faction2);
            const probability2 = 1 - probability1;

            // Apply house edge and convert to odds
            const odds1 = this.probabilityToOdds(probability1);
            const odds2 = this.probabilityToOdds(probability2);

            console.log(`Calculated odds: ${odds1}% vs ${odds2}% (probability: ${(probability1 * 100).toFixed(1)}% vs ${(probability2 * 100).toFixed(1)}%)`);

            return {
                [faction1Id]: odds1,
                [faction2Id]: odds2,
                metadata: {
                    confidence: this.calculateConfidence(probability1),
                    timestamp: new Date()
                }
            };

        } catch (error) {
            console.error('Odds calculation failed:', error.message);
            throw error;
        }
    }

    /**
     * Calculate win probability for faction1 vs faction2
     */
    calculateWinProbability(faction1, faction2) {
        // Rank probability
        const rankProb = this.calculateRankProbability(faction1.rank, faction2.rank);
        
        // Respect probability  
        const respectProb = this.calculateRespectProbability(faction1.respect, faction2.respect);
        
        // Member probability
        const memberProb = this.calculateMemberProbability(faction1.members, faction2.members);
        
        // Weighted combination
        const totalProbability = (
            (rankProb * this.config.rankWeight) +
            (respectProb * this.config.respectWeight) + 
            (memberProb * this.config.memberWeight)
        );
        
        // Ensure reasonable bounds (factions are matched, so shouldn't be too extreme)
        return Math.max(0.15, Math.min(0.85, totalProbability));
    }

    /**
     * Calculate rank-based probability
     */
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

    /**
     * Calculate respect-based probability
     */
    calculateRespectProbability(respect1, respect2) {
        if (!respect1 && !respect2) return 0.5;
        
        // Use square root to reduce extreme differences
        const sqrt1 = Math.sqrt(respect1 || 0);
        const sqrt2 = Math.sqrt(respect2 || 0);
        
        const total = sqrt1 + sqrt2;
        return total > 0 ? sqrt1 / total : 0.5;
    }

    /**
     * Calculate member-based probability with diminishing returns
     */
    calculateMemberProbability(members1, members2) {
        // Efficiency curve - optimal around 25-30 members
        const efficiency1 = this.getMemberEfficiency(members1 || 0);
        const efficiency2 = this.getMemberEfficiency(members2 || 0);
        
        const total = efficiency1 + efficiency2;
        return total > 0 ? efficiency1 / total : 0.5;
    }

    /**
     * Member efficiency with diminishing returns
     */
    getMemberEfficiency(members) {
        // Peak efficiency around 25-30 members, then diminishing returns
        if (members <= 25) {
            return members;
        } else {
            return 25 + Math.sqrt(members - 25) * 2;
        }
    }

    /**
     * Convert probability to odds with house edge
     */
    probabilityToOdds(probability) {
        // Apply house edge
        const adjustedProbability = probability * (1 - this.config.houseEdge);
        
        // Convert to percentage
        const odds = adjustedProbability * 100;
        
        // Apply min/max limits
        return Math.round(Math.max(this.config.minOdds, Math.min(this.config.maxOdds, odds)));
    }

    /**
     * Calculate confidence based on how close to 50/50 the odds are
     */
    calculateConfidence(probability) {
        // More extreme probabilities = higher confidence
        const deviation = Math.abs(probability - 0.5);
        return Math.round(deviation * 200); // 0-100 scale
    }

    /**
     * Fetch faction data with simple caching
     */
    async getFactionData(factionId) {
        const cacheKey = `faction_${factionId}`;
        
        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.config.cacheTime) {
            return cached.data;
        }

        try {
            // Fetch from MongoDB
            const faction = await this.db.collection('factions').findOne({
                id: parseInt(factionId)
            });

            if (!faction) {
                console.warn(`Faction ${factionId} not found in database`);
                return null;
            }

            // Transform to expected format with better defaults
            const factionData = {
                id: faction.id.toString(),
                name: faction.name || 'Unknown Faction',
                respect: faction.respect || 0,
                rank: faction.rank || 'Unranked',
                members: faction.members || 0,
                position: faction.position || 999
            };

            // Cache the result
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
     * Calculate payout for a bet
     */
    calculatePayout(betAmount, odds) {
        if (betAmount <= 0) throw new Error('Invalid bet amount');
        if (odds <= 0 || odds >= 100) throw new Error('Invalid odds');
        
        return Math.round(betAmount * (100 / odds));
    }

    /**
     * Get basic stats
     */
    getStats() {
        return {
            cacheSize: this.cache.size,
            config: { ...this.config },
            version: '2.0.0-simplified'
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            // Test database connection
            await this.db.collection('factions').findOne({}, { limit: 1 });
            
            return {
                status: 'healthy',
                timestamp: new Date(),
                cacheSize: this.cache.size,
                dbConnected: true
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                timestamp: new Date(),
                error: error.message,
                dbConnected: false
            };
        }
    }
}

// Export for Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TornOddsEngine;
} else if (typeof window !== 'undefined') {
    window.TornOddsEngine = TornOddsEngine;
}
