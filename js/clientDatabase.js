/**
 * CCPulse In-Browser Client-Side Relational Database Engine (ClientDB)
 * 
 * Provides persistent, relational database storage for GitHub Pages (github.io)
 * and offline/standalone environments.
 * 
 * Implements full schema matching SQLite:
 * - users
 * - virtual_wallets
 * - virtual_wallet_transactions
 * - simulated_trades
 * - support_tickets
 * - ticket_replies
 * - system_settings
 * - audit_logs
 */
const ClientDB = (function() {
    const STORAGE_KEY = 'ccpulse_client_database_v2';

    // Default Seed Data (Preserved across sessions)
    const DEFAULT_DATA = {
        meta: {
            version: '2.0.0',
            engine: 'CCPulse In-Browser Client Database Engine',
            initializedAt: '2026-11-01T00:00:00.000Z',
            lastUpdated: new Date().toISOString()
        },
        users: [
            {
                id: 1,
                uuid: 'usr-admin-0001',
                email: 'admin@ccpulse.com',
                username: 'admin',
                fullName: 'CCPulse Chief Administrator',
                role: 'admin',
                password: 'Admin@CCPulse2026!',
                isActive: true,
                isSuspended: false,
                createdAt: '2026-11-01T08:00:00.000Z',
                lastLoginAt: '2026-11-10T12:00:00.000Z'
            },
            {
                id: 2,
                uuid: 'usr-trader-0002',
                email: 'trader@ccpulse.com',
                username: 'trader',
                fullName: 'Simulated Trader',
                role: 'user',
                password: 'Trader@123456',
                isActive: true,
                isSuspended: false,
                createdAt: '2026-11-02T10:15:00.000Z',
                lastLoginAt: '2026-11-10T14:30:00.000Z'
            }
        ],
        wallets: [
            {
                id: 1,
                userId: 1,
                balanceUsd: 15000.00,
                investedUsd: 0.00,
                welcomeBonusCredited: true,
                holdings: []
            },
            {
                id: 2,
                userId: 2,
                balanceUsd: 3850.50,
                investedUsd: 1149.50,
                welcomeBonusCredited: true,
                holdings: [
                    {
                        crypto_id: 1,
                        symbol: 'BTC',
                        name: 'Bitcoin',
                        quantity: 0.0125,
                        avg_buy_price_usd: 68500.00,
                        total_invested_usd: 856.25,
                        logo_url: './assets/coins/btc.svg'
                    },
                    {
                        crypto_id: 4,
                        symbol: 'BDX',
                        name: 'Beldex',
                        quantity: 4500,
                        avg_buy_price_usd: 0.065,
                        total_invested_usd: 293.25,
                        logo_url: './assets/coins/bdx.png'
                    }
                ]
            }
        ],
        wallet_transactions: [
            {
                id: 1,
                walletId: 1,
                userId: 1,
                type: 'WELCOME_BONUS',
                amountUsd: 5000.00,
                balanceBeforeUsd: 0,
                balanceAfterUsd: 5000.00,
                description: 'Guaranteed Welcome Bonus credited upon registration',
                createdAt: '2026-11-01T08:00:00.000Z'
            },
            {
                id: 2,
                walletId: 2,
                userId: 2,
                type: 'WELCOME_BONUS',
                amountUsd: 5000.00,
                balanceBeforeUsd: 0,
                balanceAfterUsd: 5000.00,
                description: 'Guaranteed Welcome Bonus credited upon registration',
                createdAt: '2026-11-02T10:15:00.000Z'
            }
        ],
        trades: [
            {
                id: 1,
                userId: 2,
                cryptoId: 1,
                symbol: 'BTC',
                name: 'Bitcoin',
                type: 'BUY',
                quantity: 0.0125,
                executionPriceUsd: 68500.00,
                totalCostUsd: 856.25,
                timestamp: '2026-11-03T11:20:00.000Z'
            },
            {
                id: 2,
                userId: 2,
                cryptoId: 4,
                symbol: 'BDX',
                name: 'Beldex',
                type: 'BUY',
                quantity: 4500,
                executionPriceUsd: 0.065,
                totalCostUsd: 293.25,
                timestamp: '2026-11-04T15:45:00.000Z'
            }
        ],
        support_tickets: [
            {
                id: 1,
                ticket_code: 'TICK-1001',
                user_id: 2,
                user_email: 'trader@ccpulse.com',
                user_name: 'Simulated Trader',
                subject: 'How are Beldex (BDX) real-time prices simulated?',
                category: 'Trading Simulator',
                priority: 'normal',
                status: 'resolved',
                description: 'Wanted to verify if the Beldex privacy coin order books use live CoinGecko feed or simulator matching.',
                created_at: '2026-11-03T09:15:00.000Z',
                updated_at: '2026-11-03T11:45:00.000Z',
                replies: [
                    {
                        id: 1,
                        sender_role: 'user',
                        sender_name: 'Simulated Trader',
                        message: 'Wanted to verify if the Beldex privacy coin order books use live CoinGecko feed or simulator matching.',
                        created_at: '2026-11-03T09:15:00.000Z'
                    },
                    {
                        id: 2,
                        sender_role: 'admin',
                        sender_name: 'CCPulse Support Team',
                        message: 'Hello! CCPulse connects directly to CoinGecko live prices with automatic resilient fallback to internal simulated depth when offline.',
                        created_at: '2026-11-03T11:45:00.000Z'
                    }
                ]
            },
            {
                id: 2,
                ticket_code: 'TICK-1002',
                user_id: 2,
                user_email: 'trader@ccpulse.com',
                user_name: 'Simulated Trader',
                subject: 'Currency exchange rate conversion inquiry (INR/USD)',
                category: 'Account & Wallet',
                priority: 'high',
                status: 'open',
                description: 'Need confirmation on how the USD $5,000 welcome bonus is recalculated when switching currency to Indian Rupee (INR).',
                created_at: '2026-11-04T14:20:00.000Z',
                updated_at: '2026-11-04T14:20:00.000Z',
                replies: [
                    {
                        id: 3,
                        sender_role: 'user',
                        sender_name: 'Simulated Trader',
                        message: 'Need confirmation on how the USD $5,000 welcome bonus is recalculated when switching currency to Indian Rupee (INR).',
                        created_at: '2026-11-04T14:20:00.000Z'
                    }
                ]
            }
        ],
        system_settings: {
            default_welcome_bonus: '5000.00',
            default_currency: 'USD',
            default_theme: 'dark',
            maintenance_mode: false,
            allow_guest_trading: true
        },
        audit_logs: [
            {
                id: 1,
                admin_username: 'admin',
                action: 'INITIALIZE_SYSTEM',
                entity_type: 'SYSTEM',
                details: 'In-browser persistent client database initialized successfully.',
                timestamp: '2026-11-01T00:00:00.000Z'
            }
        ]
    };

    let cache = null;

    function getStorage() {
        if (typeof window === 'undefined' || !window.localStorage) {
            return null;
        }
        return window.localStorage;
    }

    function loadDatabase() {
        if (cache) return cache;
        const storage = getStorage();
        if (storage) {
            try {
                const raw = storage.getItem(STORAGE_KEY);
                if (raw) {
                    cache = JSON.parse(raw);
                    // Migrate legacy support tickets if they exist
                    const legacyTicketsRaw = storage.getItem('ccpulse_support_tickets_v1');
                    if (legacyTicketsRaw) {
                        try {
                            const legacyTickets = JSON.parse(legacyTicketsRaw);
                            if (Array.isArray(legacyTickets) && legacyTickets.length > 0) {
                                for (const lt of legacyTickets) {
                                    if (!cache.support_tickets.find(t => t.ticket_code === (lt.ticket_code || lt.ticket_number))) {
                                        cache.support_tickets.push(lt);
                                    }
                                }
                            }
                        } catch (e) {}
                    }
                    return cache;
                }
            } catch (err) {
                console.warn('ClientDB: Error parsing database from localStorage, initializing fresh:', err);
            }
        }
        // Initialize default
        cache = JSON.parse(JSON.stringify(DEFAULT_DATA));
        saveDatabase();
        return cache;
    }

    function saveDatabase() {
        if (!cache) return;
        cache.meta.lastUpdated = new Date().toISOString();
        const storage = getStorage();
        if (storage) {
            try {
                storage.setItem(STORAGE_KEY, JSON.stringify(cache));
            } catch (err) {
                console.error('ClientDB: Failed to write database to localStorage:', err);
            }
        }
    }

    // Public API
    return {
        /**
         * Get full raw database snapshot
         */
        getSnapshot() {
            return JSON.parse(JSON.stringify(loadDatabase()));
        },

        // =====================================================================
        // USERS & AUTHENTICATION TABLE
        // =====================================================================
        users: {
            register({ full_name, fullName, username, email, password }) {
                const db = loadDatabase();
                const name = (fullName || full_name || '').trim();
                const uname = (username || '').trim().toLowerCase();
                const mail = (email || '').trim().toLowerCase();
                const pass = (password || '').trim();

                if (!name || !uname || !mail || !pass) {
                    throw new Error('Full name, username, email, and password are required.');
                }

                // Check for duplicates
                const existing = db.users.find(u => u.email.toLowerCase() === mail || u.username.toLowerCase() === uname);
                if (existing) {
                    if (existing.email.toLowerCase() === mail) {
                        throw new Error('An account with this email address already exists in the database.');
                    }
                    throw new Error('This username is already taken. Please choose another.');
                }

                // New user ID
                const nextId = db.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
                const newUser = {
                    id: nextId,
                    uuid: 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
                    email: mail,
                    username: uname,
                    fullName: name,
                    role: 'user',
                    password: pass,
                    isActive: true,
                    isSuspended: false,
                    createdAt: new Date().toISOString(),
                    lastLoginAt: new Date().toISOString()
                };

                db.users.push(newUser);

                // Create Virtual Wallet with guaranteed $5,000 USD
                const bonusAmount = parseFloat(db.system_settings.default_welcome_bonus || '5000.00');
                const nextWalletId = db.wallets.reduce((max, w) => Math.max(max, w.id), 0) + 1;
                const newWallet = {
                    id: nextWalletId,
                    userId: newUser.id,
                    balanceUsd: bonusAmount,
                    investedUsd: 0.00,
                    welcomeBonusCredited: true,
                    holdings: []
                };
                db.wallets.push(newWallet);

                // Log wallet bonus transaction
                const nextTxId = db.wallet_transactions.reduce((max, tx) => Math.max(max, tx.id), 0) + 1;
                db.wallet_transactions.push({
                    id: nextTxId,
                    walletId: newWallet.id,
                    userId: newUser.id,
                    type: 'WELCOME_BONUS',
                    amountUsd: bonusAmount,
                    balanceBeforeUsd: 0,
                    balanceAfterUsd: bonusAmount,
                    description: 'Guaranteed Welcome Bonus credited upon registration',
                    createdAt: new Date().toISOString()
                });

                saveDatabase();

                const token = `ccpulse_token_uid_${newUser.id}_${Date.now()}`;
                return {
                    success: true,
                    user: newUser,
                    token,
                    wallet: {
                        availableCashUsd: newWallet.balanceUsd,
                        totalInvestedUsd: 0,
                        totalPortfolioValueUsd: newWallet.balanceUsd,
                        holdings: []
                    },
                    welcomeBonusCredited: true
                };
            },

            login({ email, username, password }) {
                const db = loadDatabase();
                const identifier = (email || username || '').trim().toLowerCase();
                const pass = (password || '').trim();

                const user = db.users.find(u => 
                    u.email.toLowerCase() === identifier || 
                    u.username.toLowerCase() === identifier
                );

                if (!user) {
                    throw new Error('Invalid email or password.');
                }

                if (user.password !== pass) {
                    throw new Error('Invalid email or password.');
                }

                if (user.isSuspended) {
                    throw new Error('This account has been suspended by the administrator.');
                }

                user.lastLoginAt = new Date().toISOString();

                // Get or create wallet
                let wallet = db.wallets.find(w => w.userId === user.id);
                if (!wallet) {
                    wallet = {
                        id: db.wallets.length + 1,
                        userId: user.id,
                        balanceUsd: 5000.00,
                        investedUsd: 0.00,
                        welcomeBonusCredited: true,
                        holdings: []
                    };
                    db.wallets.push(wallet);
                }

                saveDatabase();

                const token = `ccpulse_token_uid_${user.id}_${Date.now()}`;
                return {
                    success: true,
                    user,
                    token,
                    wallet: {
                        availableCashUsd: wallet.balanceUsd,
                        totalInvestedUsd: wallet.investedUsd,
                        totalPortfolioValueUsd: wallet.balanceUsd + wallet.investedUsd,
                        holdings: wallet.holdings || []
                    },
                    welcomeBonusCredited: wallet.welcomeBonusCredited
                };
            },

            getById(id) {
                const db = loadDatabase();
                return db.users.find(u => u.id === Number(id)) || null;
            },

            getByToken(token) {
                if (!token) return null;
                const db = loadDatabase();
                // Match token pattern or fallback for legacy tokens
                if (token === 'gh-pages-admin-jwt') {
                    return db.users.find(u => u.role === 'admin') || db.users[0];
                }
                if (token === 'gh-pages-trader-jwt' || token === 'gh-pages-reg-jwt') {
                    return db.users.find(u => u.role === 'user') || db.users[1];
                }
                const match = token.match(/ccpulse_token_uid_(\d+)_/);
                if (match) {
                    const uid = parseInt(match[1], 10);
                    return db.users.find(u => u.id === uid) || null;
                }
                return null;
            },

            getAll() {
                const db = loadDatabase();
                return db.users.map(u => {
                    const w = db.wallets.find(wallet => wallet.userId === u.id);
                    return {
                        id: u.id,
                        uuid: u.uuid,
                        username: u.username,
                        email: u.email,
                        fullName: u.fullName,
                        role: u.role,
                        isActive: Boolean(u.isActive),
                        isSuspended: Boolean(u.isSuspended),
                        createdAt: u.createdAt,
                        lastLoginAt: u.lastLoginAt,
                        availableCashUsd: w ? w.balanceUsd : 5000.00,
                        holdingsCount: w && w.holdings ? w.holdings.length : 0
                    };
                });
            },

            updateStatus(id, { isActive, isSuspended }) {
                const db = loadDatabase();
                const user = db.users.find(u => u.id === Number(id));
                if (!user) throw new Error('User not found');
                if (isActive !== undefined) user.isActive = Boolean(isActive);
                if (isSuspended !== undefined) user.isSuspended = Boolean(isSuspended);
                saveDatabase();
                return { success: true, user };
            },

            resetPassword(id, newPassword) {
                const db = loadDatabase();
                const user = db.users.find(u => u.id === Number(id));
                if (!user) throw new Error('User not found');
                user.password = newPassword;
                saveDatabase();
                return { success: true };
            }
        },

        // =====================================================================
        // VIRTUAL WALLETS & HOLDINGS TABLE
        // =====================================================================
        wallets: {
            getByUserId(userId) {
                const db = loadDatabase();
                const wallet = db.wallets.find(w => w.userId === Number(userId));
                if (!wallet) return null;
                return {
                    id: wallet.id,
                    userId: wallet.userId,
                    availableCashUsd: wallet.balanceUsd,
                    totalInvestedUsd: wallet.investedUsd,
                    totalPortfolioValueUsd: wallet.balanceUsd + wallet.investedUsd,
                    holdings: wallet.holdings || []
                };
            },

            adjustBalance(userId, deltaUsd, reason, type = 'ADMIN_ADJUST') {
                const db = loadDatabase();
                const wallet = db.wallets.find(w => w.userId === Number(userId));
                if (!wallet) throw new Error('Wallet not found');

                const before = wallet.balanceUsd;
                wallet.balanceUsd = Math.max(0, wallet.balanceUsd + deltaUsd);
                const after = wallet.balanceUsd;

                db.wallet_transactions.push({
                    id: db.wallet_transactions.length + 1,
                    walletId: wallet.id,
                    userId: Number(userId),
                    type,
                    amountUsd: Math.abs(deltaUsd),
                    balanceBeforeUsd: before,
                    balanceAfterUsd: after,
                    description: reason || 'Balance adjustment',
                    createdAt: new Date().toISOString()
                });

                saveDatabase();
                return wallet;
            }
        },

        // =====================================================================
        // SIMULATED TRADES TABLE
        // =====================================================================
        trades: {
            execute({ userId, crypto, type, quantity, priceUsd }) {
                const db = loadDatabase();
                const uid = Number(userId);
                let wallet = db.wallets.find(w => w.userId === uid);

                if (!wallet) {
                    wallet = {
                        id: db.wallets.length + 1,
                        userId: uid,
                        balanceUsd: 5000.00,
                        investedUsd: 0.00,
                        welcomeBonusCredited: true,
                        holdings: []
                    };
                    db.wallets.push(wallet);
                }

                const qty = parseFloat(quantity);
                const price = parseFloat(priceUsd);
                const totalCostUsd = qty * price;

                if (type === 'BUY') {
                    if (wallet.balanceUsd < totalCostUsd) {
                        throw new Error(`Insufficient virtual cash. Required: $${totalCostUsd.toFixed(2)}, Available: $${wallet.balanceUsd.toFixed(2)} USD.`);
                    }
                    wallet.balanceUsd -= totalCostUsd;

                    const existing = (wallet.holdings || []).find(h => h.symbol === crypto.symbol);
                    if (existing) {
                        const newQty = existing.quantity + qty;
                        const newCost = existing.total_invested_usd + totalCostUsd;
                        existing.quantity = newQty;
                        existing.avg_buy_price_usd = newCost / newQty;
                        existing.total_invested_usd = newCost;
                    } else {
                        if (!wallet.holdings) wallet.holdings = [];
                        wallet.holdings.push({
                            crypto_id: crypto.id,
                            symbol: crypto.symbol,
                            name: crypto.name,
                            quantity: qty,
                            avg_buy_price_usd: price,
                            total_invested_usd: totalCostUsd,
                            logo_url: crypto.logo_url
                        });
                    }
                } else if (type === 'SELL') {
                    const existing = (wallet.holdings || []).find(h => h.symbol === crypto.symbol);
                    if (!existing || existing.quantity < qty) {
                        const available = existing ? existing.quantity : 0;
                        throw new Error(`Insufficient ${crypto.symbol} balance. Trying to sell: ${qty}, Available: ${available}.`);
                    }

                    wallet.balanceUsd += totalCostUsd;
                    existing.quantity -= qty;
                    existing.total_invested_usd = Math.max(0, existing.quantity * existing.avg_buy_price_usd);

                    // Remove if zeroed out
                    if (existing.quantity <= 0.00000001) {
                        wallet.holdings = wallet.holdings.filter(h => h.symbol !== crypto.symbol);
                    }
                } else {
                    throw new Error('Invalid trade type: ' + type);
                }

                // Recalculate total invested
                wallet.investedUsd = (wallet.holdings || []).reduce((sum, h) => sum + (h.total_invested_usd || 0), 0);

                const newTrade = {
                    id: db.trades.length + 1,
                    userId: uid,
                    cryptoId: crypto.id,
                    symbol: crypto.symbol,
                    name: crypto.name,
                    type,
                    quantity: qty,
                    executionPriceUsd: price,
                    totalCostUsd,
                    timestamp: new Date().toISOString()
                };
                db.trades.push(newTrade);

                saveDatabase();

                return {
                    success: true,
                    trade: newTrade,
                    wallet: {
                        availableCashUsd: wallet.balanceUsd,
                        totalInvestedUsd: wallet.investedUsd,
                        totalPortfolioValueUsd: wallet.balanceUsd + wallet.investedUsd,
                        holdings: wallet.holdings
                    }
                };
            },

            getByUserId(userId) {
                const db = loadDatabase();
                return db.trades.filter(t => t.userId === Number(userId)).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            },

            getAll() {
                const db = loadDatabase();
                return [...db.trades].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            }
        },

        // =====================================================================
        // SUPPORT TICKETS & REPLIES TABLE
        // =====================================================================
        tickets: {
            create({ userId, userEmail, userName, subject, category, priority, description }) {
                const db = loadDatabase();
                const code = 'TICK-' + Math.floor(1000 + Math.random() * 9000);
                const nextId = db.support_tickets.reduce((max, t) => Math.max(max, t.id), 0) + 1;

                const newTicket = {
                    id: nextId,
                    ticket_code: code,
                    user_id: userId ? Number(userId) : null,
                    user_email: userEmail || 'trader@ccpulse.com',
                    user_name: userName || 'Trader',
                    subject: subject || 'Support Request',
                    category: category || 'General Inquiry',
                    priority: priority || 'normal',
                    status: 'open',
                    description: description || '',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    replies: [
                        {
                            id: 1,
                            sender_role: 'user',
                            sender_name: userName || 'Trader',
                            message: description || '',
                            created_at: new Date().toISOString()
                        }
                    ]
                };

                db.support_tickets.unshift(newTicket);
                saveDatabase();
                return { success: true, ticket: newTicket };
            },

            getAll(filter = {}) {
                const db = loadDatabase();
                let list = [...db.support_tickets];
                if (filter.userId) {
                    list = list.filter(t => t.user_id === Number(filter.userId) || t.user_email === filter.userEmail);
                }
                if (filter.status && filter.status !== 'all') {
                    list = list.filter(t => t.status === filter.status);
                }
                return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            },

            getById(id) {
                const db = loadDatabase();
                return db.support_tickets.find(t => t.id === Number(id) || t.ticket_code === id) || null;
            },

            updateStatus(id, status) {
                const db = loadDatabase();
                const ticket = db.support_tickets.find(t => t.id === Number(id) || t.ticket_code === id);
                if (!ticket) throw new Error('Ticket not found');
                ticket.status = status;
                ticket.updated_at = new Date().toISOString();
                saveDatabase();
                return { success: true, ticket };
            },

            addReply(ticketId, { senderName, senderRole, message }) {
                const db = loadDatabase();
                const ticket = db.support_tickets.find(t => t.id === Number(ticketId) || t.ticket_code === ticketId);
                if (!ticket) throw new Error('Ticket not found');

                if (!ticket.replies) ticket.replies = [];
                const nextReplyId = ticket.replies.reduce((max, r) => Math.max(max, r.id), 0) + 1;
                const newReply = {
                    id: nextReplyId,
                    sender_role: senderRole || 'user',
                    sender_name: senderName || (senderRole === 'admin' ? 'CCPulse Support' : 'Trader'),
                    message: message || '',
                    created_at: new Date().toISOString()
                };

                ticket.replies.push(newReply);
                ticket.updated_at = new Date().toISOString();
                saveDatabase();
                return { success: true, reply: newReply, ticket };
            }
        },

        // =====================================================================
        // DAILY ANALYTICS GENERATOR
        // =====================================================================
        analytics: {
            getDaily(range = '30d') {
                const db = loadDatabase();
                const days = range === 'today' ? 1 : (range === '7d' ? 7 : (range === '14d' ? 14 : (range === '30d' ? 30 : 60)));
                const rows = [];
                const now = new Date();

                // Compute real registrations per date
                const regMap = {};
                for (const u of db.users) {
                    const dateStr = u.createdAt ? u.createdAt.substring(0, 10) : '2026-11-01';
                    regMap[dateStr] = (regMap[dateStr] || 0) + 1;
                }

                // Compute real trade volume per date
                const tradeMap = {};
                for (const t of db.trades) {
                    const dateStr = t.timestamp ? t.timestamp.substring(0, 10) : '2026-11-01';
                    if (!tradeMap[dateStr]) tradeMap[dateStr] = { count: 0, volume: 0, users: new Set() };
                    tradeMap[dateStr].count += 1;
                    tradeMap[dateStr].volume += (t.totalCostUsd || 0);
                    tradeMap[dateStr].users.add(t.userId);
                }

                for (let i = 0; i < days; i++) {
                    const d = new Date(now.getTime() - i * 86400000);
                    const dateKey = d.toISOString().split('T')[0];
                    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

                    const realRegs = regMap[dateKey] || 0;
                    const realTrades = tradeMap[dateKey] ? tradeMap[dateKey].count : 0;
                    const realVol = tradeMap[dateKey] ? tradeMap[dateKey].volume : 0;
                    const realActive = tradeMap[dateKey] ? tradeMap[dateKey].users.size : 0;

                    // Simulated base so historical graphs look vibrant
                    const seed = (d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate()) % 100;
                    const simRegs = Math.max(1, (seed % 14) + 3);
                    const simTrades = (seed * 3) % 45 + 12;
                    const simVol = ((seed * 850) % 35000) + 5400;

                    const totalRegs = realRegs + (i > 2 ? simRegs : (realRegs || 1));
                    const totalTrades = realTrades + (i > 2 ? simTrades : (realTrades || 2));
                    const totalVolume = Number((realVol + (i > 2 ? simVol : 1500)).toFixed(2));
                    const activeTraders = Math.max(1, realActive + (i > 2 ? Math.floor(simTrades * 0.4) : 1));
                    const bonusUsd = totalRegs * 5000;
                    const ticketsCount = (seed % 4) + (realRegs > 0 ? 1 : 0);

                    rows.push({
                        date: dateKey,
                        dayName: dayName,
                        registrations: totalRegs,
                        userRegistrations: totalRegs,
                        newRegistrations: totalRegs,
                        activeUsers: activeTraders,
                        activeTraders: activeTraders,
                        tradesCount: totalTrades,
                        totalTrades: totalTrades,
                        tradingVolumeUsd: totalVolume,
                        welcomeBonusesDistributedUsd: bonusUsd,
                        bonusDisbursedUsd: bonusUsd,
                        supportTickets: ticketsCount,
                        supportTicketsRaised: ticketsCount
                    });
                }

                const summary = rows.reduce((acc, r) => {
                    acc.totalRegistrationsInPeriod += r.registrations;
                    acc.totalTradesInPeriod += r.tradesCount;
                    acc.totalVolumeInPeriod += r.tradingVolumeUsd;
                    acc.totalBonusUsd += r.bonusDisbursedUsd;
                    acc.totalTicketsInPeriod += r.supportTickets;
                    return acc;
                }, { totalRegistrationsInPeriod: 0, totalTradesInPeriod: 0, totalVolumeInPeriod: 0, totalBonusUsd: 0, totalTicketsInPeriod: 0 });

                summary.avgDailyActiveUsers = Math.round(rows.reduce((sum, r) => sum + r.activeUsers, 0) / (rows.length || 1));
                summary.totalVolumeInPeriod = Number(summary.totalVolumeInPeriod.toFixed(2));

                return {
                    success: true,
                    range,
                    aggregates: summary,
                    summary,
                    dailyTimeline: rows,
                    dailyBreakdown: rows,
                    lastUpdated: new Date().toISOString()
                };
            }
        },

        // =====================================================================
        // BACKUP & RESET CAPABILITIES
        // =====================================================================
        exportJSON() {
            return JSON.stringify(loadDatabase(), null, 2);
        },

        importJSON(jsonString) {
            try {
                const parsed = JSON.parse(jsonString);
                if (!parsed.users || !parsed.wallets) {
                    throw new Error('Invalid database format. Missing users or wallets collection.');
                }
                cache = parsed;
                saveDatabase();
                return { success: true, countUsers: cache.users.length };
            } catch (err) {
                throw new Error('Failed to import database: ' + err.message);
            }
        },

        resetToDefault() {
            cache = JSON.parse(JSON.stringify(DEFAULT_DATA));
            saveDatabase();
            return { success: true };
        }
    };
})();

// Export for Node.js test environment if running tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClientDB;
}
