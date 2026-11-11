const express = require('express');
const router = express.Router();
const db = require('../database/db');
const {
    getActiveCryptos,
    getCryptoBySymbolOrSlug,
    getHistoricalChartData,
    getOrderBook,
    fetchLiveCryptoRatesFromCoinGecko,
    fetchMultiTierCryptoRates,
    getCryptoFeedStatus
} = require('../services/cryptoMarketService');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/cryptos
 * Public and authenticated market list
 */
router.get('/', (req, res) => {
    try {
        const cryptos = getActiveCryptos();
        const feed = getCryptoFeedStatus();
        return res.json({ success: true, count: cryptos.length, cryptos, feed });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/cryptos/refresh
 * Refresh live cryptocurrency rates with 30-minute quota caching & multi-tier failover
 */
router.post('/refresh', async (req, res) => {
    try {
        const force = req.query.force === 'true' || req.body?.force === true;
        const result = await fetchMultiTierCryptoRates(force);
        const cryptos = getActiveCryptos();
        return res.json({ success: true, ...result, count: cryptos.length, cryptos });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/cryptos/feed-status
 * Check live feed health and metadata
 */
router.get('/feed-status', (req, res) => {
    try {
        const status = getCryptoFeedStatus();
        return res.json({ success: true, ...status });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/cryptos/watchlist
 * Authenticated user's watchlist
 */
router.get('/watchlist/user', authenticateToken, (req, res) => {
    try {
        if (!req.user || req.isGuest) {
            return res.json({ success: true, isGuest: true, watchlist: [] });
        }

        const watchlist = db.prepare(`
            SELECT c.*
            FROM user_watchlists w
            JOIN cryptocurrencies c ON w.crypto_id = c.id
            WHERE w.user_id = ? AND c.is_active = 1
            ORDER BY w.added_at DESC
        `).all(req.user.id);

        return res.json({ success: true, isGuest: false, watchlist });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/cryptos/watchlist/toggle
 */
router.post('/watchlist/toggle', authenticateToken, (req, res) => {
    try {
        if (!req.user || req.isGuest) {
            return res.status(401).json({ success: false, error: 'Sign in to save coins to your permanent watchlist.' });
        }

        const { crypto_id } = req.body;
        if (!crypto_id) {
            return res.status(400).json({ success: false, error: 'Crypto ID is required.' });
        }

        const existing = db.prepare('SELECT id FROM user_watchlists WHERE user_id = ? AND crypto_id = ?').get(req.user.id, crypto_id);
        let isSaved = false;

        if (existing) {
            db.prepare('DELETE FROM user_watchlists WHERE id = ?').run(existing.id);
            isSaved = false;
        } else {
            db.prepare('INSERT INTO user_watchlists (user_id, crypto_id) VALUES (?, ?)').run(req.user.id, crypto_id);
            isSaved = true;
        }

        return res.json({ success: true, isSaved, message: isSaved ? 'Added to watchlist.' : 'Removed from watchlist.' });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/cryptos/:identifier
 * Detailed coin profile (increments view count)
 */
router.get('/:identifier', (req, res) => {
    try {
        const crypto = getCryptoBySymbolOrSlug(req.params.identifier, true);
        if (!crypto) {
            return res.status(404).json({ success: false, error: 'Cryptocurrency not found.' });
        }

        return res.json({ success: true, crypto });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/cryptos/:id/chart
 */
router.get('/:id/chart', (req, res) => {
    try {
        const cryptoId = parseInt(req.params.id, 10);
        const timeframe = req.query.timeframe || '1D';
        const chartData = getHistoricalChartData(cryptoId, timeframe);
        return res.json({ success: true, timeframe, data: chartData });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/cryptos/:id/orderbook
 */
router.get('/:id/orderbook', (req, res) => {
    try {
        const cryptoId = parseInt(req.params.id, 10);
        const orderbook = getOrderBook(cryptoId);
        return res.json({ success: true, orderbook });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

