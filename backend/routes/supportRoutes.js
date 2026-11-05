const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { optionalAuth } = require('../middleware/auth');

/**
 * POST /api/support/tickets
 * Create / raise a new support ticket (authenticated or guest)
 */
router.post('/tickets', optionalAuth, (req, res) => {
    try {
        const { subject, category, priority = 'medium', description, email, name, guest_session_id } = req.body;

        if (!subject || !subject.trim()) {
            return res.status(400).json({ success: false, error: 'Subject is required.' });
        }
        if (!description || !description.trim()) {
            return res.status(400).json({ success: false, error: 'Description is required.' });
        }

        const userId = req.user ? req.user.id : null;
        const userEmail = req.user ? req.user.email : (email || 'guest@ccpulse.com').trim();
        const userName = req.user ? (req.user.full_name || req.user.username) : (name || 'Guest User').trim();
        const guestId = req.user ? null : (guest_session_id || 'guest-' + Date.now());

        const ticketCode = 'TKT-' + Math.floor(100000 + Math.random() * 900000);

        const insertTicket = db.prepare(`
            INSERT INTO support_tickets (ticket_code, user_id, guest_session_id, user_email, user_name, subject, category, priority, status, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)
        `);

        const result = insertTicket.run(
            ticketCode,
            userId,
            guestId,
            userEmail,
            userName,
            subject.trim(),
            category || 'General',
            priority.toLowerCase(),
            description.trim()
        );

        const ticketId = result.lastInsertRowid;

        // Automatically add first message as initial reply
        db.prepare(`
            INSERT INTO ticket_replies (ticket_id, sender_id, sender_name, sender_role, message)
            VALUES (?, ?, ?, ?, ?)
        `).run(ticketId, userId, userName, req.user ? 'user' : 'guest', description.trim());

        const newTicket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticketId);

        return res.status(201).json({
            success: true,
            message: 'Support ticket successfully submitted. Our team will review it promptly.',
            ticket: newTicket
        });
    } catch (err) {
        console.error('Create ticket error:', err);
        return res.status(500).json({ success: false, error: 'Failed to create support ticket: ' + err.message });
    }
});

/**
 * GET /api/support/tickets
 * List tickets for current user or guest
 */
router.get('/tickets', optionalAuth, (req, res) => {
    try {
        let tickets = [];
        if (req.user) {
            tickets = db.prepare(`
                SELECT t.*, (SELECT COUNT(*) FROM ticket_replies WHERE ticket_id = t.id) as reply_count
                FROM support_tickets t
                WHERE t.user_id = ? OR t.user_email = ?
                ORDER BY t.created_at DESC
            `).all(req.user.id, req.user.email);
        } else {
            const guestId = req.query.guest_session_id;
            const email = req.query.email;
            if (guestId || email) {
                tickets = db.prepare(`
                    SELECT t.*, (SELECT COUNT(*) FROM ticket_replies WHERE ticket_id = t.id) as reply_count
                    FROM support_tickets t
                    WHERE t.guest_session_id = ? OR t.user_email = ?
                    ORDER BY t.created_at DESC
                `).all(guestId || '', email || '');
            } else {
                tickets = db.prepare(`
                    SELECT t.*, (SELECT COUNT(*) FROM ticket_replies WHERE ticket_id = t.id) as reply_count
                    FROM support_tickets t
                    ORDER BY t.created_at DESC
                    LIMIT 20
                `).all();
            }
        }

        return res.json({ success: true, tickets });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/support/tickets/:id
 * Retrieve ticket and conversation thread
 */
router.get('/tickets/:id', optionalAuth, (req, res) => {
    try {
        const ticketId = parseInt(req.params.id, 10);
        const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticketId);

        if (!ticket) {
            return res.status(404).json({ success: false, error: 'Ticket not found.' });
        }

        const replies = db.prepare(`
            SELECT * FROM ticket_replies
            WHERE ticket_id = ?
            ORDER BY created_at ASC
        `).all(ticketId);

        return res.json({ success: true, ticket, replies });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/support/tickets/:id/replies
 * Add reply to ticket
 */
router.post('/tickets/:id/replies', optionalAuth, (req, res) => {
    try {
        const ticketId = parseInt(req.params.id, 10);
        const { message, sender_name } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, error: 'Reply message cannot be empty.' });
        }

        const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticketId);
        if (!ticket) {
            return res.status(404).json({ success: false, error: 'Ticket not found.' });
        }

        const senderId = req.user ? req.user.id : null;
        const senderName = req.user ? req.user.username : (sender_name || 'User');
        const senderRole = req.user && req.user.role === 'admin' ? 'admin' : (req.user ? 'user' : 'guest');

        db.prepare(`
            INSERT INTO ticket_replies (ticket_id, sender_id, sender_name, sender_role, message)
            VALUES (?, ?, ?, ?, ?)
        `).run(ticketId, senderId, senderName, senderRole, message.trim());

        // Update ticket updated_at
        db.prepare("UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(ticketId);

        const replies = db.prepare('SELECT * FROM ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC').all(ticketId);

        return res.json({ success: true, message: 'Reply sent successfully.', replies });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

