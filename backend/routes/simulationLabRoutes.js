const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { getUserWallet } = require('../services/walletService');

const SCENARIOS = [
    {
        id: 'bull-run',
        title: 'Macro Bull Market Rally',
        description: 'Institutional capital inflows and monetary easing ignite a parabolic market expansion across digital assets.',
        multipliers: { BTC: 1.45, ETH: 1.55, XMR: 1.40, BDX: 1.85, SOL: 1.70, DEFAULT: 1.50 },
        riskTakeaway: 'In strong bull markets, remember to rebalance profits systematically rather than chasing extended green candles with high leverage.'
    },
    {
        id: 'flash-crash',
        title: 'Liquidity Squeeze & Flash Crash',
        description: 'A cascading liquidation event on leveraged derivatives exchanges causes a sharp 30-minute market drawdown.',
        multipliers: { BTC: 0.70, ETH: 0.65, XMR: 0.60, BDX: 0.55, SOL: 0.58, DEFAULT: 0.65 },
        riskTakeaway: 'Always keep liquid cash reserves (stablecoins/USD) to survive volatility cascades and capitalize on discounted valuations without forced selling.'
    },
    {
        id: 'privacy-surge',
        title: 'Privacy Protocol Innovation Surge',
        description: 'Rising surveillance concerns prompt widespread global demand for confidential transactions and untraceable ledgers.',
        multipliers: { BTC: 1.05, ETH: 1.08, XMR: 1.85, BDX: 2.20, SOL: 1.10, DEFAULT: 1.10 },
        riskTakeaway: 'Niche sector momentum can outperform broader market beta. Diversification across technology stacks protects against category underperformance.'
    },
    {
        id: 'regulatory-crackdown',
        title: 'Global Regulatory Action & Enforcement',
        description: 'Coordinated international financial regulatory notices create temporary market fear, uncertainty, and liquidity contraction.',
        multipliers: { BTC: 0.82, ETH: 0.78, XMR: 0.68, BDX: 0.62, SOL: 0.75, DEFAULT: 0.78 },
        riskTakeaway: 'Regulatory scrutiny disproportionately impacts centralized touchpoints and privacy assets; decentralized self-custody principles are essential.'
    },
    {
        id: 'halving-shock',
        title: 'Bitcoin Halving Supply Shock',
        description: 'Mining issuance cut by 50%, tightening circulating supply and creating an exponential supply-demand imbalance.',
        multipliers: { BTC: 1.65, ETH: 1.40, XMR: 1.30, BDX: 1.45, SOL: 1.50, DEFAULT: 1.40 },
        riskTakeaway: 'Fundamental tokenomics and issuance schedules are long-term structural price drivers distinct from short-term speculative hype.'
    }
];

/**
 * GET /api/simulation-lab/scenarios
 */
router.get('/scenarios', (req, res) => {
    return res.json({ success: true, scenarios: SCENARIOS });
});

/**
 * POST /api/simulation-lab/simulate
 * Calculate simulated scenario impact on current portfolio
 */
router.post('/simulate', authenticateToken, (req, res) => {
    try {
        const { scenario_id } = req.body;
        const scenario = SCENARIOS.find(s => s.id === scenario_id) || SCENARIOS[0];

        let wallet = null;
        if (req.user && !req.isGuest) {
            wallet = getUserWallet(req.user.id);
        }

        // If guest or no holdings, use standard sample portfolio of $5,000 with 50% cash, 30% BTC, 20% ETH
        const holdings = (wallet && wallet.holdings.length > 0) ? wallet.holdings : [
            { symbol: 'BTC', quantity: 0.0219, avg_buy_price_usd: 68450, total_invested_usd: 1500, current_price_usd: 68450 },
            { symbol: 'ETH', quantity: 0.377, avg_buy_price_usd: 2650, total_invested_usd: 1000, current_price_usd: 2650 }
        ];

        const cashUsd = wallet ? wallet.availableCashUsd : 2500;
        let originalPortfolioValue = cashUsd;
        let simulatedPortfolioValue = cashUsd;

        const simulatedHoldings = holdings.map(h => {
            const mult = scenario.multipliers[h.symbol] || scenario.multipliers.DEFAULT;
            const originalVal = h.quantity * h.current_price_usd;
            const simulatedPrice = h.current_price_usd * mult;
            const simulatedVal = h.quantity * simulatedPrice;

            originalPortfolioValue += originalVal;
            simulatedPortfolioValue += simulatedVal;

            return {
                symbol: h.symbol,
                quantity: h.quantity,
                originalPriceUsd: h.current_price_usd,
                simulatedPriceUsd: Number(simulatedPrice.toFixed(2)),
                priceChangePercent: Number(((mult - 1) * 100).toFixed(1)),
                originalValueUsd: Number(originalVal.toFixed(2)),
                simulatedValueUsd: Number(simulatedVal.toFixed(2)),
                deltaUsd: Number((simulatedVal - originalVal).toFixed(2))
            };
        });

        const totalDeltaUsd = simulatedPortfolioValue - originalPortfolioValue;
        const totalDeltaPercent = originalPortfolioValue > 0 ? (totalDeltaUsd / originalPortfolioValue) * 100 : 0;

        return res.json({
            success: true,
            scenario: {
                id: scenario.id,
                title: scenario.title,
                description: scenario.description,
                riskTakeaway: scenario.riskTakeaway
            },
            impact: {
                cashUsd,
                originalPortfolioValueUsd: Number(originalPortfolioValue.toFixed(2)),
                simulatedPortfolioValueUsd: Number(simulatedPortfolioValue.toFixed(2)),
                totalDeltaUsd: Number(totalDeltaUsd.toFixed(2)),
                totalDeltaPercent: Number(totalDeltaPercent.toFixed(2)),
                holdings: simulatedHoldings
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

