const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { JWT_SECRET, authenticateToken, requireAuth } = require('../middleware/auth');
const { creditWelcomeBonus, getUserWallet } = require('../services/walletService');

/**
 * POST /api/auth/register
 * Register a new authenticated user and automatically credit mandatory $5,000 USD welcome bonus
 */
router.post('/register', (req, res) => {
    try {
        const { full_name, username, email, password, confirm_password, terms_accepted } = req.body;

        if (!full_name || !username || !email || !password) {
            return res.status(400).json({ success: false, error: 'Full name, username, email, and password are required.' });
        }

        if (password !== confirm_password) {
            return res.status(400).json({ success: false, error: 'Passwords do not match.' });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
        }

        if (terms_accepted === false) {
            return res.status(400).json({ success: false, error: 'You must accept the terms and conditions to register.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanUsername = username.trim().toLowerCase();

        // Check if email or username already exists
        const existing = db.prepare('SELECT id, email, username FROM users WHERE email = ? OR username = ?').get(cleanEmail, cleanUsername);
        if (existing) {
            if (existing.email === cleanEmail) {
                return res.status(409).json({ success: false, error: 'An account with this email address already exists.' });
            }
            return res.status(409).json({ success: false, error: 'This username is already taken. Please choose another.' });
        }

        const salt = bcrypt.genSaltSync(10);
        const password_hash = bcrypt.hashSync(password, salt);
        const userUuid = 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);

        // Atomic registration transaction
        const registrationResult = db.transaction(() => {
            // 1. Insert User
            const insertUser = db.prepare(`
                INSERT INTO users (uuid, email, username, full_name, password_hash, role, is_active, is_suspended, email_verified, last_login_at)
                VALUES (?, ?, ?, ?, ?, 'user', 1, 0, 1, CURRENT_TIMESTAMP)
            `);
            const userRes = insertUser.run(userUuid, cleanEmail, cleanUsername, full_name.trim(), password_hash);
            const userId = userRes.lastInsertRowid;

            // 2. Insert User Profile
            db.prepare('INSERT INTO user_profiles (user_id, bio, country) VALUES (?, ?, ?)').run(
                userId, 'Crypto learner on CCPulse', 'US'
            );

            // 3. Insert User Preferences (dark mode default)
            db.prepare('INSERT INTO user_preferences (user_id, preferred_currency, theme) VALUES (?, ?, ?)').run(
                userId, 'USD', 'dark'
            );

            // 4. Automatically credit mandatory $5,000 Welcome Bonus (ATOMIC, exactly once)
            const bonusResult = creditWelcomeBonus(userId);

            return { userId, bonusResult };
        })();

        const userId = registrationResult.userId;
        const user = db.prepare('SELECT id, uuid, email, username, full_name, role, created_at FROM users WHERE id = ?').get(userId);
        const wallet = getUserWallet(userId);

        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            success: true,
            isNewRegistration: true,
            welcomeBonusCredited: true,
            welcomeBonusAmount: 5000.00,
            welcomeNotification: 'Welcome to CCPulse! Your $5,000 virtual trading balance is ready. Start learning, explore the markets, and practice trading without risking real money.',
            token,
            user,
            wallet
        });

    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error during registration: ' + err.message });
    }
});

/**
 * POST /api/auth/login
 * Authenticate existing user. Retains existing balance without bonus duplication!
 */
router.post('/login', (req, res) => {
    try {
        const { email, password, remember_me } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const user = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(cleanEmail, cleanEmail);

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid email/username or password.' });
        }

        if (!user.is_active || user.is_suspended) {
            return res.status(403).json({ success: false, error: 'Account is deactivated or suspended. Please contact platform administration.' });
        }

        const isValid = bcrypt.compareSync(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Invalid email/username or password.' });
        }

        // Update last login
        db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

        // Fetch existing wallet and preferences (retaining existing wallet balance!)
        const wallet = getUserWallet(user.id);
        const preferences = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(user.id) || { preferred_currency: 'USD', theme: 'dark' };

        const expiresIn = remember_me ? '30d' : '7d';
        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn }
        );

        return res.json({
            success: true,
            token,
            user: {
                id: user.id,
                uuid: user.uuid,
                email: user.email,
                username: user.username,
                full_name: user.full_name,
                role: user.role,
                created_at: user.created_at,
                last_login_at: user.last_login_at
            },
            preferences,
            wallet
        });

    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, error: 'Server error during login: ' + err.message });
    }
});

/**
 * GET /api/auth/me
 * Get current user profile, preferences, wallet, notifications
 */
router.get('/me', authenticateToken, (req, res) => {
    if (req.isGuest || !req.user) {
        return res.json({
            success: true,
            isGuest: true,
            user: null,
            preferences: { preferred_currency: 'USD', theme: 'system' }
        });
    }

    const user = db.prepare('SELECT id, uuid, email, username, full_name, role, created_at, last_login_at FROM users WHERE id = ?').get(req.user.id);
    const profile = db.prepare('SELECT bio, country, avatar_url FROM user_profiles WHERE user_id = ?').get(req.user.id);
    const preferences = db.prepare('SELECT preferred_currency, theme, notifications_enabled FROM user_preferences WHERE user_id = ?').get(req.user.id) || { preferred_currency: 'USD', theme: 'dark' };
    const wallet = getUserWallet(req.user.id);
    const unreadNotifications = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).count;

    return res.json({
        success: true,
        isGuest: false,
        user,
        profile,
        preferences,
        wallet,
        unreadNotifications
    });
});

/**
 * POST /api/auth/guest
 * Initialize a temporary anonymous guest session
 */
router.post('/guest', (req, res) => {
    const guestToken = 'guest-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10);
    return res.json({
        success: true,
        isGuest: true,
        guestToken,
        message: 'Guest session created. Data is temporary and stored in local session.',
        temporaryBalanceUsd: 5000.00
    });
});

/**
 * POST /api/auth/preferences
 * Update user preferences (theme, preferred currency)
 */
router.post('/preferences', authenticateToken, (req, res) => {
    if (req.isGuest || !req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required to persist preferences.' });
    }

    const { preferred_currency, theme } = req.body;
    const updates = [];
    const params = [];

    if (preferred_currency) {
        updates.push('preferred_currency = ?');
        params.push(preferred_currency.toUpperCase());
    }
    if (theme && ['dark', 'light', 'system'].includes(theme)) {
        updates.push('theme = ?');
        params.push(theme);
    }

    if (updates.length > 0) {
        params.push(req.user.id);
        db.prepare(`UPDATE user_preferences SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`).run(...params);
    }

    const prefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(req.user.id);
    return res.json({ success: true, preferences: prefs });
});

/**
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, error: 'Email address is required.' });
    }

    const user = db.prepare('SELECT id, email, username FROM users WHERE email = ?').get(email.trim().toLowerCase());
    // Security best practice: do not reveal whether user exists
    return res.json({
        success: true,
        message: 'If an account exists with this email address, password reset instructions have been generated.',
        demoResetToken: user ? `RESET-${user.id}-${Date.now()}` : null
    });
});

/**
 * POST /api/auth/reset-password
 */
router.post('/reset-password', (req, res) => {
    const { reset_token, new_password, confirm_password } = req.body;
    if (!reset_token || !new_password) {
        return res.status(400).json({ success: false, error: 'Reset token and new password are required.' });
    }
    if (new_password !== confirm_password) {
        return res.status(400).json({ success: false, error: 'Passwords do not match.' });
    }
    if (new_password.length < 8) {
        return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
    }

    const parts = reset_token.split('-');
    if (parts.length < 3 || parts[0] !== 'RESET') {
        return res.status(400).json({ success: false, error: 'Invalid or expired password reset token.' });
    }

    const userId = parseInt(parts[1], 10);
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(new_password, salt);

    const update = db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, userId);
    if (update.changes === 0) {
        return res.status(404).json({ success: false, error: 'User not found.' });
    }

    return res.json({ success: true, message: 'Password has been securely reset. You can now log in.' });
});

module.exports = router;

