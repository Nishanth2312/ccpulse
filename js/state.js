/**
 * CCPulse Centralized Reactive Client State
 */
const State = {
    // Auth & Identity
    token: localStorage.getItem('ccpulse_jwt') || null,
    currentUser: null,
    isGuest: !localStorage.getItem('ccpulse_jwt'),
    guestSession: JSON.parse(localStorage.getItem('ccpulse_guest_session') || 'null') || {
        temporaryBalanceUsd: 5000.00,
        holdings: [],
        trades: []
    },

    // User's permanent wallet (when authenticated)
    wallet: null,

    // App Preferences
    theme: localStorage.getItem('ccpulse_theme') || 'dark',
    activeCurrency: localStorage.getItem('ccpulse_currency') || 'USD',

    // Exchange Rates
    rates: {
        USD: 1.0,
        INR: 85.25,
        EUR: 0.92,
        GBP: 0.79,
        AED: 3.67,
        JPY: 153.10
    },
    ratesLastUpdated: null,
    isRatesStale: false,
    ratesProvider: 'ForexLiveEngine',

    // Data Cache
    cryptos: [],
    watchlist: [],
    notifications: [],
    unreadNotificationsCount: 0,

    // Current Active Route / View
    currentRoute: 'dashboard',
    routeParams: {},

    // Event Subscriptions
    listeners: [],

    subscribe(fn) {
        this.listeners.push(fn);
        return () => {
            this.listeners = this.listeners.filter(l => l !== fn);
        };
    },

    notify(changeKey) {
        for (const listener of this.listeners) {
            try {
                listener(this, changeKey);
            } catch (e) {
                console.error('Error in state listener:', e);
            }
        }
    },

    setAuth(user, token, wallet) {
        this.currentUser = user;
        this.token = token;
        this.wallet = wallet;
        this.isGuest = false;

        if (token) {
            localStorage.setItem('ccpulse_jwt', token);
        } else {
            localStorage.removeItem('ccpulse_jwt');
        }

        this.notify('auth');
    },

    setGuest() {
        this.currentUser = null;
        this.token = null;
        this.wallet = null;
        this.isGuest = true;
        localStorage.removeItem('ccpulse_jwt');

        if (!this.guestSession) {
            this.guestSession = {
                temporaryBalanceUsd: 5000.00,
                holdings: [],
                trades: []
            };
        }
        localStorage.setItem('ccpulse_guest_session', JSON.stringify(this.guestSession));
        this.notify('auth');
    },

    logout() {
        this.setGuest();
        this.notify('logout');
    },

    setCurrency(code) {
        this.activeCurrency = code.toUpperCase();
        localStorage.setItem('ccpulse_currency', this.activeCurrency);
        this.notify('currency');
    },

    setTheme(theme) {
        this.theme = theme;
        localStorage.setItem('ccpulse_theme', theme);
        this.notify('theme');
    },

    setRates(data) {
        if (data.rates) this.rates = { ...this.rates, ...data.rates };
        if (data.lastUpdated) this.ratesLastUpdated = data.lastUpdated;
        this.isRatesStale = Boolean(data.isStale);
        if (data.provider) this.ratesProvider = data.provider;
        this.notify('rates');
    },

    updateGuestTrade({ type, crypto, quantity, priceUsd }) {
        const qty = parseFloat(quantity);
        const costUsd = qty * priceUsd;

        if (type === 'BUY') {
            if (this.guestSession.temporaryBalanceUsd < costUsd) {
                throw new Error(`Insufficient temporary balance. Need $${costUsd.toFixed(2)}, Available: $${this.guestSession.temporaryBalanceUsd.toFixed(2)} USD.`);
            }
            this.guestSession.temporaryBalanceUsd -= costUsd;

            const existing = this.guestSession.holdings.find(h => h.symbol === crypto.symbol);
            if (existing) {
                const newTotalQty = existing.quantity + qty;
                const newTotalCost = existing.total_invested_usd + costUsd;
                existing.quantity = newTotalQty;
                existing.avg_buy_price_usd = newTotalCost / newTotalQty;
                existing.total_invested_usd = newTotalCost;
            } else {
                this.guestSession.holdings.push({
                    crypto_id: crypto.id,
                    symbol: crypto.symbol,
                    name: crypto.name,
                    logo_url: crypto.logo_url,
                    quantity: qty,
                    avg_buy_price_usd: priceUsd,
                    total_invested_usd: costUsd
                });
            }
        } else {
            const existing = this.guestSession.holdings.find(h => h.symbol === crypto.symbol);
            if (!existing || existing.quantity < qty) {
                throw new Error(`Insufficient holding to sell.`);
            }
            const proceeds = qty * priceUsd;
            this.guestSession.temporaryBalanceUsd += proceeds;
            existing.quantity -= qty;
            existing.total_invested_usd = Math.max(0, existing.total_invested_usd - (existing.avg_buy_price_usd * qty));
            if (existing.quantity <= 0) {
                this.guestSession.holdings = this.guestSession.holdings.filter(h => h.symbol !== crypto.symbol);
            }
        }

        this.guestSession.trades.unshift({
            tradeRef: `GUEST-${type}-${Date.now()}`,
            symbol: crypto.symbol,
            type,
            quantity: qty,
            priceUsd,
            totalValueUsd: costUsd,
            date: new Date().toISOString()
        });

        localStorage.setItem('ccpulse_guest_session', JSON.stringify(this.guestSession));
        this.notify('wallet');
    },

    getCoinLogo(crypto) {
        if (!crypto) return '/assets/coins/generic.svg';
        const sym = (crypto.symbol || '').toLowerCase();
        const localSvgs = {
            btc: '/assets/coins/btc.svg',
            eth: '/assets/coins/eth.svg',
            xmr: '/assets/coins/xmr.svg',
            bdx: '/assets/coins/bdx.svg',
            sol: '/assets/coins/sol.svg'
        };
        if (localSvgs[sym]) return localSvgs[sym];
        if (crypto.logo_url && crypto.logo_url.startsWith('/assets/')) return crypto.logo_url;
        if (crypto.logo_url && crypto.logo_url.startsWith('http') && !crypto.logo_url.includes('missing.png') && !crypto.logo_url.includes('example.com')) {
            return crypto.logo_url;
        }
        return '/assets/coins/generic.svg';
    }
};

window.State = State;

