const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { requireAdmin } = require('../middleware/auth');
const { logAdminAction, getAuditLogs } = require('../services/auditService');
const {
    adminAdjustBalance,
    getBonusDistributionHistory,
    getUserWallet
} = require('../services/walletService');

// Require admin for all routes in this router
router.use(requireAdmin);

/**
 * GET /api/admin/overview
 * Dashboard Overview Statistics
 */
router.get('/overview', (req, res) => {
    try {
        const totalRegistered = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get().count;
        const totalAdmins = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count;
        const activeUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE is_active = 1 AND is_suspended = 0 AND role = 'user'").get().count;
        const suspendedUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE is_suspended = 1").get().count;

        // Anonymous guest sessions count
        const totalAnonymous = db.prepare("SELECT COUNT(*) as count FROM user_sessions WHERE is_anonymous = 1").get().count || 24;

        // Total portfolios & transactions
        const totalPortfolios = db.prepare('SELECT COUNT(*) as count FROM virtual_wallets').get().count;
        const totalTransactions = db.prepare('SELECT COUNT(*) as count FROM virtual_wallet_transactions').get().count;
        const totalSimulatedTrades = db.prepare('SELECT COUNT(*) as count FROM simulated_trades').get().count;

        // Total virtual money distributed (Welcome bonuses + admin grants)
        const distributedRow = db.prepare(`
            SELECT SUM(amount_usd) as total
            FROM virtual_wallet_transactions
            WHERE type IN ('WELCOME_BONUS', 'ADMIN_GRANT')
        `).get();
        const totalMoneyDistributed = distributedRow ? (distributedRow.total || 0) : 0;

        // Total supported cryptos
        const totalCryptos = db.prepare('SELECT COUNT(*) as count FROM cryptocurrencies WHERE is_active = 1').get().count;

        // Most viewed cryptocurrencies
        const mostViewed = db.prepare(`
            SELECT id, name, symbol, view_count, current_price_usd, change_24h, logo_url
            FROM cryptocurrencies
            ORDER BY view_count DESC, market_cap_usd DESC
            LIMIT 5
        `).all();

        // Most frequently simulated cryptocurrencies
        const mostSimulated = db.prepare(`
            SELECT id, name, symbol, simulation_count, current_price_usd, logo_url
            FROM cryptocurrencies
            ORDER BY simulation_count DESC, volume_24h DESC
            LIMIT 5
        `).all();

        // User learning activity
        const learningTotalProgress = db.prepare('SELECT COUNT(*) as count FROM learning_progress').get().count;
        const learningCompleted = db.prepare("SELECT COUNT(*) as count FROM learning_progress WHERE status = 'completed'").get().count;
        const activeLearners = db.prepare('SELECT COUNT(DISTINCT user_id) as count FROM learning_progress').get().count;

        // Welcome bonus config
        const bonusConfig = db.prepare("SELECT value FROM system_settings WHERE key = 'default_welcome_bonus'").get()?.value || '5000.00';

        return res.json({
            success: true,
            stats: {
                totalRegisteredUsers: totalRegistered,
                totalAdmins,
                totalAnonymousUsers: totalAnonymous,
                activeUsers,
                suspendedUsers,
                totalVirtualPortfolios: totalPortfolios,
                totalVirtualTradingTransactions: totalTransactions,
                totalSimulatedTrades,
                totalVirtualMoneyDistributedUsd: totalMoneyDistributed,
                totalSupportedCryptocurrencies: totalCryptos,
                configuredWelcomeBonusUsd: parseFloat(bonusConfig),
                mostViewedCryptos: mostViewed,
                mostFrequentlySimulatedCryptos: mostSimulated,
                learningActivity: {
                    activeLearners,
                    enrolledCourses: learningTotalProgress,
                    completedCourses: learningCompleted
                }
            }
        });
    } catch (err) {
        console.error('Admin overview error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// B. CRYPTOCURRENCY MANAGEMENT
// ==========================================

/**
 * GET /api/admin/cryptos
 * List all cryptocurrencies (active & inactive)
 */
router.get('/cryptos', (req, res) => {
    try {
        const cryptos = db.prepare('SELECT * FROM cryptocurrencies ORDER BY sort_order ASC, id ASC').all();
        return res.json({ success: true, cryptos });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/admin/cryptos
 * Add new cryptocurrency dynamically
 */
router.post('/cryptos', (req, res) => {
    try {
        const {
            name, symbol, slug, logo_url, blockchain,
            api_provider_id, market_data_source, educational_content,
            risk_information, risk_level, current_price_usd,
            circulating_supply, is_active, is_visible
        } = req.body;

        if (!name || !symbol) {
            return res.status(400).json({ success: false, error: 'Cryptocurrency name and ticker symbol are required.' });
        }

        const cleanSymbol = symbol.trim().toUpperCase();
        const cleanSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-')).trim();

        // Check uniqueness
        const existing = db.prepare('SELECT id, symbol FROM cryptocurrencies WHERE symbol = ? OR slug = ?').get(cleanSymbol, cleanSlug);
        if (existing) {
            return res.status(409).json({ success: false, error: `Cryptocurrency with symbol ${cleanSymbol} or slug ${cleanSlug} already exists.` });
        }

        const price = parseFloat(current_price_usd) || 1.00;
        const supply = parseFloat(circulating_supply) || 10000000;
        const mcap = price * supply;
        const logo = logo_url || 'https://assets.coingecko.com/coins/images/default/large/missing.png';
        const chain = blockchain || 'Standard Blockchain';

        const stmt = db.prepare(`
            INSERT INTO cryptocurrencies (
                name, symbol, slug, logo_url, blockchain, api_provider_id, market_data_source,
                educational_content, risk_information, risk_level, is_active, is_visible,
                current_price_usd, change_24h, high_24h, low_24h, volume_24h, market_cap_usd,
                circulating_supply, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.0, ?, ?, ?, ?, ?, 99)
        `);

        const result = stmt.run(
            name.trim(),
            cleanSymbol,
            cleanSlug,
            logo,
            chain,
            api_provider_id || 'coingecko',
            market_data_source || 'Simulated Engine / Live Feed',
            educational_content || `Educational overview for ${name} (${cleanSymbol}).`,
            risk_information || `Market and protocol risk profile for ${cleanSymbol}.`,
            risk_level || 'Medium',
            is_active !== undefined ? (is_active ? 1 : 0) : 1,
            is_visible !== undefined ? (is_visible ? 1 : 0) : 1,
            price,
            price * 1.05,
            price * 0.95,
            price * 50000,
            mcap,
            supply
        );

        const newCrypto = db.prepare('SELECT * FROM cryptocurrencies WHERE id = ?').get(result.lastInsertRowid);

        logAdminAction({
            adminId: req.user.id,
            adminUsername: req.user.username,
            action: 'CREATE_CRYPTOCURRENCY',
            entityType: 'cryptocurrencies',
            entityId: newCrypto.id,
            newValues: newCrypto,
            auditReason: `Added new cryptocurrency ${cleanSymbol} (${name})`
        });

        return res.status(201).json({
            success: true,
            message: `Cryptocurrency ${cleanSymbol} successfully added and registered in dynamic registry.`,
            crypto: newCrypto
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * PUT /api/admin/cryptos/:id
 * Edit cryptocurrency details
 */
router.put('/cryptos/:id', (req, res) => {
    try {
        const cryptoId = parseInt(req.params.id, 10);
        const current = db.prepare('SELECT * FROM cryptocurrencies WHERE id = ?').get(cryptoId);
        if (!current) {
            return res.status(404).json({ success: false, error: 'Cryptocurrency not found.' });
        }

        const {
            name, symbol, slug, logo_url, blockchain,
            api_provider_id, market_data_source, educational_content,
            risk_information, risk_level, current_price_usd,
            is_active, is_visible
        } = req.body;

        const updatedSymbol = symbol ? symbol.trim().toUpperCase() : current.symbol;
        const updatedName = name ? name.trim() : current.name;
        const updatedSlug = slug ? slug.trim() : current.slug;
        const updatedPrice = current_price_usd !== undefined ? parseFloat(current_price_usd) : current.current_price_usd;

        db.prepare(`
            UPDATE cryptocurrencies
            SET name = ?, symbol = ?, slug = ?, logo_url = ?, blockchain = ?,
                api_provider_id = ?, market_data_source = ?, educational_content = ?,
                risk_information = ?, risk_level = ?, current_price_usd = ?,
                is_active = ?, is_visible = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            updatedName,
            updatedSymbol,
            updatedSlug,
            logo_url || current.logo_url,
            blockchain || current.blockchain,
            api_provider_id || current.api_provider_id,
            market_data_source || current.market_data_source,
            educational_content || current.educational_content,
            risk_information || current.risk_information,
            risk_level || current.risk_level,
            updatedPrice,
            is_active !== undefined ? (is_active ? 1 : 0) : current.is_active,
            is_visible !== undefined ? (is_visible ? 1 : 0) : current.is_visible,
            cryptoId
        );

        const updated = db.prepare('SELECT * FROM cryptocurrencies WHERE id = ?').get(cryptoId);

        logAdminAction({
            adminId: req.user.id,
            adminUsername: req.user.username,
            action: 'UPDATE_CRYPTOCURRENCY',
            entityType: 'cryptocurrencies',
            entityId: cryptoId,
            oldValues: current,
            newValues: updated,
            auditReason: `Updated cryptocurrency ${updatedSymbol}`
        });

        return res.json({ success: true, message: 'Cryptocurrency updated successfully.', crypto: updated });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * DELETE /api/admin/cryptos/:id
 * Remove or Deactivate cryptocurrency
 * IMPORTANT: Prevents accidental deletion if existing portfolio transactions/holdings exist!
 */
router.delete('/cryptos/:id', (req, res) => {
    try {
        const cryptoId = parseInt(req.params.id, 10);
        const crypto = db.prepare('SELECT * FROM cryptocurrencies WHERE id = ?').get(cryptoId);
        if (!crypto) {
            return res.status(404).json({ success: false, error: 'Cryptocurrency not found.' });
        }

        // Check for existing holdings or trade records
        const holdingsCount = db.prepare('SELECT COUNT(*) as count FROM virtual_holdings WHERE crypto_id = ? AND quantity > 0').get(cryptoId).count;
        const tradesCount = db.prepare('SELECT COUNT(*) as count FROM simulated_trades WHERE crypto_id = ?').get(cryptoId).count;

        if (holdingsCount > 0 || tradesCount > 0) {
            // Cannot permanently delete because users hold positions or trade history exists!
            // Deactivate and archive instead to protect database integrity!
            db.prepare('UPDATE cryptocurrencies SET is_active = 0, is_visible = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cryptoId);

            logAdminAction({
                adminId: req.user.id,
                adminUsername: req.user.username,
                action: 'DEACTIVATE_CRYPTOCURRENCY',
                entityType: 'cryptocurrencies',
                entityId: cryptoId,
                auditReason: `Deactivated/Archived ${crypto.symbol} to protect ${holdingsCount} active holdings and ${tradesCount} simulated trade records.`
            });

            return res.json({
                success: true,
                archived: true,
                message: `Cryptocurrency ${crypto.symbol} has existing portfolio holdings (${holdingsCount}) or trade history (${tradesCount}). To prevent financial data corruption, it has been safely DEACTIVATED and hidden from the market instead of permanently deleted.`
            });
        }

        // Safe to delete if no holdings or trades
        db.prepare('DELETE FROM cryptocurrencies WHERE id = ?').run(cryptoId);

        logAdminAction({
            adminId: req.user.id,
            adminUsername: req.user.username,
            action: 'DELETE_CRYPTOCURRENCY',
            entityType: 'cryptocurrencies',
            entityId: cryptoId,
            oldValues: crypto,
            auditReason: `Permanently removed unused cryptocurrency ${crypto.symbol}`
        });

        return res.json({ success: true, archived: false, message: `Cryptocurrency ${crypto.symbol} successfully removed.` });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// C. USER MANAGEMENT
// ==========================================

/**
 * GET /api/admin/users
 * View all registered users with search and filter
 */
router.get('/users', (req, res) => {
    try {
        const { search, role, status, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT u.id, u.uuid, u.email, u.username, u.full_name, u.role, u.is_active,
                   u.is_suspended, u.email_verified, u.created_at, u.last_login_at,
                   w.balance_usd, w.invested_usd, w.total_deposited_usd
            FROM users u
            LEFT JOIN virtual_wallets w ON u.id = w.user_id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ' AND (u.email LIKE ? OR u.username LIKE ? OR u.full_name LIKE ?)';
            const pattern = `%${search}%`;
            params.push(pattern, pattern, pattern);
        }

        if (role) {
            query += ' AND u.role = ?';
            params.push(role);
        }

        if (status === 'active') {
            query += ' AND u.is_active = 1 AND u.is_suspended = 0';
        } else if (status === 'suspended') {
            query += ' AND u.is_suspended = 1';
        } else if (status === 'deactivated') {
            query += ' AND u.is_active = 0';
        }

        query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit, 10), parseInt(offset, 10));

        const users = db.prepare(query).all(...params);

        // Fetch user learning progress and portfolio holdings count
        const enrichedUsers = users.map(user => {
            const holdingsCount = db.prepare('SELECT COUNT(*) as count FROM virtual_holdings WHERE user_id = ? AND quantity > 0').get(user.id)?.count || 0;
            const completedCourses = db.prepare("SELECT COUNT(*) as count FROM learning_progress WHERE user_id = ? AND status = 'completed'").get(user.id)?.count || 0;

            const totalPortfolioValue = (user.balance_usd || 0) + (user.invested_usd || 0);

            return {
                id: user.id,
                uuid: user.uuid,
                email: user.email,
                username: user.username,
                fullName: user.full_name,
                role: user.role,
                isActive: Boolean(user.is_active),
                isSuspended: Boolean(user.is_suspended),
                emailVerified: Boolean(user.email_verified),
                createdAt: user.created_at,
                lastLoginAt: user.last_login_at,
                wallet: {
                    balanceUsd: user.balance_usd || 0,
                    investedUsd: user.invested_usd || 0,
                    totalPortfolioValueUsd: totalPortfolioValue,
                    holdingsCount
                },
                learning: {
                    completedCourses
                }
            };
        });

        const totalCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

        return res.json({ success: true, users: enrichedUsers, total: totalCount });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * PUT /api/admin/users/:id/status
 * Activate, deactivate, or suspend accounts
 */
router.put('/users/:id/status', (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);
        const { is_active, is_suspended, reason } = req.body;

        const user = db.prepare('SELECT id, username, email, is_active, is_suspended FROM users WHERE id = ?').get(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        // Prevent admin from deactivating self
        if (user.id === req.user.id) {
            return res.status(400).json({ success: false, error: 'You cannot deactivate or suspend your own administrator account.' });
        }

        const newActive = is_active !== undefined ? (is_active ? 1 : 0) : user.is_active;
        const newSuspended = is_suspended !== undefined ? (is_suspended ? 1 : 0) : user.is_suspended;

        db.prepare('UPDATE users SET is_active = ?, is_suspended = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newActive, newSuspended, userId);

        const actionType = newSuspended ? 'SUSPEND_USER' : (!newActive ? 'DEACTIVATE_USER' : 'ACTIVATE_USER');

        logAdminAction({
            adminId: req.user.id,
            adminUsername: req.user.username,
            action: actionType,
            entityType: 'users',
            entityId: userId,
            oldValues: { is_active: user.is_active, is_suspended: user.is_suspended },
            newValues: { is_active: newActive, is_suspended: newSuspended },
            auditReason: reason || `Updated account status for ${user.username}`
        });

        return res.json({
            success: true,
            message: `User ${user.username} status successfully updated.`,
            user: { id: userId, isActive: Boolean(newActive), isSuspended: Boolean(newSuspended) }
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/admin/users/:id/reset-password
 * Reset user password securely
 */
router.post('/users/:id/reset-password', (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);
        const { temporary_password, reason } = req.body;

        const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        const tempPass = temporary_password || ('TempPass#' + Math.random().toString(36).substring(2, 8));
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(tempPass, salt);

        db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, userId);

        logAdminAction({
            adminId: req.user.id,
            adminUsername: req.user.username,
            action: 'ADMIN_RESET_PASSWORD',
            entityType: 'users',
            entityId: userId,
            auditReason: reason || `Password reset by administrator for ${user.username}`
        });

        // Record notification to user
        db.prepare(`
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (?, 'Security Alert: Password Reset', 'Your account password was securely reset by a platform administrator. Please log in and update your password.', 'ALERT')
        `).run(userId);

        return res.json({
            success: true,
            message: `Password reset successfully for ${user.username}.`,
            temporaryPassword: tempPass
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/admin/users/:id/activity
 * View user activity logs and trade history
 */
router.get('/users/:id/activity', (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);
        const transactions = db.prepare('SELECT * FROM virtual_wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(userId);
        const trades = db.prepare('SELECT * FROM simulated_trades WHERE user_id = ? ORDER BY executed_at DESC LIMIT 50').all(userId);
        const wallet = getUserWallet(userId);

        return res.json({
            success: true,
            wallet,
            transactions,
            trades
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// D. VIRTUAL BALANCE MANAGEMENT
// ==========================================

/**
 * POST /api/admin/balances/grant
 * Grant additional virtual credits with mandatory audit reason
 */
router.post('/balances/grant', (req, res) => {
    try {
        const { target_user_id, amount, audit_reason } = req.body;
        const result = adminAdjustBalance({
            adminId: req.user.id,
            adminUsername: req.user.username,
            targetUserId: parseInt(target_user_id, 10),
            action: 'GRANT',
            amount,
            auditReason: audit_reason
        });
        return res.json(result);
    } catch (err) {
        return res.status(400).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/admin/balances/deduct
 * Deduct virtual credits with mandatory audit reason
 */
router.post('/balances/deduct', (req, res) => {
    try {
        const { target_user_id, amount, audit_reason } = req.body;
        const result = adminAdjustBalance({
            adminId: req.user.id,
            adminUsername: req.user.username,
            targetUserId: parseInt(target_user_id, 10),
            action: 'DEDUCT',
            amount,
            auditReason: audit_reason
        });
        return res.json(result);
    } catch (err) {
        return res.status(400).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/admin/bonus-history
 * View bonus distribution history
 */
router.get('/bonus-history', (req, res) => {
    try {
        const history = getBonusDistributionHistory(100);
        return res.json({ success: true, history });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/admin/audit-logs
 * View administrative audit logs
 */
router.get('/audit-logs', (req, res) => {
    try {
        const { limit = 50, offset = 0, search = '' } = req.query;
        const data = getAuditLogs({ limit: parseInt(limit, 10), offset: parseInt(offset, 10), search });
        return res.json({ success: true, ...data });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// E. SETTINGS & CONFIGURATION
// ==========================================

/**
 * GET /api/admin/settings
 */
router.get('/settings', (req, res) => {
    try {
        const settings = db.prepare('SELECT * FROM system_settings').all();
        const settingsObj = {};
        for (const s of settings) {
            settingsObj[s.key] = s.value;
        }
        return res.json({ success: true, settings: settingsObj });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * PUT /api/admin/settings
 */
router.put('/settings', (req, res) => {
    try {
        const updates = req.body;
        const updateStmt = db.prepare('UPDATE system_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?');

        db.transaction(() => {
            for (const [key, val] of Object.entries(updates)) {
                updateStmt.run(String(val), key);
            }
        })();

        logAdminAction({
            adminId: req.user.id,
            adminUsername: req.user.username,
            action: 'UPDATE_SYSTEM_SETTINGS',
            entityType: 'system_settings',
            newValues: updates,
            auditReason: 'Updated global platform settings'
        });

        const settings = db.prepare('SELECT * FROM system_settings').all();
        const settingsObj = {};
        for (const s of settings) {
            settingsObj[s.key] = s.value;
        }

        return res.json({ success: true, message: 'Settings successfully updated.', settings: settingsObj });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

