const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const db = require('./database/db');
const { authenticateToken } = require('./middleware/auth');

// Routers
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cryptoRoutes = require('./routes/cryptoRoutes');
const simulatorRoutes = require('./routes/simulatorRoutes');
const currencyRoutes = require('./routes/currencyRoutes');
const learningRoutes = require('./routes/learningRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const simulationLabRoutes = require('./routes/simulationLabRoutes');
const supportRoutes = require('./routes/supportRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global authentication injection
app.use(authenticateToken);

// Maintenance mode check middleware
app.use((req, res, next) => {
    // Exclude admin routes, auth login, and static assets from maintenance mode
    if (req.path.startsWith('/api/admin') || req.path === '/api/auth/login' || !req.path.startsWith('/api')) {
        return next();
    }

    try {
        const row = db.prepare("SELECT value FROM system_settings WHERE key = 'maintenance_mode'").get();
        if (row && row.value === 'true' && (!req.user || req.user.role !== 'admin')) {
            return res.status(503).json({
                success: false,
                error: 'CCPulse is currently undergoing scheduled platform maintenance. Please check back shortly.'
            });
        }
    } catch (e) {}

    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cryptos', cryptoRoutes);
app.use('/api/simulator', simulatorRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/simulation-lab', simulationLabRoutes);
app.use('/api/support', supportRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: 'production-ready',
        welcomeBonusUsd: 5000.00
    });
});

// Serve Frontend static files
const FRONTEND_DIR = path.join(__dirname, '../frontend');
app.use(express.static(FRONTEND_DIR));

// Fallback to index.html for Single Page Application navigation
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.resolve(FRONTEND_DIR, 'index.html'), (err) => {
            if (err && !res.headersSent) {
                res.status(404).end();
            }
        });
    }
    next();
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({
        success: false,
        error: 'An unexpected internal server error occurred: ' + err.message
    });
});

if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`====================================================`);
        console.log(`  CCPulse Platform Server running on port ${PORT}`);
        console.log(`  Local: http://localhost:${PORT}`);
        console.log(`  API Health: http://localhost:${PORT}/api/health`);
        console.log(`====================================================`);
    });
}

module.exports = app;
