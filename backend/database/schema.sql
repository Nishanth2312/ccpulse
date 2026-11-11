-- CCPulse Comprehensive Database Schema
-- Supports all 19+ tables with strict constraints, foreign keys, and auditability

PRAGMA foreign_keys = ON;

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    is_active INTEGER NOT NULL DEFAULT 1,
    is_suspended INTEGER NOT NULL DEFAULT 0,
    email_verified INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME
);

-- 2. User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    country TEXT DEFAULT 'US',
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. User Roles & Permissions
CREATE TABLE IF NOT EXISTS user_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name TEXT UNIQUE NOT NULL,
    permissions TEXT NOT NULL, -- JSON array of permissions
    description TEXT
);

-- 4. User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_token TEXT UNIQUE NOT NULL,
    user_id INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    is_anonymous INTEGER NOT NULL DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Cryptocurrencies registry (dynamic, database-driven)
CREATE TABLE IF NOT EXISTS cryptocurrencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    symbol TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    blockchain TEXT NOT NULL,
    api_provider_id TEXT DEFAULT 'coingecko',
    market_data_source TEXT DEFAULT 'Internal Simulated / CoinGecko Live',
    educational_content TEXT,
    risk_information TEXT,
    risk_level TEXT DEFAULT 'Medium' CHECK(risk_level IN ('Low', 'Medium', 'High', 'Very High')),
    is_active INTEGER NOT NULL DEFAULT 1,
    is_visible INTEGER NOT NULL DEFAULT 1,
    current_price_usd REAL NOT NULL DEFAULT 0,
    change_24h REAL NOT NULL DEFAULT 0,
    high_24h REAL NOT NULL DEFAULT 0,
    low_24h REAL NOT NULL DEFAULT 0,
    volume_24h REAL NOT NULL DEFAULT 0,
    market_cap_usd REAL NOT NULL DEFAULT 0,
    circulating_supply REAL NOT NULL DEFAULT 0,
    view_count INTEGER NOT NULL DEFAULT 0,
    simulation_count INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Cryptocurrency Providers
CREATE TABLE IF NOT EXISTS cryptocurrency_providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    provider_code TEXT UNIQUE NOT NULL,
    api_url TEXT NOT NULL,
    api_key_ref TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    priority INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Virtual Wallets (1 per registered user, USD-based accounting)
CREATE TABLE IF NOT EXISTS virtual_wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    balance_usd REAL NOT NULL DEFAULT 10000.00,
    invested_usd REAL NOT NULL DEFAULT 0.00,
    total_deposited_usd REAL NOT NULL DEFAULT 10000.00,
    total_withdrawn_usd REAL NOT NULL DEFAULT 0.00,
    welcome_bonus_credited INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Virtual Wallet Transactions (Auditable ledger)
CREATE TABLE IF NOT EXISTS virtual_wallet_transactions (
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

-- 9. Virtual Holdings (Portfolio positions)
CREATE TABLE IF NOT EXISTS virtual_holdings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    crypto_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 0,
    avg_buy_price_usd REAL NOT NULL DEFAULT 0,
    total_invested_usd REAL NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, crypto_id),
    FOREIGN KEY(wallet_id) REFERENCES virtual_wallets(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(crypto_id) REFERENCES cryptocurrencies(id) ON DELETE RESTRICT
);

-- 10. Simulated Trades
CREATE TABLE IF NOT EXISTS simulated_trades (
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

-- 11. Portfolio Snapshots (For historical performance chart)
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    wallet_id INTEGER NOT NULL,
    total_value_usd REAL NOT NULL,
    cash_balance_usd REAL NOT NULL,
    invested_value_usd REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(wallet_id) REFERENCES virtual_wallets(id) ON DELETE CASCADE
);

-- 12. Supported Currencies
CREATE TABLE IF NOT EXISTS supported_currencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL, -- USD, INR, EUR, GBP, AED, JPY
    name TEXT NOT NULL,
    symbol TEXT NOT NULL, -- $, ₹, €, £, د.إ, ¥
    exchange_rate_to_usd REAL NOT NULL DEFAULT 1.0, -- USD value * rate = Converted value
    is_active INTEGER NOT NULL DEFAULT 1,
    is_default INTEGER NOT NULL DEFAULT 0,
    decimal_places INTEGER NOT NULL DEFAULT 2,
    last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 13. Exchange Rates History / Cache
CREATE TABLE IF NOT EXISTS exchange_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    base_currency TEXT NOT NULL DEFAULT 'USD',
    target_currency TEXT NOT NULL,
    rate REAL NOT NULL,
    provider TEXT NOT NULL DEFAULT 'ForexLiveExchange',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_stale INTEGER NOT NULL DEFAULT 0
);

-- 14. User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    preferred_currency TEXT NOT NULL DEFAULT 'USD',
    theme TEXT NOT NULL DEFAULT 'system' CHECK(theme IN ('dark', 'light', 'system')),
    notifications_enabled INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 15. Themes Configuration
CREATE TABLE IF NOT EXISTS themes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL CHECK(code IN ('dark', 'light', 'system')),
    primary_color TEXT NOT NULL,
    background_color TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1
);

-- 16. Learning Courses
CREATE TABLE IF NOT EXISTS learning_courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK(difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    duration_minutes INTEGER NOT NULL,
    modules_count INTEGER NOT NULL,
    summary TEXT NOT NULL,
    content_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 17. Learning Progress
CREATE TABLE IF NOT EXISTS learning_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    completed_modules INTEGER NOT NULL DEFAULT 0,
    total_modules INTEGER NOT NULL DEFAULT 1,
    score INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('not_started', 'in_progress', 'completed')),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(course_id) REFERENCES learning_courses(id) ON DELETE CASCADE
);

-- 18. User Watchlists
CREATE TABLE IF NOT EXISTS user_watchlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    crypto_id INTEGER NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, crypto_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(crypto_id) REFERENCES cryptocurrencies(id) ON DELETE CASCADE
);

-- 19. Admin Audit Logs
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    admin_username TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    audit_reason TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 20. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'SYSTEM' CHECK(type IN ('WELCOME_BONUS', 'TRADE', 'ALERT', 'SYSTEM', 'ADMIN')),
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 21. System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 22. Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_code TEXT UNIQUE NOT NULL,
    user_id INTEGER,
    guest_session_id TEXT,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
    description TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 23. Ticket Replies
CREATE TABLE IF NOT EXISTS ticket_replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    sender_id INTEGER,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL DEFAULT 'user' CHECK(sender_role IN ('user', 'admin', 'staff')),
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
);

-- Create indexes for high performance queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_cryptos_symbol ON cryptocurrencies(symbol);
CREATE INDEX IF NOT EXISTS idx_cryptos_active ON cryptocurrencies(is_active);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON virtual_wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON virtual_wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_user ON simulated_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_user ON virtual_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_code ON support_tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_replies_ticket ON ticket_replies(ticket_id);

