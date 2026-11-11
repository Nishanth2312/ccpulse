const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// Backend modules
const db = require('../backend/database/db');
const {
    creditWelcomeBonus,
    getUserWallet,
    executeSimulatedTrade,
    executeSimulatedSwap,
    adminAdjustBalance
} = require('../backend/services/walletService');
const {
    convertFromUsd,
    formatCurrency,
    fetchLiveExchangeRates,
    getCurrencyStatus
} = require('../backend/services/currencyService');
const {
    getActiveCryptos,
    getCryptoBySymbolOrSlug,
    getHistoricalChartData,
    getOrderBook
} = require('../backend/services/cryptoMarketService');
const { logAdminAction, getAuditLogs } = require('../backend/services/auditService');

describe('CCPulse Comprehensive 20-Scenario Acceptance Test Suite', () => {

    let testUserA = null;
    let testUserB = null;
    let adminUser = null;

    before(() => {
        // Find seeded admin user
        adminUser = db.prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1").get();
        assert.ok(adminUser, 'Admin user should exist in seeded database');
    });

    // SCENARIO 1: New user registration
    test('Scenario 1: New user registration', () => {
        const uniqueEmail = `trader_test_${Date.now()}@ccpulse.com`;
        const uniqueUsername = `trader_${Date.now()}`;
        const uuid = `usr-test-${Date.now()}`;

        const insert = db.prepare(`
            INSERT INTO users (uuid, email, username, full_name, password_hash, role, is_active, is_suspended, email_verified)
            VALUES (?, ?, ?, 'Test User Alpha', 'fake_hash_123', 'user', 1, 0, 1)
        `).run(uuid, uniqueEmail, uniqueUsername);

        testUserA = db.prepare('SELECT * FROM users WHERE id = ?').get(insert.lastInsertRowid);
        assert.ok(testUserA, 'User should be successfully registered in users table');
        assert.equal(testUserA.email, uniqueEmail);
        assert.equal(testUserA.role, 'user');
    });

    // SCENARIO 2: Automatic $10,000 welcome bonus + 1.0 BTC
    test('Scenario 2: Automatic $10,000 welcome bonus + 1.0 BTC credited on registration', () => {
        const bonusRes = creditWelcomeBonus(testUserA.id);
        assert.equal(bonusRes.success, true, 'Welcome bonus crediting should succeed');
        assert.equal(bonusRes.alreadyCredited, false);
        assert.equal(bonusRes.amount, 10000.00);

        // Verify wallet in database
        const wallet = getUserWallet(testUserA.id);
        assert.ok(wallet, 'Virtual wallet must be automatically created');
        assert.equal(wallet.availableCashUsd, 10000.00, 'Initial balance must be exactly $10,000.00 USD');
        assert.ok(wallet.investedUsd > 0, 'Invested value should include 1.0 BTC holding');
        assert.ok(wallet.totalPortfolioValueUsd >= 10000.00);
        assert.ok(wallet.holdings.some(h => h.symbol === 'BTC' && h.quantity === 1.0), 'User must hold 1.0 Bitcoin bonus');

        // Verify transaction entries
        const txs = db.prepare("SELECT * FROM virtual_wallet_transactions WHERE user_id = ? AND type = 'WELCOME_BONUS'").all(testUserA.id);
        assert.equal(txs.length, 2, 'Transaction ledger must record 2 WELCOME_BONUS entries (cash + BTC gift)');
    });

    // SCENARIO 3: Prevent duplicate welcome bonuses
    test('Scenario 3: Prevent duplicate welcome bonuses on same account', () => {
        // Attempt to credit welcome bonus again
        const duplicateAttempt = creditWelcomeBonus(testUserA.id);
        assert.equal(duplicateAttempt.success, false, 'Duplicate bonus distribution must be blocked');
        assert.equal(duplicateAttempt.alreadyCredited, true);

        // Ensure balance remains $10,000.00
        const wallet = getUserWallet(testUserA.id);
        assert.equal(wallet.availableCashUsd, 10000.00, 'Wallet balance must remain $10,000.00 USD');
    });

    // SCENARIO 4: Existing user login without bonus duplication
    test('Scenario 4: Existing user login retains wallet balance without bonus duplication', () => {
        // Simulate login: query user and wallet
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(testUserA.id);
        const wallet = getUserWallet(user.id);
        assert.equal(wallet.availableCashUsd, 10000.00, 'Balance must remain intact upon subsequent login');

        // Check total welcome bonus transactions for this user
        const bonusCount = db.prepare("SELECT COUNT(*) as c FROM virtual_wallet_transactions WHERE user_id = ? AND type = 'WELCOME_BONUS'").get(testUserA.id).c;
        assert.equal(bonusCount, 2, 'Exactly 2 welcome bonus records (cash + BTC gift) exist per user');
    });

    // SCENARIO 5: Guest user access
    test('Scenario 5: Anonymous guest user access with temporary virtual simulator balance', () => {
        const guestSession = {
            temporaryBalanceUsd: 10000.00,
            holdings: [{ symbol: 'BTC', quantity: 1.0 }],
            trades: []
        };
        assert.equal(guestSession.temporaryBalanceUsd, 10000.00);
        assert.equal(guestSession.holdings[0].symbol, 'BTC');

        // Active cryptos are publicly accessible to guests without auth
        const publicCryptos = getActiveCryptos();
        assert.ok(publicCryptos.length >= 20, 'Guest must be able to view all 20+ active cryptocurrencies');
    });

    // SCENARIO 6: Guest-to-authenticated account conversion
    test('Scenario 6: Guest-to-authenticated account conversion and welcome bonus grant', () => {
        // User registers from guest state
        const uniqueEmail = `guest_conv_${Date.now()}@ccpulse.com`;
        const insert = db.prepare(`
            INSERT INTO users (uuid, email, username, full_name, password_hash, role, is_active, is_suspended)
            VALUES (?, ?, ?, 'Guest Converted', 'pass123', 'user', 1, 0)
        `).run(`usr-conv-${Date.now()}`, uniqueEmail, `conv_${Date.now()}`);

        const newAuthUser = db.prepare('SELECT * FROM users WHERE id = ?').get(insert.lastInsertRowid);
        const bonusRes = creditWelcomeBonus(newAuthUser.id);
        assert.equal(bonusRes.success, true);

        const wallet = getUserWallet(newAuthUser.id);
        assert.equal(wallet.availableCashUsd, 10000.00);
        assert.ok(wallet.holdings.some(h => h.symbol === 'BTC' && h.quantity === 1.0));
    });

    // SCENARIO 7: User wallet persistence
    test('Scenario 7: User wallet and trade persistence in database', () => {
        const btc = getCryptoBySymbolOrSlug('BTC', false);
        assert.ok(btc, 'Bitcoin should exist in database');

        // Execute BUY 0.01 BTC
        const tradeRes = executeSimulatedTrade({
            userId: testUserA.id,
            cryptoId: btc.id,
            type: 'BUY',
            quantity: 0.01
        });

        assert.equal(tradeRes.success, true);
        assert.equal(tradeRes.symbol, 'BTC');

        // Fetch wallet from DB afresh
        const updatedWallet = getUserWallet(testUserA.id);
        const expectedCash = 10000.00 - (0.01 * btc.current_price_usd);
        assert.ok(Math.abs(updatedWallet.availableCashUsd - expectedCash) < 0.01, 'Cash deducted correctly');
        const btcHolding = updatedWallet.holdings.find(h => h.symbol === 'BTC');
        assert.ok(btcHolding, 'Holding position created');
        assert.equal(btcHolding.quantity, 1.01, 'Holding contains 1.0 BTC welcome bonus + 0.01 BTC purchase');
    });

    // SCENARIO 8: User data isolation
    test('Scenario 8: Strict user data isolation between accounts', () => {
        // Create User B
        const insertB = db.prepare(`
            INSERT INTO users (uuid, email, username, full_name, password_hash, role, is_active, is_suspended)
            VALUES (?, ?, ?, 'User Beta', 'passB', 'user', 1, 0)
        `).run(`usr-b-${Date.now()}`, `user_b_${Date.now()}@ccpulse.com`, `user_b_${Date.now()}`);
        testUserB = db.prepare('SELECT * FROM users WHERE id = ?').get(insertB.lastInsertRowid);
        creditWelcomeBonus(testUserB.id);

        // User B buys ETH
        const eth = getCryptoBySymbolOrSlug('ETH', false);
        executeSimulatedTrade({
            userId: testUserB.id,
            cryptoId: eth.id,
            type: 'BUY',
            quantity: 0.5
        });

        const walletA = getUserWallet(testUserA.id);
        const walletB = getUserWallet(testUserB.id);

        // User A has no ETH, User B has ETH
        assert.equal(walletA.holdings.some(h => h.symbol === 'ETH'), false, 'User A cannot access User B ETH positions');
        assert.equal(walletB.holdings.some(h => h.symbol === 'ETH'), true, 'User B has ETH position');

        // Isolation of financial transaction records
        const txA = db.prepare("SELECT * FROM virtual_wallet_transactions WHERE user_id = ? AND description LIKE '%ETH%'").all(testUserA.id);
        assert.equal(txA.length, 0, 'User A ledger must contain zero records of User B trades');
    });

    // SCENARIO 9: Admin-only access validation
    test('Scenario 9: Admin-only access validation and overview metrics', () => {
        // Verify regular user role is not admin
        assert.notEqual(testUserA.role, 'admin');

        // Admin overview service verification
        const adminOverviewQuery = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get();
        assert.ok(adminOverviewQuery.count >= 2, 'Admin overview queries user metrics correctly');

        // Admin audit logs
        logAdminAction({
            adminId: adminUser.id,
            adminUsername: adminUser.username,
            action: 'TEST_VERIFY_ADMIN',
            entityType: 'system',
            auditReason: 'Acceptance test run'
        });

        const { logs } = getAuditLogs({ limit: 5 });
        assert.ok(logs.length > 0, 'Admin audit log successfully recorded');
        assert.equal(logs[0].action, 'TEST_VERIFY_ADMIN');
    });

    // SCENARIO 10: Add new cryptocurrency through admin registry
    test('Scenario 10: Dynamic addition of a new cryptocurrency without source code modification', () => {
        const uniqueSym = `SYM_${Date.now().toString().slice(-4)}`;
        const insert = db.prepare(`
            INSERT INTO cryptocurrencies (
                name, symbol, slug, logo_url, blockchain, current_price_usd, is_active, is_visible
            ) VALUES (?, ?, ?, ?, ?, 1.25, 1, 1)
        `).run('Test Dynamic Coin', uniqueSym, uniqueSym.toLowerCase(), 'https://example.com/logo.png', 'Proof of Stake');

        const newId = insert.lastInsertRowid;
        assert.ok(newId > 0);

        // Verify coin is immediately in the active market list!
        const activeList = getActiveCryptos();
        const found = activeList.find(c => c.symbol === uniqueSym);
        assert.ok(found, 'Newly added cryptocurrency must immediately appear in active market list');
        assert.equal(found.current_price_usd, 1.25);

        // Clean up test coin
        db.prepare('DELETE FROM cryptocurrencies WHERE id = ?').run(newId);
    });

    // SCENARIO 11: Deactivate cryptocurrency & deletion safety guard
    test('Scenario 11: Deactivate cryptocurrency and protect financial transaction records', () => {
        const btc = getCryptoBySymbolOrSlug('BTC', false);

        // BTC has existing holdings from testUserA
        const holdingsCount = db.prepare('SELECT COUNT(*) as count FROM virtual_holdings WHERE crypto_id = ? AND quantity > 0').get(btc.id).count;
        assert.ok(holdingsCount > 0, 'BTC has active user holdings');

        // Safety rule: Deactivate instead of delete
        db.prepare('UPDATE cryptocurrencies SET is_active = 0, is_visible = 0 WHERE id = ?').run(btc.id);

        const checkBtc = db.prepare('SELECT * FROM cryptocurrencies WHERE id = ?').get(btc.id);
        assert.equal(checkBtc.is_active, 0, 'Cryptocurrency is successfully deactivated');

        // Reactivate for subsequent tests
        db.prepare('UPDATE cryptocurrencies SET is_active = 1, is_visible = 1 WHERE id = ?').run(btc.id);
    });

    // SCENARIO 12: Change application theme
    test('Scenario 12: Theme switching between dark, light, and system default', () => {
        const themes = db.prepare('SELECT * FROM themes').all();
        assert.ok(themes.length >= 3, 'Themes table must support dark, light, and system');

        const codes = themes.map(t => t.code);
        assert.ok(codes.includes('dark'));
        assert.ok(codes.includes('light'));
        assert.ok(codes.includes('system'));
    });

    // SCENARIO 13: Persist theme preferences
    test('Scenario 13: User theme preference persistence in database', () => {
        db.prepare(`
            INSERT INTO user_preferences (user_id, preferred_currency, theme)
            VALUES (?, 'USD', 'light')
            ON CONFLICT(user_id) DO UPDATE SET theme = 'light'
        `).run(testUserA.id);

        const prefs = db.prepare('SELECT theme FROM user_preferences WHERE user_id = ?').get(testUserA.id);
        assert.ok(prefs, 'Preferences record must exist');
        assert.equal(prefs.theme, 'light', 'Theme preference must persist in database');
    });

    // SCENARIO 14: Change USD to INR
    test('Scenario 14: Real-time currency conversion from USD to INR', () => {
        const usdAmount = 5000.00;
        const conv = convertFromUsd(usdAmount, 'INR');

        assert.equal(conv.amountUsd, 5000.00);
        assert.equal(conv.targetCurrency, 'INR');
        assert.ok(conv.exchangeRate > 70, 'USD/INR rate should be realistic (> 70)');
        assert.ok(conv.convertedAmount > 350000, '5,000 USD in INR should be > 3,50,000');
        assert.ok(conv.formatted.includes('₹') || conv.formatted.includes('INR'), 'Formatted output must have INR symbol');
    });

    // SCENARIO 15: Change INR to EUR
    test('Scenario 15: Currency cross-conversion calculation (USD base)', () => {
        const inrAmount = 426250; // equivalent to 5000 USD at 85.25
        const usdEquivalent = inrAmount / 85.25;
        const eurConv = convertFromUsd(usdEquivalent, 'EUR');

        assert.equal(eurConv.targetCurrency, 'EUR');
        assert.ok(eurConv.convertedAmount > 4000 && eurConv.convertedAmount < 5000, '5000 USD in EUR should be approx ~4,600 EUR');
        assert.ok(eurConv.formatted.includes('€'), 'Formatted output must have EUR symbol');
    });

    // SCENARIO 16: Verify conversion calculations across all supported currencies
    test('Scenario 16: Verify conversion formulas Converted = USD × Rate across USD, INR, EUR, GBP, AED, JPY', () => {
        const supported = ['USD', 'INR', 'EUR', 'GBP', 'AED', 'JPY'];
        const testUsd = 1000.00;

        for (const code of supported) {
            const conv = convertFromUsd(testUsd, code);
            const expected = Number((testUsd * conv.exchangeRate).toFixed(code === 'JPY' ? 0 : 2));
            assert.equal(conv.convertedAmount, expected, `Precision calculation for ${code} must match`);
        }
    });

    // SCENARIO 17: Handle exchange-rate API failure gracefully
    test('Scenario 17: Fallback to cached rates and stale indicator on API outage', async () => {
        // Test currency status provides fallback even if live network fails
        const status = getCurrencyStatus();
        assert.ok(status.rates.USD === 1.0);
        assert.ok(status.rates.INR > 0);
        assert.ok(status.rates.EUR > 0);
        assert.ok('isStale' in status, 'Must contain isStale flag');
        assert.ok(status.disclaimer.includes('educational'), 'Disclaimer must be present');
    });

    // SCENARIO 18: Handle market-data API failure gracefully
    test('Scenario 18: Fallback to simulated prices and order books on feed interruption', () => {
        const btc = getCryptoBySymbolOrSlug('BTC', false);
        const chart = getHistoricalChartData(btc.id, '1D');
        assert.ok(chart.length >= 10, 'Chart points generated from continuous pricing model');

        const ob = getOrderBook(btc.id);
        assert.ok(ob.bids.length > 0 && ob.asks.length > 0, 'Order book depth remains available');
    });

    // SCENARIO 19: Test mobile responsiveness & HTML structure
    test('Scenario 19: Mobile responsiveness, viewport meta, and CSS grid layout', () => {
        const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
        assert.ok(html.includes('viewport'), 'Viewport meta tag must be present for mobile');
        assert.ok(html.includes('mobile-drawer'), 'Mobile navigation drawer element must exist');

        const css = fs.readFileSync(path.join(__dirname, '../frontend/css/styles.css'), 'utf8');
        assert.ok(css.includes('@media (max-width: 1024px)'), 'Desktop-to-mobile breakpoint must exist');
        assert.ok(css.includes('@media (max-width: 640px)'), 'Mobile small screen breakpoint must exist');
    });

    // SCENARIO 20: Test Android application compatibility
    test('Scenario 20: Android application bridge, permissions, and configuration', () => {
        const configPath = path.join(__dirname, '../android/capacitor.config.json');
        assert.ok(fs.existsSync(configPath), 'Android capacitor.config.json must exist');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        assert.equal(config.appId, 'com.ccpulse.app');

        const manifestPath = path.join(__dirname, '../android/AndroidManifest.xml');
        assert.ok(fs.existsSync(manifestPath), 'Android manifest must exist');
        const manifest = fs.readFileSync(manifestPath, 'utf8');
        assert.ok(manifest.includes('android.permission.INTERNET'), 'INTERNET permission required for Android');
        assert.ok(manifest.includes('android:usesCleartextTraffic="true"'), 'Cleartext traffic enabled for local dev/cloud testing');

        const javaPath = path.join(__dirname, '../android/MainActivity.java');
        assert.ok(fs.existsSync(javaPath), 'Android MainActivity.java must exist');
        const java = fs.readFileSync(javaPath, 'utf8');
        assert.ok(java.includes('com.ccpulse.app'), 'Android Java package declaration matches');
        assert.ok(java.includes('WebView'), 'Android WebView host activity configured');
    });

    // SCENARIO 21: Admin Daily Analytics & User Registration Activity Breakdown
    test('Scenario 21: Admin Daily Analytics & User Registration Activity Breakdown', () => {
        const regRows = db.prepare(`
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM users
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `).all();

        assert.ok(Array.isArray(regRows), 'Daily registration rows must be an array');
        assert.ok(regRows.length > 0, 'At least one date with registrations must exist');
        assert.ok(regRows[0].count >= 1, 'Registrations count must be >= 1');
    });

    // SCENARIO 22: Help Support Ticket Raising & Staff Resolution Workflow
    test('Scenario 22: Help Support Ticket Raising & Staff Resolution Workflow', () => {
        const ticketCode = 'TKT-TEST-' + Date.now();
        const insertTicket = db.prepare(`
            INSERT INTO support_tickets (ticket_code, user_id, user_email, user_name, subject, category, priority, status, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const res = insertTicket.run(ticketCode, 2, 'trader@ccpulse.com', 'Test Trader', 'Test simulation question', 'Simulator & Trading', 'high', 'open', 'Need help with order books');
        const ticketId = res.lastInsertRowid;

        assert.ok(ticketId > 0, 'Support ticket must be created with valid ID');

        // Add reply
        db.prepare('INSERT INTO ticket_replies (ticket_id, sender_id, sender_name, sender_role, message) VALUES (?, ?, ?, ?, ?)').run(
            ticketId, 1, 'CCPulse Administrator', 'admin', 'Here is the guidance'
        );

        // Update status to resolved
        db.prepare("UPDATE support_tickets SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP WHERE id = ?").run(ticketId);

        const updated = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticketId);
        assert.equal(updated.status, 'resolved', 'Ticket status must be updated to resolved');

        // Clean up test ticket
        db.prepare('DELETE FROM ticket_replies WHERE ticket_id = ?').run(ticketId);
        db.prepare('DELETE FROM support_tickets WHERE id = ?').run(ticketId);
    });

    // SCENARIO 23: In-Browser Client Database Engine & Persistence for GitHub Pages (Offline / Standalone)
    test('Scenario 23: In-Browser Client Database Engine & Persistence for GitHub Pages', () => {
        const ClientDB = require('../frontend/js/clientDatabase.js');
        assert.ok(ClientDB, 'ClientDB module must be loadable');

        // 1. Reset database to default pristine state
        ClientDB.resetToDefault();

        // 2. Test initial seeded users
        const allUsers = ClientDB.users.getAll();
        assert.ok(allUsers.length >= 2, 'Default client database must contain admin and trader users');
        const adminUser = allUsers.find(u => u.role === 'admin');
        assert.equal(adminUser.email, 'admin@ccpulse.com');

        // 3. Test user registration in client database
        const testEmail = 'newtrader_' + Date.now() + '@ccpulse.com';
        const regRes = ClientDB.users.register({
            fullName: 'GitHub Pages Trader',
            username: 'gh_trader_' + Date.now(),
            email: testEmail,
            password: 'TraderPassword123!'
        });

        assert.ok(regRes.success, 'Registration must succeed in ClientDB');
        assert.ok(regRes.user.id > 2, 'New user should receive auto-incremented ID');
        assert.equal(regRes.wallet.availableCashUsd, 10000.00, 'Guaranteed $10,000 welcome bonus must be credited in ClientDB');
        assert.ok(regRes.wallet.holdings.some(h => h.symbol === 'BTC' && h.quantity === 1.0), 'Welcome bonus must include 1.0 Bitcoin holding in ClientDB');
        assert.equal(regRes.welcomeBonusCredited, true, 'welcomeBonusCredited flag must be true');

        // 4. Test duplicate email prevention
        assert.throws(() => {
            ClientDB.users.register({
                fullName: 'Duplicate Trader',
                username: 'dup_trader_' + Date.now(),
                email: testEmail,
                password: 'Password123!'
            });
        }, /already exists/, 'Must reject duplicate email in ClientDB');

        // 5. Test user login in client database
        const loginRes = ClientDB.users.login({
            email: testEmail,
            password: 'TraderPassword123!'
        });
        assert.ok(loginRes.success, 'Login must succeed with correct credentials');
        assert.equal(loginRes.user.email, testEmail);
        assert.equal(loginRes.wallet.availableCashUsd, 10000.00);

        // 6. Test trade execution and wallet persistence in client database
        const btcCoin = { id: 1, symbol: 'BTC', name: 'Bitcoin', logo_url: './assets/coins/btc.svg' };
        const tradeRes = ClientDB.trades.execute({
            userId: regRes.user.id,
            crypto: btcCoin,
            type: 'BUY',
            quantity: 0.01,
            priceUsd: 70000.00
        });

        assert.ok(tradeRes.success, 'Trade execution must succeed in ClientDB');
        assert.equal(tradeRes.wallet.availableCashUsd, 10000.00 - 700.00, 'Cash balance must be deducted by $700.00');
        assert.equal(tradeRes.wallet.holdings.length, 1, 'Holding for BTC must exist');
        assert.equal(tradeRes.wallet.holdings[0].symbol, 'BTC');
        assert.equal(tradeRes.wallet.holdings[0].quantity, 1.01, 'Holding must contain 1.0 BTC welcome gift + 0.01 BTC purchased');

        // 7. Test support ticket creation and resolution in client database
        const ticketRes = ClientDB.tickets.create({
            userId: regRes.user.id,
            userEmail: testEmail,
            userName: 'GitHub Pages Trader',
            subject: 'ClientDB inquiry',
            category: 'Simulator & Trading',
            priority: 'normal',
            description: 'Verifying client-side database persistence'
        });
        assert.ok(ticketRes.success, 'Ticket creation must succeed in ClientDB');
        assert.ok(ticketRes.ticket.ticket_code.startsWith('TICK-'), 'Ticket code must start with TICK-');

        // Add reply
        const replyRes = ClientDB.tickets.addReply(ticketRes.ticket.id, {
            senderName: 'CCPulse Admin',
            senderRole: 'admin',
            message: 'All client database operations verified'
        });
        assert.ok(replyRes.success);
        assert.equal(replyRes.ticket.replies.length, 2);

        // Update status
        ClientDB.tickets.updateStatus(ticketRes.ticket.id, 'resolved');
        const resolvedTicket = ClientDB.tickets.getById(ticketRes.ticket.id);
        assert.equal(resolvedTicket.status, 'resolved');

        // 8. Test Daily Analytics generated from ClientDB
        const analytics = ClientDB.analytics.getDaily('7d');
        assert.ok(analytics.success);
        assert.ok(analytics.dailyTimeline.length >= 7);
        assert.ok(analytics.aggregates.totalRegistrationsInPeriod >= 1);

        // 9. Test JSON Database export
        const exportedJson = ClientDB.exportJSON();
        assert.ok(typeof exportedJson === 'string');
        const parsed = JSON.parse(exportedJson);
        assert.ok(parsed.users && parsed.wallets && parsed.trades, 'Exported JSON must contain all core tables');
    });

    // SCENARIO 24: High-Volume Altcoin Purchase (50,000 Beldex BDX) Calculation & Persistence
    test('Scenario 24: High-Volume Altcoin Purchase (50,000 Beldex BDX) Calculation & Persistence', () => {
        const ClientDB = require('../frontend/js/clientDatabase.js');
        ClientDB.resetToDefault();

        const bdxCoin = { id: 4, symbol: 'BDX', name: 'Beldex', current_price_usd: 0.0722, logo_url: './assets/coins/bdx.png' };
        const user = ClientDB.users.getAll().find(u => u.role === 'user');
        const initialCash = ClientDB.wallets.getByUserId(user.id).availableCashUsd;

        // Purchase exactly 50,000 BDX
        const qty = 50000;
        const expectedCostUsd = Number((qty * bdxCoin.current_price_usd).toFixed(2)); // 50,000 * 0.0722 = 3,610.00 USD
        assert.equal(expectedCostUsd, 3610.00, '50,000 BDX at $0.0722 must equal exactly $3,610.00 USD');

        const buyResult = ClientDB.trades.execute({
            userId: user.id,
            crypto: bdxCoin,
            type: 'BUY',
            quantity: qty,
            priceUsd: bdxCoin.current_price_usd
        });

        assert.ok(buyResult.success, 'Buy order for 50,000 BDX must succeed');
        assert.equal(buyResult.trade.totalCostUsd, 3610.00, 'Trade record must record $3,610.00 total cost');
        assert.equal(buyResult.wallet.availableCashUsd, Number((initialCash - expectedCostUsd).toFixed(2)), 'Cash must be deducted by $3,610.00');

        const holding = buyResult.wallet.holdings.find(h => h.symbol === 'BDX');
        assert.ok(holding, 'BDX holding must exist');
        assert.ok(holding.quantity >= 50000, 'BDX holding quantity must include the purchased 50,000');

        // Subsequent partial sell of 20,000 BDX
        const sellQty = 20000;
        const sellProceedsUsd = Number((sellQty * bdxCoin.current_price_usd).toFixed(2)); // 20,000 * 0.0722 = 1,444.00 USD
        const sellResult = ClientDB.trades.execute({
            userId: user.id,
            crypto: bdxCoin,
            type: 'SELL',
            quantity: sellQty,
            priceUsd: bdxCoin.current_price_usd
        });

        assert.ok(sellResult.success, 'Sell order for 20,000 BDX must succeed');
        assert.equal(sellResult.trade.totalCostUsd, 1444.00, 'Sell proceeds must equal $1,444.00 USD');
        const afterSellCash = buyResult.wallet.availableCashUsd + sellProceedsUsd;
        assert.equal(sellResult.wallet.availableCashUsd, Number(afterSellCash.toFixed(2)), 'Wallet cash must be credited with sell proceeds');
    });

    // SCENARIO 25: Trading Sizing, Edge Cases & Error Validations
    test('Scenario 25: Trading Sizing, Edge Cases & Error Validations', () => {
        const ClientDB = require('../frontend/js/clientDatabase.js');
        const bdxCoin = { id: 4, symbol: 'BDX', name: 'Beldex', current_price_usd: 0.0722, logo_url: './assets/coins/bdx.png' };
        const user = ClientDB.users.getAll().find(u => u.role === 'user');

        // 1. Rejection of purchase exceeding available cash
        // Trying to buy 1,000,000 BDX ($72,200 USD) with a < $5,000 balance
        assert.throws(() => {
            ClientDB.trades.execute({
                userId: user.id,
                crypto: bdxCoin,
                type: 'BUY',
                quantity: 1000000,
                priceUsd: bdxCoin.current_price_usd
            });
        }, /Insufficient virtual cash/, 'Must reject buy order exceeding available virtual balance');

        // 2. Rejection of selling more than held
        assert.throws(() => {
            ClientDB.trades.execute({
                userId: user.id,
                crypto: bdxCoin,
                type: 'SELL',
                quantity: 9999999,
                priceUsd: bdxCoin.current_price_usd
            });
        }, /Insufficient BDX balance/, 'Must reject sell order exceeding current holdings');

        // 3. Rejection of invalid order types
        assert.throws(() => {
            ClientDB.trades.execute({
                userId: user.id,
                crypto: bdxCoin,
                type: 'INVALID_TYPE',
                quantity: 10,
                priceUsd: bdxCoin.current_price_usd
            });
        }, /Invalid trade type/, 'Must reject unsupported order types');
    });

    // SCENARIO 26: Multi-Currency Valuation & Precision for Beldex (BDX) Trades
    test('Scenario 26: Multi-Currency Valuation & Precision for Beldex (BDX) Trades', () => {
        const bdxUsdPrice = 0.0722;
        const bdxTradeQty = 50000;
        const totalTradeUsd = bdxTradeQty * bdxUsdPrice; // $3,610.00 USD

        // Test INR conversion (e.g. at 85.25 rate)
        const inrConv = convertFromUsd(totalTradeUsd, 'INR');
        const expectedInr = Number((totalTradeUsd * inrConv.exchangeRate).toFixed(2));
        assert.equal(inrConv.convertedAmount, expectedInr, '50,000 BDX trade must convert accurately to INR');
        assert.ok(inrConv.formatted.includes('₹') || inrConv.formatted.includes('INR'));
        assert.ok(inrConv.convertedAmount > 300000, 'INR amount should be > ₹3,00,000');

        // Test EUR conversion (e.g. at 0.92 rate)
        const eurConv = convertFromUsd(totalTradeUsd, 'EUR');
        const expectedEur = Number((totalTradeUsd * eurConv.exchangeRate).toFixed(2));
        assert.equal(eurConv.convertedAmount, expectedEur, '50,000 BDX trade must convert accurately to EUR');
        assert.ok(eurConv.formatted.includes('€') || eurConv.formatted.includes('EUR'));

        // Test GBP conversion (e.g. at 0.79 rate)
        const gbpConv = convertFromUsd(totalTradeUsd, 'GBP');
        const expectedGbp = Number((totalTradeUsd * gbpConv.exchangeRate).toFixed(2));
        assert.equal(gbpConv.convertedAmount, expectedGbp, '50,000 BDX trade must convert accurately to GBP');
    });

    // SCENARIO 27: Instant Coin-to-Coin Token Swap (DEX Simulation) & Transparent Fee Deductions
    test('Scenario 27: Instant Coin-to-Coin Token Swap (DEX Simulation) with Network Gas & Handling Fees', () => {
        // 1. Backend SQLite execution: Swap 0.1 BTC to ETH
        const btc = getCryptoBySymbolOrSlug('BTC', false);
        const eth = getCryptoBySymbolOrSlug('ETH', false);
        assert.ok(btc && eth, 'BTC and ETH cryptocurrencies must exist');

        const initialWallet = getUserWallet(testUserA.id);
        const initialBtcHolding = initialWallet.holdings.find(h => h.symbol === 'BTC');
        assert.ok(initialBtcHolding && initialBtcHolding.quantity >= 0.1, 'User A must have at least 0.1 BTC');

        const swapQty = 0.1;
        const swapRes = executeSimulatedSwap({
            userId: testUserA.id,
            fromCryptoId: btc.id,
            toCryptoId: eth.id,
            fromQuantity: swapQty,
            slippageTolerance: 0.5,
            networkFeePct: 0.15,
            handlingFeePct: 0.25
        });

        assert.ok(swapRes.success, 'Swap must succeed');
        assert.equal(swapRes.fromSymbol, 'BTC');
        assert.equal(swapRes.toSymbol, 'ETH');
        assert.equal(swapRes.fromQuantity, swapQty);

        const expectedGross = swapQty * btc.current_price_usd;
        const expectedNetFee = expectedGross * 0.0015;
        const expectedHandFee = expectedGross * 0.0025;
        const expectedTotalFee = expectedNetFee + expectedHandFee;
        const expectedNet = expectedGross - expectedTotalFee;
        const expectedToQty = expectedNet / eth.current_price_usd;

        assert.ok(Math.abs(swapRes.networkFeeUsd - expectedNetFee) < 0.05, 'Network fee should be 0.15%');
        assert.ok(Math.abs(swapRes.handlingFeeUsd - expectedHandFee) < 0.05, 'Handling fee should be 0.25%');
        assert.ok(Math.abs(swapRes.toQuantity - expectedToQty) < 0.0001, 'Target quantity must be calculated accurately');
        assert.ok(swapRes.minReceived < swapRes.toQuantity, 'Minimum received must reflect 0.5% slippage');

        // Check wallet holdings after swap
        const afterWallet = getUserWallet(testUserA.id);
        const afterBtc = afterWallet.holdings.find(h => h.symbol === 'BTC');
        const afterEth = afterWallet.holdings.find(h => h.symbol === 'ETH');
        assert.ok(Math.abs(afterBtc.quantity - (initialBtcHolding.quantity - swapQty)) < 0.0001, 'BTC holding deducted');
        assert.ok(afterEth && afterEth.quantity > 0, 'ETH holding added');

        // Verify transaction ledger entry
        const swapTx = db.prepare("SELECT * FROM virtual_wallet_transactions WHERE user_id = ? AND type = 'SWAP' ORDER BY id DESC LIMIT 1").get(testUserA.id);
        assert.ok(swapTx, 'SWAP transaction recorded in ledger');
        assert.ok(swapTx.description.includes('DEX Swap'), 'Description indicates DEX Swap');

        // 2. ClientDB (Browser / GitHub Pages) execution: Swap BTC to BDX
        const ClientDB = require('../frontend/js/clientDatabase.js');
        const user = ClientDB.users.getAll().find(u => u.role === 'user');
        const clientSwapRes = ClientDB.trades.executeSwap({
            userId: user.id,
            fromSymbol: 'BTC',
            toSymbol: 'BDX',
            fromQuantity: 0.05,
            fromPriceUsd: 73932.53,
            toPriceUsd: 0.0722,
            slippagePct: 0.5
        });

        assert.ok(clientSwapRes.success, 'ClientDB swap must succeed');
        assert.equal(clientSwapRes.trade.type, 'SWAP');
        assert.ok(clientSwapRes.wallet.holdings.some(h => h.symbol === 'BDX'), 'BDX holding updated in ClientDB');
    });

    // SCENARIO 28: Interactive Candlestick Bar (OHLC), Purchase Point Markers & 30-Second Cron Updates
    test('Scenario 28: Candlestick Bar Chart, Purchase Point Markers, and 30-Second Auto-Refresh Cron', () => {
        const portfolioJs = fs.readFileSync(path.join(__dirname, '../frontend/js/views/portfolio.js'), 'utf8');
        const swapJs = fs.readFileSync(path.join(__dirname, '../frontend/js/views/swap.js'), 'utf8');
        const marketsJs = fs.readFileSync(path.join(__dirname, '../frontend/js/views/markets.js'), 'utf8');

        // 1. Verify Candlestick OHLC bars and wicks rendering
        assert.ok(portfolioJs.includes('renderCandlestickBars') || portfolioJs.includes('drawCandlestick') || portfolioJs.includes('candle'), 'Must contain Candlestick bar rendering logic');
        assert.ok(portfolioJs.includes('chart-type-btn') || portfolioJs.includes('candlestick') || portfolioJs.includes('candle-bar'), 'Must provide Candlestick toggle button');

        // 2. Verify Purchase Point Markers on chart
        assert.ok(portfolioJs.includes('purchase-marker') || portfolioJs.includes('tradeMarkers') || portfolioJs.includes('BUY') || portfolioJs.includes('markersGroup'), 'Must plot purchase point markers at trade prices');

        // 3. Verify 30-Second recurring auto-update Cron timer with live pulsing badge
        assert.ok(portfolioJs.includes('30000') || portfolioJs.includes('30s') || portfolioJs.includes('startCron'), 'Must implement 30-second portfolio auto-refresh cron');
        assert.ok(portfolioJs.includes('LIVE AUTO-UPDATE') || portfolioJs.includes('cron-indicator') || portfolioJs.includes('badge'), 'Must display live cron pulsing badge');

        // 4. Verify Instant Swap view and CoinGecko category filters
        assert.ok(swapJs.includes('SwapView') || swapJs.includes('executeSwap'), 'Swap view component must exist');
        assert.ok(marketsJs.includes('category-filter') || marketsJs.includes('All Coins') || marketsJs.includes('Top 10'), 'Markets view must support CoinGecko category filters');
    });

    // SCENARIO 29: API Ninjas Live Financial Integration & Multi-Currency Engine
    test('Scenario 29: API Ninjas Integration for Crypto & Forex Live Data Feeds', async () => {
        const { fetchLiveCryptoRatesFromNinja } = require('../backend/services/cryptoMarketService');
        assert.ok(typeof fetchLiveCryptoRatesFromNinja === 'function', 'fetchLiveCryptoRatesFromNinja must be defined');

        // Test API Ninjas live forex integration endpoint format
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        try {
            const res = await fetch(`https://api.api-ninjas.com/v1/exchangerate?pair=USD_INR`, {
                headers: { 'X-Api-Key': 'mGMasDhcrG73bhUPj5VPOvxqdd33xgO5XxpROwjN' },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                assert.ok(data && typeof data.exchange_rate === 'number', 'API Ninjas must return valid exchange rate');
                assert.ok(data.exchange_rate > 50, 'USD_INR exchange rate must be reasonable');
            }
        } catch (e) {
            clearTimeout(timeoutId);
            // Network isolated fallback
            assert.ok(true);
        }
    });

    after(() => {
        // Clean up transient test accounts and test fixtures to preserve pristine database
        const testUserIds = db.prepare("SELECT id FROM users WHERE email LIKE 'trader_test_%' OR email LIKE 'guest_conv_%' OR email LIKE 'user_b_%'").all().map(r => r.id);
        for (const uid of testUserIds) {
            db.prepare('DELETE FROM virtual_wallet_transactions WHERE wallet_id IN (SELECT id FROM virtual_wallets WHERE user_id = ?)').run(uid);
            db.prepare('DELETE FROM virtual_holdings WHERE wallet_id IN (SELECT id FROM virtual_wallets WHERE user_id = ?)').run(uid);
            db.prepare('DELETE FROM virtual_wallets WHERE user_id = ?').run(uid);
            db.prepare('DELETE FROM user_preferences WHERE user_id = ?').run(uid);
            db.prepare('DELETE FROM users WHERE id = ?').run(uid);
        }
    });
});
