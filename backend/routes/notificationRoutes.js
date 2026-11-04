const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/notifications
 */
router.get('/', authenticateToken, (req, res) => {
    try {
        if (!req.user || req.isGuest) {
            return res.json({ success: true, isGuest: true, notifications: [] });
        }

        const notifications = db.prepare(`
            SELECT * FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 30
        `).all(req.user.id);

        return res.json({ success: true, isGuest: false, notifications });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * PUT /api/notifications/:id/read
 */
router.put('/:id/read', authenticateToken, (req, res) => {
    try {
        if (!req.user || req.isGuest) {
            return res.status(401).json({ success: false, error: 'Unauthorized.' });
        }

        db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/notifications/mark-all-read
 */
router.post('/mark-all-read', authenticateToken, (req, res) => {
    try {
        if (!req.user || req.isGuest) {
            return res.status(401).json({ success: false, error: 'Unauthorized.' });
        }

        db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

