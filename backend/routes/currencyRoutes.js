const express = require('express');
const router = express.Router();
const db = require('../database/db');
const {
    getCurrencyStatus,
    convertFromUsd,
    fetchLiveExchangeRates,
    getSupportedCurrenciesList
} = require('../services/currencyService');
const { requireAdmin } = require('../middleware/auth');
const { logAdminAction } = require('../services/auditService');

/**
 * GET /api/currency/status
 * Get current exchange rates, provider metadata, and stale status
 */
router.get('/status', (req, res) => {
    try {
        const status = getCurrencyStatus();
        return res.json({ success: true, ...status });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/currency/convert
 * Convert USD amount to target currency
 */
router.get('/convert', (req, res) => {
    try {
        const { amount, currency = 'USD' } = req.query;
        if (amount === undefined || isNaN(parseFloat(amount))) {
            return res.status(400).json({ success: false, error: 'Valid numerical amount is required.' });
        }

        const result = convertFromUsd(parseFloat(amount), currency);
        return res.json({ success: true, ...result });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/currency/refresh
 * Refresh exchange rates from live external Forex API
 */
router.post('/refresh', async (req, res) => {
    try {
        const result = await fetchLiveExchangeRates(true);
        return res.json(result);
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * PUT /api/currency/:code
 * Admin update currency rate or status
 */
router.put('/:code', requireAdmin, (req, res) => {
    try {
        const code = req.params.code.toUpperCase();
        const { exchange_rate_to_usd, is_active } = req.body;

        const current = db.prepare('SELECT * FROM supported_currencies WHERE code = ?').get(code);
        if (!current) {
            return res.status(404).json({ success: false, error: `Currency ${code} not found.` });
        }

        const newRate = exchange_rate_to_usd !== undefined ? parseFloat(exchange_rate_to_usd) : current.exchange_rate_to_usd;
        const newActive = is_active !== undefined ? (is_active ? 1 : 0) : current.is_active;

        db.prepare(`
            UPDATE supported_currencies
            SET exchange_rate_to_usd = ?, is_active = ?, last_updated_at = CURRENT_TIMESTAMP
            WHERE code = ?
        `).run(newRate, newActive, code);

        logAdminAction({
            adminId: req.user.id,
            adminUsername: req.user.username,
            action: 'UPDATE_EXCHANGE_RATE',
            entityType: 'supported_currencies',
            entityId: code,
            oldValues: current,
            newValues: { exchange_rate_to_usd: newRate, is_active: newActive },
            auditReason: `Manually updated currency rate for ${code} to ${newRate}`
        });

        return res.json({
            success: true,
            message: `Currency ${code} updated.`,
            currency: { code, exchangeRate: newRate, isActive: Boolean(newActive) }
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

