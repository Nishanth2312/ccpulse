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
        insertSetting.run('default_welcome_bonus', '10000.00', 'Default welcome virtual USD credits for new users');
        insertSetting.run('default_currency', 'USD', 'Default display currency for the platform');
        insertSetting.run('default_theme', 'dark', 'Default theme (dark, light, system)');
        insertSetting.run('market_refresh_interval_sec', '10', 'Market data simulation / polling interval in seconds');
        insertSetting.run('exchange_rate_refresh_interval_min', '30', 'Forex exchange rates refresh interval in minutes');
        insertSetting.run('maintenance_mode', 'false', 'Platform maintenance mode flag');
        insertSetting.run('allow_guest_trading', 'true', 'Allow unauthenticated guests to use simulator');
    } else {
        // Ensure default_welcome_bonus is set to 10000.00
        try {
            db.prepare("UPDATE system_settings SET value = '10000.00' WHERE key = 'default_welcome_bonus'").run();
        } catch (e) {}
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
        insertTheme.run('Midnight Navy Gold Showcase', 'dark', '#FFB703', '#0E1438', 1, 1);
        insertTheme.run('Clean Light Financial Blue', 'light', '#3A86FF', '#F8FAFC', 0, 1);
        insertTheme.run('System Adaptive', 'system', '#3A86FF', '#0E1438', 0, 1);
    }

    // 5. Initial Cryptocurrencies: 20 Top Market Coins
    const insertCrypto = db.prepare(`
        INSERT INTO cryptocurrencies (
            name, symbol, slug, logo_url, blockchain, api_provider_id, market_data_source,
            educational_content, risk_information, risk_level, is_active, is_visible,
            current_price_usd, change_24h, high_24h, low_24h, volume_24h, market_cap_usd,
            circulating_supply, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const ALL_COINS_DATA = [
        ['Bitcoin', 'BTC', 'bitcoin', '/assets/coins/btc.svg', 'Bitcoin Core (SHA-256 Proof of Work)', 'coingecko', 'CoinGecko / API Ninjas', 'Bitcoin is the pioneer decentralized digital cryptocurrency introduced in 2008 by Satoshi Nakamoto with a strict 21M hard cap.', 'Macroeconomic cycles, ETF capital flows, market dominance shifts.', 'Medium', 1, 1, 73932.53, 2.15, 74800, 72600, 34120000000, 1460000000000, 19780000, 1],
        ['Ethereum', 'ETH', 'ethereum', '/assets/coins/eth.svg', 'Ethereum Proof of Stake (Smart Contracts & EVM)', 'coingecko', 'CoinGecko / API Ninjas', 'Ethereum powers programmable smart contracts and decentralized finance (DeFi) applications across the globe.', 'Gas fee fluctuations, smart contract vulnerabilities, layer-2 execution risks.', 'Medium', 1, 1, 2056.93, 1.45, 2110, 2020, 14850000000, 247000000000, 120400000, 2],
        ['Tether', 'USDT', 'tether', '/assets/coins/usdt.svg', 'Multi-Chain Fiat Collateralized Stablecoin', 'coingecko', 'CoinGecko / API Ninjas', 'USDT is a collateralized stablecoin pegged 1:1 to the US Dollar, facilitating liquidity and trading.', 'Centralized issuer counterparty and reserve backing risk.', 'Low', 1, 1, 1.00, 0.02, 1.002, 0.998, 52100000000, 120000000000, 120000000000, 3],
        ['BNB', 'BNB', 'binancecoin', '/assets/coins/bnb.svg', 'BNB Smart Chain (Proof of Staked Authority)', 'coingecko', 'CoinGecko / API Ninjas', 'BNB fuels the BNB Chain ecosystem and offers gas discounts and DeFi utility.', 'Ecosystem centralization and regulatory scrutiny.', 'Medium', 1, 1, 585.40, 0.85, 595, 575, 1150000000, 85400000000, 145000000, 4],
        ['Solana', 'SOL', 'solana', '/assets/coins/sol.svg', 'Proof of History + Proof of Stake Hybrid Engine', 'coingecko', 'CoinGecko / API Ninjas', 'Solana is a high-throughput blockchain capable of thousands of transactions per second with sub-cent fees.', 'Validator hardware demands and historical network congestion.', 'Medium', 1, 1, 83.75, 3.12, 86.5, 80.2, 3850000000, 39500000000, 471000000, 5],
        ['XRP', 'XRP', 'ripple', '/assets/coins/xrp.svg', 'XRP Ledger (Consensus Protocol)', 'coingecko', 'CoinGecko / API Ninjas', 'XRP is built for real-time cross-border settlements and enterprise payment facilitation.', 'Regulatory ongoing litigation and escrow lock releases.', 'Medium', 1, 1, 0.528, -0.45, 0.542, 0.519, 1420000000, 29800000000, 56000000000, 6],
        ['Dogecoin', 'DOGE', 'dogecoin', '/assets/coins/doge.svg', 'Scrypt Proof of Work (AuxPoW)', 'coingecko', 'CoinGecko / API Ninjas', 'Dogecoin is the original meme cryptocurrency created in 2013 featuring the Shiba Inu dog.', 'Social sentiment volatility and inflationary tokenomics.', 'High', 1, 1, 0.142, 5.80, 0.151, 0.134, 1950000000, 20700000000, 146000000000, 7],
        ['Cardano', 'ADA', 'cardano', '/assets/coins/ada.svg', 'Ouroboros Proof of Stake (Peer-Reviewed Protocol)', 'coingecko', 'CoinGecko / API Ninjas', 'Cardano is a research-first blockchain platform built on peer-reviewed academic papers.', 'Development roadmap pacing and adoption competition.', 'Medium', 1, 1, 0.362, 1.15, 0.375, 0.354, 420000000, 12900000000, 35600000000, 8],
        ['Avalanche', 'AVAX', 'avalanche-2', '/assets/coins/avax.svg', 'Avalanche Consensus (Multi-Subnet Architecture)', 'coingecko', 'CoinGecko / API Ninjas', 'Avalanche is a smart contract platform capable of sub-second finality with custom subnets.', 'Unlocks schedule and subnet validation economics.', 'Medium', 1, 1, 24.85, 2.40, 25.6, 23.9, 380000000, 9950000000, 400000000, 9],
        ['Chainlink', 'LINK', 'chainlink', '/assets/coins/link.svg', 'Decentralized Oracle Network (Cross-Chain CCIP)', 'coingecko', 'CoinGecko / API Ninjas', 'Chainlink connects smart contracts with real-world external data feeds, off-chain computation, and APIs.', 'Oracle node collaterals and multi-chain bridge integrations.', 'Medium', 1, 1, 11.24, 0.95, 11.6, 10.9, 290000000, 6850000000, 608000000, 10],
        ['Polkadot', 'DOT', 'polkadot', '/assets/coins/dot.svg', 'Nominated Proof of Stake (Heterogeneous Parachains)', 'coingecko', 'CoinGecko / API Ninjas', 'Polkadot unites independent blockchains into a shared security and interoperability network.', 'Parachain slot renewal dynamics and inflation rate.', 'Medium', 1, 1, 4.15, -0.80, 4.28, 4.08, 185000000, 5950000000, 1430000000, 11],
        ['TRON', 'TRX', 'tron', '/assets/coins/trx.svg', 'Delegated Proof of Stake (High-Throughput DPoS)', 'coingecko', 'CoinGecko / API Ninjas', 'TRON is a decentralized platform known for hosting the largest volume of global USDT transfers.', 'Validator centralization and governance concentration.', 'Medium', 1, 1, 0.165, 1.05, 0.168, 0.161, 650000000, 14300000000, 86600000000, 12],
        ['Monero', 'XMR', 'monero', '/assets/coins/xmr.svg', 'RandomX Proof of Work (Ring Confidential Transactions)', 'coingecko', 'CoinGecko / API Ninjas', 'Monero is the leading privacy-focused cryptocurrency with untraceable stealth transactions and ring signatures.', 'Regulatory exchange delistings and jurisdiction prohibitions.', 'High', 1, 1, 158.40, 2.50, 162.0, 154.5, 194000000, 2910000000, 18400000, 13],
        ['Beldex', 'BDX', 'beldex', '/assets/coins/bdx.png', 'Proof of Stake Private Ecosystem (Masternodes & POS)', 'coingecko', 'CoinGecko / API Ninjas', 'Beldex is a privacy-first web3 ecosystem providing BChat confidential messaging, BelNet dVPN, and Masternode validation.', 'Altcoin liquidity profile and Masternode collateral requirements.', 'High', 1, 1, 0.0722, 3.41, 0.075, 0.069, 9420000, 568900000, 7880000000, 14],
        ['Shiba Inu', 'SHIB', 'shiba-inu', '/assets/coins/shib.svg', 'Ethereum ERC-20 + Shibarium Layer-2 Ecosystem', 'coingecko', 'CoinGecko / API Ninjas', 'Shiba Inu is a community-driven meme ecosystem expanding into DEXs and Shibarium Layer-2.', 'Massive circulating token supply and high speculative swings.', 'Very High', 1, 1, 0.0000185, 4.25, 0.0000192, 0.0000176, 520000000, 10900000000, 589000000000000, 15],
        ['Pepe', 'PEPE', 'pepe', '/assets/coins/pepe.svg', 'Ethereum ERC-20 Deflationary Meme Token', 'coingecko', 'CoinGecko / API Ninjas', 'Pepe is a culture-centric viral meme coin on Ethereum with a burning redistribution mechanism.', 'Meme sentiment volatility and zero inherent utility.', 'Very High', 1, 1, 0.0000098, 7.90, 0.0000105, 0.0000089, 880000000, 4120000000, 420690000000000, 16],
        ['Sui', 'SUI', 'sui', '/assets/coins/sui.svg', 'Move Language Object-Centric Layer 1', 'coingecko', 'CoinGecko / API Ninjas', 'Sui is an innovative Layer 1 blockchain using the Move programming language for parallel execution.', 'Token unlock vesting schedule and early developer adoption curve.', 'High', 1, 1, 1.95, 6.20, 2.05, 1.82, 750000000, 5460000000, 2800000000, 17],
        ['NEAR Protocol', 'NEAR', 'near', '/assets/coins/near.svg', 'Nightshade Sharding Proof of Stake (AI & Web3)', 'coingecko', 'CoinGecko / API Ninjas', 'NEAR Protocol is a high-speed sharded blockchain focused on user-friendly abstraction and decentralized AI.', 'Sharding complexity and market competition among smart contract chains.', 'Medium', 1, 1, 4.82, 3.45, 5.05, 4.65, 410000000, 5880000000, 1220000000, 18],
        ['Litecoin', 'LTC', 'litecoin', '/assets/coins/ltc.svg', 'Scrypt Proof of Work (Silver to Bitcoin Gold)', 'coingecko', 'CoinGecko / API Ninjas', 'Litecoin was launched in 2011 by Charlie Lee as a lightweight peer-to-peer payment alternative to Bitcoin.', 'Mining reward halving cycles and low relative market beta.', 'Medium', 1, 1, 68.20, 1.05, 70.1, 66.8, 360000000, 5120000000, 75000000, 19],
        ['Uniswap', 'UNI', 'uniswap', '/assets/coins/uni.svg', 'Ethereum Automated Market Maker (AMM DEX Governance)', 'coingecko', 'CoinGecko / API Ninjas', 'Uniswap is the largest decentralized automated market maker exchange protocol across EVM networks.', 'Fee-switch governance debates and decentralized liquidity concentration.', 'Medium', 1, 1, 7.65, 2.10, 7.95, 7.42, 280000000, 4590000000, 600000000, 20]
    ];

    for (const row of ALL_COINS_DATA) {
        const exists = db.prepare('SELECT id FROM cryptocurrencies WHERE symbol = ?').get(row[1]);
        if (!exists) {
            insertCrypto.run(...row);
        } else {
            // Update price and details
            db.prepare('UPDATE cryptocurrencies SET current_price_usd = ?, change_24h = ?, logo_url = ? WHERE id = ?').run(row[12], row[13], row[3], exists.id);
        }
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
            VALUES (?, 'USD', 10000.00, 0.00, 10000.00, 1)
        `).run(adminId);

        db.prepare(`
            INSERT INTO virtual_wallet_transactions (wallet_id, user_id, transaction_ref, type, amount_usd, currency, balance_before_usd, balance_after_usd, description)
            VALUES (?, ?, ?, 'WELCOME_BONUS', 10000.00, 'USD', 0.00, 10000.00, 'CCPulse Welcome Bonus ($10,000 USD)')
        `).run(adminWallet.lastInsertRowid, adminId, 'WB-ADM-' + Date.now());

        // Regular Trader User
        const traderInsert = db.prepare(`
            INSERT INTO users (uuid, email, username, full_name, password_hash, role, is_active, is_suspended, email_verified)
            VALUES (?, ?, ?, ?, ?, ?, 1, 0, 1)
        `).run('usr-00000000-0002', 'trader@ccpulse.com', 'cryptotrader', 'Alex Rivera', traderHash, 'user');
        const traderId = traderInsert.lastInsertRowid;

        db.prepare('INSERT INTO user_profiles (user_id, bio, country) VALUES (?, ?, ?)').run(traderId, 'Enthusiastic crypto student practicing portfolio risk management.', 'US');
        db.prepare('INSERT INTO user_preferences (user_id, preferred_currency, theme) VALUES (?, ?, ?)').run(traderId, 'USD', 'dark');

        // Trader Wallet with $10,000 Welcome Bonus + 1.0 BTC + 50,000 BDX
        const btcCoin = db.prepare("SELECT id, current_price_usd FROM cryptocurrencies WHERE symbol = 'BTC'").get();
        const bdxCoin = db.prepare("SELECT id, current_price_usd FROM cryptocurrencies WHERE symbol = 'BDX'").get();
        const btcPrice = btcCoin ? btcCoin.current_price_usd : 73932.53;
        const bdxPrice = bdxCoin ? bdxCoin.current_price_usd : 0.0722;
        const bdxCost = 50000 * bdxPrice; // $3,610.00
        const traderCash = 10000.00 - bdxCost; // $6,390.00 remaining cash
        const traderInvested = btcPrice + bdxCost;

        const traderWallet = db.prepare(`
            INSERT INTO virtual_wallets (user_id, currency, balance_usd, invested_usd, total_deposited_usd, welcome_bonus_credited)
            VALUES (?, 'USD', ?, ?, 10000.00, 1)
        `).run(traderId, traderCash, traderInvested);
        const twId = traderWallet.lastInsertRowid;

        // Cash Welcome Bonus transaction
        db.prepare(`
            INSERT INTO virtual_wallet_transactions (wallet_id, user_id, transaction_ref, type, amount_usd, currency, balance_before_usd, balance_after_usd, description, audit_reason)
            VALUES (?, ?, ?, 'WELCOME_BONUS', 10000.00, 'USD', 0.00, 10000.00, 'CCPulse Welcome Bonus ($10,000 USD)', 'Automated Registration Welcome Credit')
        `).run(twId, traderId, 'WB-TRD-' + Date.now());

        // BTC Gift Holding
        if (btcCoin) {
            db.prepare(`
                INSERT INTO virtual_holdings (wallet_id, user_id, crypto_id, symbol, quantity, avg_buy_price_usd, total_invested_usd)
                VALUES (?, ?, ?, 'BTC', 1.00000000, ?, ?)
            `).run(twId, traderId, btcCoin.id, btcPrice, btcPrice);
        }

        // 50,000 BDX Holding
        if (bdxCoin) {
            db.prepare(`
                INSERT INTO virtual_holdings (wallet_id, user_id, crypto_id, symbol, quantity, avg_buy_price_usd, total_invested_usd)
                VALUES (?, ?, ?, 'BDX', 50000.00000000, ?, ?)
            `).run(twId, traderId, bdxCoin.id, bdxPrice, bdxCost);

            // BDX Trade Record
            const bdxTradeRef = 'TR-BUY-' + Date.now() + '-50K';
            db.prepare(`
                INSERT INTO virtual_wallet_transactions (wallet_id, user_id, transaction_ref, type, amount_usd, currency, balance_before_usd, balance_after_usd, description)
                VALUES (?, ?, ?, 'BUY_ORDER', ?, 'USD', 10000.00, ?, 'Purchased 50000.0000 BDX at $0.0722 USD')
            `).run(twId, traderId, bdxTradeRef, bdxCost, traderCash);

            db.prepare(`
                INSERT INTO simulated_trades (trade_ref, user_id, is_guest, crypto_id, symbol, type, quantity, price_usd, total_value_usd, status)
                VALUES (?, ?, 0, ?, 'BDX', 'BUY', 50000.0, ?, ?, 'EXECUTED')
            `).run(bdxTradeRef, traderId, bdxCoin.id, bdxPrice, bdxCost);
        }

        // Welcome Notification
        db.prepare(`
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (?, 'Welcome to CCPulse!', 'Welcome to CCPulse! Your $10,000 virtual trading cash and 1.0 Bitcoin bonus are ready. Start learning, explore the markets, and practice trading without risking real money.', 'WELCOME_BONUS')
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

    // 6. Seed Support Tickets
    try {
        const ticketCount = db.prepare('SELECT COUNT(*) as count FROM support_tickets').get().count;
        if (ticketCount === 0) {
            const insertTicket = db.prepare(`
                INSERT INTO support_tickets (ticket_code, user_id, user_email, user_name, subject, category, priority, status, description, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
            `);
            const insertReply = db.prepare(`
                INSERT INTO ticket_replies (ticket_id, sender_id, sender_name, sender_role, message, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
            `);

            const t1 = insertTicket.run('TKT-100291', 2, 'trader@ccpulse.com', 'Simulated Trader', 'How do Beldex Masternode rewards work in simulation?', 'Crypto Pricing & Live Feeds', 'medium', 'open', 'I am testing the Beldex ecosystem in the simulator. Does the paper trading calculate staking yield or Masternode block validation rewards?', '-1 days');
            insertReply.run(t1.lastInsertRowid, 2, 'Simulated Trader', 'user', 'Looking forward to guidance on POS privacy block yields.', '-1 days');

            const t2 = insertTicket.run('TKT-100292', 2, 'trader@ccpulse.com', 'Simulated Trader', 'Request to add Avalanche (AVAX) to the simulator registry', 'Feature Suggestion', 'low', 'in_progress', 'Could the admin team add AVAX so we can test Layer 1 subnets in the simulation lab?', '-2 days');
            insertReply.run(t2.lastInsertRowid, 1, 'CCPulse Administrator', 'admin', 'Thank you for the suggestion! The coin request is under review and will be added via the Dynamic Crypto Registry.', '-1 days');

            const t3 = insertTicket.run('TKT-100293', 1, 'admin@ccpulse.com', 'Admin User', 'App Store Compliance & Simulated Disclosures verification', 'Simulator & Trading', 'high', 'resolved', 'Audit verification of all paper trading risk disclaimers across mobile and desktop views.', '-3 days');
            insertReply.run(t3.lastInsertRowid, 1, 'CCPulse Administrator', 'admin', 'Verified 100% compliant with Apple Guideline 3.1.5 and Google Play Financial Services Policy.', '-2 days');
        }
    } catch (e) {
        // Ignored if table will be populated upon schema reload
    }

    // Ensure Trader (User 2) has 1.0 BTC and 50,000 BDX holdings in SQLite if empty
    try {
        const trader = db.prepare("SELECT id FROM users WHERE id = 2 OR username = 'cryptotrader'").get();
        if (trader) {
            const holdingsCount = db.prepare('SELECT COUNT(*) as c FROM virtual_holdings WHERE user_id = ?').get(trader.id).c;
            if (holdingsCount === 0) {
                const btc = db.prepare("SELECT id, current_price_usd FROM cryptocurrencies WHERE symbol = 'BTC'").get();
                const bdx = db.prepare("SELECT id, current_price_usd FROM cryptocurrencies WHERE symbol = 'BDX'").get();
                const btcP = btc ? btc.current_price_usd : 73932.53;
                const bdxP = bdx ? bdx.current_price_usd : 0.0722;
                const bdxTotal = 50000 * bdxP;

                const tw = db.prepare('SELECT id FROM virtual_wallets WHERE user_id = ?').get(trader.id);
                if (tw) {
                    db.prepare('UPDATE virtual_wallets SET balance_usd = 6390.00, invested_usd = ?, total_deposited_usd = 10000.00 WHERE id = ?').run(btcP + bdxTotal, tw.id);
                    if (btc) {
                        db.prepare(`
                            INSERT INTO virtual_holdings (wallet_id, user_id, crypto_id, symbol, quantity, avg_buy_price_usd, total_invested_usd)
                            VALUES (?, ?, ?, 'BTC', 1.0, ?, ?)
                        `).run(tw.id, trader.id, btc.id, btcP, btcP);
                    }
                    if (bdx) {
                        db.prepare(`
                            INSERT INTO virtual_holdings (wallet_id, user_id, crypto_id, symbol, quantity, avg_buy_price_usd, total_invested_usd)
                            VALUES (?, ?, ?, 'BDX', 50000.0, ?, ?)
                        `).run(tw.id, trader.id, bdx.id, bdxP, bdxTotal);

                        db.prepare(`
                            INSERT INTO simulated_trades (trade_ref, user_id, is_guest, crypto_id, symbol, type, quantity, price_usd, total_value_usd, status)
                            VALUES (?, ?, 0, ?, 'BDX', 'BUY', 50000.0, ?, ?, 'EXECUTED')
                        `).run('TR-BUY-INIT-50K', trader.id, bdx.id, bdxP, bdxTotal);
                    }
                }
            }
        }
    } catch (e) {}

    // Migration: Ensure virtual_wallet_transactions and simulated_trades allow 'SWAP'
    try {
        const tableSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='virtual_wallet_transactions'").get();
        if (tableSql && !tableSql.sql.includes("'SWAP'")) {
            db.pragma('foreign_keys = OFF');
            db.exec(`
                CREATE TABLE IF NOT EXISTS virtual_wallet_transactions_mig (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    wallet_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    transaction_ref TEXT UNIQUE NOT NULL,
                    type TEXT NOT NULL CHECK(type IN ('WELCOME_BONUS', 'BUY_ORDER', 'SELL_ORDER', 'ADMIN_GRANT', 'ADMIN_DEDUCT', 'SWAP')),
                    amount_usd REAL NOT NULL,
                    currency TEXT NOT NULL DEFAULT 'USD',
                    balance_before_usd REAL NOT NULL,
                    balance_after_usd REAL NOT NULL,
                    description TEXT NOT NULL,
                    audit_reason TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(wallet_id) REFERENCES virtual_wallets(id) ON DELETE CASCADE,
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                INSERT INTO virtual_wallet_transactions_mig SELECT * FROM virtual_wallet_transactions;
                DROP TABLE virtual_wallet_transactions;
                ALTER TABLE virtual_wallet_transactions_mig RENAME TO virtual_wallet_transactions;
            `);
            db.pragma('foreign_keys = ON');
        }

        const tradeSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='simulated_trades'").get();
        if (tradeSql && !tradeSql.sql.includes("'SWAP'")) {
            db.pragma('foreign_keys = OFF');
            db.exec(`
                DROP TABLE IF EXISTS simulated_trades_mig;
                CREATE TABLE simulated_trades_mig (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    trade_ref TEXT UNIQUE NOT NULL,
                    user_id INTEGER,
                    is_guest INTEGER NOT NULL DEFAULT 0,
                    crypto_id INTEGER NOT NULL,
                    symbol TEXT NOT NULL,
                    type TEXT NOT NULL CHECK(type IN ('BUY', 'SELL', 'SWAP')),
                    quantity REAL NOT NULL,
                    price_usd REAL NOT NULL,
                    total_value_usd REAL NOT NULL,
                    fee_usd REAL NOT NULL DEFAULT 0,
                    status TEXT NOT NULL DEFAULT 'EXECUTED',
                    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(crypto_id) REFERENCES cryptocurrencies(id) ON DELETE RESTRICT
                );
                INSERT INTO simulated_trades_mig SELECT * FROM simulated_trades;
                DROP TABLE simulated_trades;
                ALTER TABLE simulated_trades_mig RENAME TO simulated_trades;
            `);
            db.pragma('foreign_keys = ON');
        }
    } catch (e) {
        console.warn('Constraint migration notice:', e.message);
    }
}

// Call initialization
initDb();

module.exports = db;

