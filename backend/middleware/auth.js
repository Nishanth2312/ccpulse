const jwt = require('jsonwebtoken');
const db = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'ccpulse_super_secure_jwt_secret_key_2026';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        req.isGuest = true;
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            req.user = null;
            req.isGuest = true;
            return next();
        }

        const user = db.prepare('SELECT id, uuid, email, username, full_name, role, is_active, is_suspended FROM users WHERE id = ?').get(decoded.id);
        if (!user || !user.is_active || user.is_suspended) {
            req.user = null;
            req.isGuest = true;
            return next();
        }

        req.user = user;
        req.isGuest = false;
        next();
    });
}

function requireAuth(req, res, next) {
    if (!req.user || req.isGuest) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required. Please sign in or register to access this feature.'
        });
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.user || req.isGuest) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required.'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Access denied: Administrative privileges required.'
        });
    }

    next();
}

module.exports = {
    JWT_SECRET,
    authenticateToken,
    optionalAuth: authenticateToken,
    requireAuth,
    requireAdmin
};

