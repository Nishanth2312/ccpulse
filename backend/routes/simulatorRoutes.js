const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const {
    executeSimulatedTrade,
    getUserWallet,
    getWalletTransactions
} = require('../services/walletService');

/**
 * POST /api/simulator/trade
 * Execute simulated cryptocurrency buy or sell
 */
router.post('/trade', authenticateToken, (req, res) => {
    try {
        const { crypto_id, type, quantity, custom_price } = req.body;

        if (!crypto_id || !type || !quantity) {
            return res.status(400).json({ success: false, error: 'Cryptocurrency ID, order type (BUY/SELL), and quantity are required.' });
        }

        const crypto = db.prepare('SELECT * FROM cryptocurrencies WHERE id = ?').get(crypto_id);
        if (!crypto) {
            return res.status(404).json({ success: false, error: 'Cryptocurrency not found.' });
        }
        if (!crypto.is_active) {
            return res.status(400).json({ success: false, error: `Trading for ${crypto.symbol} is currently disabled.` });
        }

        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) {
            return res.status(400).json({ success: false, error: 'Quantity must be a positive number.' });
        }

        const priceUsd = custom_price ? parseFloat(custom_price) : crypto.current_price_usd;
        const totalValueUsd = qty * priceUsd;

        // If Guest User
        if (req.isGuest || !req.user) {
            // Guest trade simulation (in-memory calculation returned to client)
            const tradeRef = `GUEST-TR-${type.toUpperCase()}-${Date.now()}`;
            // Increment simulation count on cryptocurrency for popularity tracking
            db.prepare('UPDATE cryptocurrencies SET simulation_count = simulation_count + 1 WHERE id = ?').run(crypto.id);

            return res.json({
                success: true,
                isGuest: true,
                trade: {
                    tradeRef,
                    type: type.toUpperCase(),
                    symbol: crypto.symbol,
                    quantity: qty,
                    priceUsd,
                    totalValueUsd,
                    status: 'EXECUTED_TEMPORARY',
                    note: 'Temporary guest simulated trade. Register or sign in to permanently save your portfolio and $5,000 welcome bonus!'
                }
            });
        }

        // Authenticated user: Atomic execution in database
        const result = executeSimulatedTrade({
            userId: req.user.id,
            cryptoId: crypto.id,
            type,
            quantity: qty,
            customPrice: priceUsd
        });

        const updatedWallet = getUserWallet(req.user.id);

        return res.json({
            success: true,
            isGuest: false,
            ...result,
            wallet: updatedWallet
        });

    } catch (err) {
        return res.status(400).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/simulator/portfolio
 * User portfolio overview and holdings
 */
router.get('/portfolio', authenticateToken, (req, res) => {
    try {
        if (req.isGuest || !req.user) {
            return res.json({
                success: true,
                isGuest: true,
                portfolio: {
                    availableCashUsd: 5000.00,
                    investedUsd: 0.00,
                    totalPortfolioValueUsd: 5000.00,
                    totalProfitLossUsd: 0.00,
                    totalProfitLossPercent: 0.00,
                    holdings: []
                }
            });
        }

        const portfolio = getUserWallet(req.user.id);
        const transactions = getWalletTransactions(req.user.id, 20);

        return res.json({
            success: true,
            isGuest: false,
            portfolio,
            transactions
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/simulator/trades
 * Trade history
 */
router.get('/trades', authenticateToken, (req, res) => {
    try {
        if (req.isGuest || !req.user) {
            return res.json({ success: true, isGuest: true, trades: [] });
        }

        const trades = db.prepare(`
            SELECT t.*, c.name as crypto_name, c.logo_url
            FROM simulated_trades t
            JOIN cryptocurrencies c ON t.crypto_id = c.id
            WHERE t.user_id = ?
            ORDER BY t.executed_at DESC
            LIMIT 50
        `).all(req.user.id);

        return res.json({ success: true, isGuest: false, trades });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

