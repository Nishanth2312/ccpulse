const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'ccpulse.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Initialize database instance
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schemaSql);
    seedInitialData();
}

function seedInitialData() {
    // 1. System Settings
    const settingsCount = db.prepare('SELECT COUNT(*) as count FROM system_settings').get().count;
    if (settingsCount === 0) {
        const insertSetting = db.prepare('INSERT INTO system_settings (key, value, description) VALUES (?, ?, ?)');
        insertSetting.run('default_welcome_bonus', '5000.00', 'Default welcome virtual USD credits for new users');
        insertSetting.run('default_currency', 'USD', 'Default display currency for the platform');
        insertSetting.run('default_theme', 'dark', 'Default theme (dark, light, system)');
        insertSetting.run('market_refresh_interval_sec', '10', 'Market data simulation / polling interval in seconds');
        insertSetting.run('exchange_rate_refresh_interval_min', '30', 'Forex exchange rates refresh interval in minutes');
        insertSetting.run('maintenance_mode', 'false', 'Platform maintenance mode flag');
        insertSetting.run('allow_guest_trading', 'true', 'Allow unauthenticated guests to use simulator');
    }

    // 2. User Roles
    const rolesCount = db.prepare('SELECT COUNT(*) as count FROM user_roles').get().count;
    if (rolesCount === 0) {
        const insertRole = db.prepare('INSERT INTO user_roles (role_name, permissions, description) VALUES (?, ?, ?)');
        insertRole.run('admin', JSON.stringify(['all', 'manage_cryptos', 'manage_users', 'manage_wallets', 'manage_settings', 'view_audits']), 'Platform Administrator with full control');
        insertRole.run('user', JSON.stringify(['view_markets', 'trade_sim', 'portfolio', 'learning', 'safety_center']), 'Standard registered trader');
    }

    // 3. Supported Currencies (USD, INR, EUR, GBP, AED, JPY)
    const curCount = db.prepare('SELECT COUNT(*) as count FROM supported_currencies').get().count;
    if (curCount === 0) {
        const insertCurrency = db.prepare(`
            INSERT INTO supported_currencies (code, name, symbol, exchange_rate_to_usd, is_active, is_default, decimal_places)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        insertCurrency.run('USD', 'US Dollar', '$', 1.0, 1, 1, 2);
        insertCurrency.run('INR', 'Indian Rupee', '₹', 85.25, 1, 0, 2);
        insertCurrency.run('EUR', 'Euro', '€', 0.92, 1, 0, 2);
        insertCurrency.run('GBP', 'British Pound', '£', 0.79, 1, 0, 2);
        insertCurrency.run('AED', 'UAE Dirham', 'د.إ', 3.67, 1, 0, 2);
        insertCurrency.run('JPY', 'Japanese Yen', '¥', 153.10, 1, 0, 0);

        // Record exchange rates cache
        const insertRate = db.prepare('INSERT INTO exchange_rates (base_currency, target_currency, rate, provider, is_stale) VALUES (?, ?, ?, ?, ?)');
        insertRate.run('USD', 'USD', 1.0, 'SystemDefault', 0);
        insertRate.run('USD', 'INR', 85.25, 'ForexExchangeLive', 0);
        insertRate.run('USD', 'EUR', 0.92, 'ForexExchangeLive', 0);
        insertRate.run('USD', 'GBP', 0.79, 'ForexExchangeLive', 0);
        insertRate.run('USD', 'AED', 3.67, 'ForexExchangeLive', 0);
        insertRate.run('USD', 'JPY', 153.10, 'ForexExchangeLive', 0);
    }

    // 4. Themes
    const themeCount = db.prepare('SELECT COUNT(*) as count FROM themes').get().count;
    if (themeCount === 0) {
        const insertTheme = db.prepare('INSERT INTO themes (name, code, primary_color, background_color, is_default, is_active) VALUES (?, ?, ?, ?, ?, ?)');
        insertTheme.run('Dark Navy High-Tech', 'dark', '#00F0FF', '#0B0E17', 1, 1);
        insertTheme.run('Clean Light Financial', 'light', '#2563EB', '#F8FAFC', 0, 1);
        insertTheme.run('System Adaptive', 'system', '#3B82F6', '#0B0E17', 0, 1);
    }

    // 5. Initial Cryptocurrencies: BTC, ETH, XMR, BDX, SOL
    const cryptoCount = db.prepare('SELECT COUNT(*) as count FROM cryptocurrencies').get().count;
    if (cryptoCount === 0) {
        const insertCrypto = db.prepare(`
            INSERT INTO cryptocurrencies (
                name, symbol, slug, logo_url, blockchain, api_provider_id, market_data_source,
                educational_content, risk_information, risk_level, is_active, is_visible,
                current_price_usd, change_24h, high_24h, low_24h, volume_24h, market_cap_usd,
                circulating_supply, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertCrypto.run(
            'Bitcoin', 'BTC', 'bitcoin',
            '/assets/coins/btc.svg',
            'Bitcoin Core (SHA-256 Proof of Work)',
            'coingecko', 'CoinGecko / Simulated Real-Time Engine',
            'Bitcoin is the first decentralized digital currency, introduced in 2008 by Satoshi Nakamoto. It uses peer-to-peer technology with an immutable ledger and a hard cap of 21 million coins.',
            'High market dominance, historically lower volatility than altcoins, but subject to macroeconomic cycles, regulatory announcements, and institutional ETF flows.',
            'Medium', 1, 1, 68450.00, 2.45, 69200.00, 67100.00, 28450000000, 1350000000000, 19780000, 1
        );

        insertCrypto.run(
            'Ethereum', 'ETH', 'ethereum',
            '/assets/coins/eth.svg',
            'Ethereum Proof of Stake (Smart Contracts & EVM)',
            'coingecko', 'CoinGecko / Simulated Real-Time Engine',
            'Ethereum is a global, decentralized platform for smart contracts and decentralized applications (dApps). Ether (ETH) pays for computational gas and staking consensus.',
            'Smart contract vulnerability risks, Layer 2 fragmentation, gas fee spikes during high network congestion, and upgrade protocol execution risks.',
            'Medium', 1, 1, 2650.00, -1.15, 2710.00, 2590.00, 15300000000, 318000000000, 120400000, 2
        );

        insertCrypto.run(
            'Monero', 'XMR', 'monero',
            '/assets/coins/xmr.svg',
            'RandomX Proof of Work (Ring Confidential Transactions)',
            'coingecko', 'CoinGecko / Simulated Real-Time Engine',
            'Monero is the leading privacy-focused cryptocurrency. It uses Ring Signatures, Stealth Addresses, and RingCT to ensure sender, receiver, and amount remain completely confidential.',
            'Regulatory scrutiny surrounding privacy coins, delistings on centralized exchanges, higher liquidity spreads, and regulatory restrictions in certain jurisdictions.',
            'High', 1, 1, 155.80, 0.85, 159.20, 153.40, 62000000, 2870000000, 18400000, 3
        );

        insertCrypto.run(
            'Beldex', 'BDX', 'beldex',
            '/assets/coins/bdx.svg',
            'Proof of Stake Private Ecosystem (Masternodes & POS)',
            'coingecko', 'CoinGecko / Simulated Real-Time Engine',
            'Beldex is a privacy-first web3 ecosystem providing untraceable transactions and confidential messaging, private browser (BChat, BelNet), and Masternode validation.',
            'Emerging ecosystem token, lower overall market liquidity, dependence on Masternode network participation, and privacy coin regulatory exposure.',
            'High', 1, 1, 0.0425, 4.30, 0.0440, 0.0398, 3800000, 275000000, 6470000000, 4
        );

        insertCrypto.run(
            'Solana', 'SOL', 'solana',
            '/assets/coins/sol.svg',
            'Proof of History + Proof of Stake Hybrid Engine',
            'coingecko', 'CoinGecko / Simulated Real-Time Engine',
            'Solana is a high-performance blockchain designed for widespread mainstream adoption, boasting sub-second finality, extremely low transaction fees, and high throughput.',
            'Historical network congestion outages, high validator hardware requirements, fast-moving DeFi ecosystem with liquidation cascades.',
            'Medium', 1, 1, 178.50, 5.80, 182.00, 168.40, 4200000000, 84200000000, 471000000, 5
        );
    }

    // 6. Default Admin & Demo User
    const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (usersCount === 0) {
        const salt = bcrypt.genSaltSync(10);
        const adminHash = bcrypt.hashSync('Admin@CCPulse2026!', salt);
        const traderHash = bcrypt.hashSync('Trader@123456', salt);

        // Admin User
        const adminInsert = db.prepare(`
            INSERT INTO users (uuid, email, username, full_name, password_hash, role, is_active, is_suspended, email_verified)
            VALUES (?, ?, ?, ?, ?, ?, 1, 0, 1)
        `).run('adm-00000000-0001', 'admin@ccpulse.com', 'admin', 'CCPulse Chief Administrator', adminHash, 'admin');
        const adminId = adminInsert.lastInsertRowid;

        db.prepare('INSERT INTO user_profiles (user_id, bio, country) VALUES (?, ?, ?)').run(adminId, 'Lead System Administrator for CCPulse Educational Portal', 'US');
        db.prepare('INSERT INTO user_preferences (user_id, preferred_currency, theme) VALUES (?, ?, ?)').run(adminId, 'USD', 'dark');

        // Admin Wallet
        const adminWallet = db.prepare(`
            INSERT INTO virtual_wallets (user_id, currency, balance_usd, invested_usd, total_deposited_usd, welcome_bonus_credited)
            VALUES (?, 'USD', 5000.00, 0.00, 5000.00, 1)
        `).run(adminId);

        db.prepare(`
            INSERT INTO virtual_wallet_transactions (wallet_id, user_id, transaction_ref, type, amount_usd, currency, balance_before_usd, balance_after_usd, description)
            VALUES (?, ?, ?, 'WELCOME_BONUS', 5000.00, 'USD', 0.00, 5000.00, 'CCPulse Welcome Bonus')
        `).run(adminWallet.lastInsertRowid, adminId, 'WB-ADM-' + Date.now());

        // Regular Trader User
        const traderInsert = db.prepare(`
            INSERT INTO users (uuid, email, username, full_name, password_hash, role, is_active, is_suspended, email_verified)
            VALUES (?, ?, ?, ?, ?, ?, 1, 0, 1)
        `).run('usr-00000000-0002', 'trader@ccpulse.com', 'cryptotrader', 'Alex Rivera', traderHash, 'user');
        const traderId = traderInsert.lastInsertRowid;

        db.prepare('INSERT INTO user_profiles (user_id, bio, country) VALUES (?, ?, ?)').run(traderId, 'Enthusiastic crypto student practicing portfolio risk management.', 'US');
        db.prepare('INSERT INTO user_preferences (user_id, preferred_currency, theme) VALUES (?, ?, ?)').run(traderId, 'USD', 'dark');

        // Trader Wallet with $5,000 Welcome Bonus
        const traderWallet = db.prepare(`
            INSERT INTO virtual_wallets (user_id, currency, balance_usd, invested_usd, total_deposited_usd, welcome_bonus_credited)
            VALUES (?, 'USD', 5000.00, 0.00, 5000.00, 1)
        `).run(traderId);

        db.prepare(`
            INSERT INTO virtual_wallet_transactions (wallet_id, user_id, transaction_ref, type, amount_usd, currency, balance_before_usd, balance_after_usd, description)
            VALUES (?, ?, ?, 'WELCOME_BONUS', 5000.00, 'USD', 0.00, 5000.00, 'CCPulse Welcome Bonus')
        `).run(traderWallet.lastInsertRowid, traderId, 'WB-TRD-' + Date.now());

        // Welcome Notification
        db.prepare(`
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (?, 'Welcome to CCPulse!', 'Welcome to CCPulse! Your $5,000 virtual trading balance is ready. Start learning, explore the markets, and practice trading without risking real money.', 'WELCOME_BONUS')
        `).run(traderId);
    }

    // 7. Learning Academy Courses
    const courseCount = db.prepare('SELECT COUNT(*) as count FROM learning_courses').get().count;
    if (courseCount === 0) {
        const insertCourse = db.prepare(`
            INSERT INTO learning_courses (slug, title, category, difficulty, duration_minutes, modules_count, summary, content_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertCourse.run(
            'crypto-fundamentals',
            'Cryptocurrency Fundamentals & Blockchain Architecture',
            'Basics', 'Beginner', 45, 4,
            'Master the core mechanics of distributed ledgers, cryptographic hashing, consensus mechanisms, and how Bitcoin initiated the decentralized financial revolution.',
            JSON.stringify([
                { id: 1, title: 'What is a Distributed Ledger?', readTime: '10 min', completed: false },
                { id: 2, title: 'Proof-of-Work vs Proof-of-Stake', readTime: '12 min', completed: false },
                { id: 3, title: 'Public & Private Keys, Digital Signatures', readTime: '11 min', completed: false },
                { id: 4, title: 'Transaction Blocks and Merkle Trees', readTime: '12 min', completed: false }
            ])
        );

        insertCourse.run(
            'privacy-coins-deep-dive',
            'Privacy Cryptocurrencies: Monero & Beldex Explained',
            'Privacy & Security', 'Intermediate', 60, 5,
            'Explore the mathematics and protocol design of privacy coins, focusing on Monero (RingCT, Stealth Addresses) and Beldex (Masternode POS privacy ecosystem).',
            JSON.stringify([
                { id: 1, title: 'Transparent vs Confidential Ledgers', readTime: '10 min', completed: false },
                { id: 2, title: 'Monero Ring Signatures and RingCT', readTime: '15 min', completed: false },
                { id: 3, title: 'Beldex Masternode & Private Web3 Network', readTime: '12 min', completed: false },
                { id: 4, title: 'Regulatory Landscape & Privacy Rights', readTime: '13 min', completed: false },
                { id: 5, title: 'Anonymity Set Analysis & Best Practices', readTime: '10 min', completed: false }
            ])
        );

        insertCourse.run(
            'risk-management-simulation',
            'Virtual Portfolio Risk Management & Position Sizing',
            'Trading & Simulation', 'Advanced', 50, 4,
            'Learn how professional asset managers allocate risk, calculate Value at Risk (VaR), manage drawdown volatility, and protect capital in simulated market conditions.',
            JSON.stringify([
                { id: 1, title: 'The 1% Risk Rule and Position Sizing', readTime: '12 min', completed: false },
                { id: 2, title: 'Calculating Drawdown and Sharpe Ratio', readTime: '14 min', completed: false },
                { id: 3, title: 'Stop-Loss Simulation and Slippage Impact', readTime: '12 min', completed: false },
                { id: 4, title: 'Market Sentiment and Macro Volatility', readTime: '12 min', completed: false }
            ])
        );
    }
}

// Call initialization
initDb();

module.exports = db;

