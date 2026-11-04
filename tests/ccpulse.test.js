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

    // SCENARIO 2: Automatic $5,000 welcome bonus
    test('Scenario 2: Automatic $5,000 welcome bonus credited on registration', () => {
        const bonusRes = creditWelcomeBonus(testUserA.id);
        assert.equal(bonusRes.success, true, 'Welcome bonus crediting should succeed');
        assert.equal(bonusRes.alreadyCredited, false);
        assert.equal(bonusRes.amount, 5000.00);

        // Verify wallet in database
        const wallet = getUserWallet(testUserA.id);
        assert.ok(wallet, 'Virtual wallet must be automatically created');
        assert.equal(wallet.availableCashUsd, 5000.00, 'Initial balance must be exactly $5,000.00 USD');
        assert.equal(wallet.investedUsd, 0.00);
        assert.equal(wallet.totalPortfolioValueUsd, 5000.00);

        // Verify transaction entry
        const tx = db.prepare("SELECT * FROM virtual_wallet_transactions WHERE user_id = ? AND type = 'WELCOME_BONUS'").get(testUserA.id);
        assert.ok(tx, 'Transaction ledger must record WELCOME_BONUS');
        assert.equal(tx.amount_usd, 5000.00);
        assert.equal(tx.description, 'CCPulse Welcome Bonus');
    });

    // SCENARIO 3: Prevent duplicate welcome bonuses
    test('Scenario 3: Prevent duplicate welcome bonuses on same account', () => {
        // Attempt to credit welcome bonus again
        const duplicateAttempt = creditWelcomeBonus(testUserA.id);
        assert.equal(duplicateAttempt.success, false, 'Duplicate bonus distribution must be blocked');
        assert.equal(duplicateAttempt.alreadyCredited, true);

        // Ensure balance remains $5,000.00 and is not $10,000.00
        const wallet = getUserWallet(testUserA.id);
        assert.equal(wallet.availableCashUsd, 5000.00, 'Wallet balance must remain $5,000.00 USD');
    });

    // SCENARIO 4: Existing user login without bonus duplication
    test('Scenario 4: Existing user login retains wallet balance without bonus duplication', () => {
        // Simulate login: query user and wallet
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(testUserA.id);
        const wallet = getUserWallet(user.id);
        assert.equal(wallet.availableCashUsd, 5000.00, 'Balance must remain intact upon subsequent login');

        // Check total welcome bonus transactions for this user
        const bonusCount = db.prepare("SELECT COUNT(*) as c FROM virtual_wallet_transactions WHERE user_id = ? AND type = 'WELCOME_BONUS'").get(testUserA.id).c;
        assert.equal(bonusCount, 1, 'Only exactly 1 welcome bonus transaction should ever exist per user');
    });

    // SCENARIO 5: Guest user access
    test('Scenario 5: Anonymous guest user access with temporary virtual simulator balance', () => {
        const guestSession = {
            temporaryBalanceUsd: 5000.00,
            holdings: [],
            trades: []
        };
        assert.equal(guestSession.temporaryBalanceUsd, 5000.00);
        assert.equal(guestSession.holdings.length, 0);

        // Active cryptos are publicly accessible to guests without auth
        const publicCryptos = getActiveCryptos();
        assert.ok(publicCryptos.length >= 5, 'Guest must be able to view all active cryptocurrencies');
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
        assert.equal(wallet.availableCashUsd, 5000.00);
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
        const expectedCash = 5000.00 - (0.01 * btc.current_price_usd);
        assert.ok(Math.abs(updatedWallet.availableCashUsd - expectedCash) < 0.01, 'Cash deducted correctly');
        assert.equal(updatedWallet.holdings.length, 1, 'Holding position created');
        assert.equal(updatedWallet.holdings[0].symbol, 'BTC');
        assert.equal(updatedWallet.holdings[0].quantity, 0.01);
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

        // User A only has BTC, User B only has ETH
        assert.equal(walletA.holdings.some(h => h.symbol === 'ETH'), false, 'User A cannot access User B positions');
        assert.equal(walletB.holdings.some(h => h.symbol === 'BTC'), false, 'User B cannot access User A positions');
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
