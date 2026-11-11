/**
 * CCPulse Centralized Reactive Client State
 */
const State = {
    // Auth & Identity
    token: localStorage.getItem('ccpulse_jwt') || null,
    currentUser: null,
    isGuest: !localStorage.getItem('ccpulse_jwt'),
    guestSession: JSON.parse(localStorage.getItem('ccpulse_guest_session') || 'null') || {
        temporaryBalanceUsd: 10000.00,
        holdings: [
            {
                crypto_id: 1,
                symbol: 'BTC',
                name: 'Bitcoin',
                quantity: 1.0,
                avg_buy_price_usd: 73932.53,
                total_invested_usd: 73932.53,
                logo_url: './assets/coins/btc.svg'
            }
        ],
        trades: [
            {
                tradeRef: 'GUEST-WB-BTC-001',
                symbol: 'BTC',
                type: 'BUY',
                quantity: 1.0,
                priceUsd: 73932.53,
                totalValueUsd: 73932.53,
                date: new Date().toISOString()
            }
        ]
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
                temporaryBalanceUsd: 10000.00,
                holdings: [
                    {
                        crypto_id: 1,
                        symbol: 'BTC',
                        name: 'Bitcoin',
                        quantity: 1.0,
                        avg_buy_price_usd: 73932.53,
                        total_invested_usd: 73932.53,
                        logo_url: './assets/coins/btc.svg'
                    }
                ],
                trades: [
                    {
                        tradeRef: 'GUEST-WB-BTC-001',
                        symbol: 'BTC',
                        type: 'BUY',
                        quantity: 1.0,
                        priceUsd: 73932.53,
                        totalValueUsd: 73932.53,
                        date: new Date().toISOString()
                    }
                ]
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

    setCryptos(cryptos) {
        this.cryptos = cryptos || [];
        this.notify('cryptos');
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

    updateGuestSwap({ fromCrypto, toCrypto, fromQuantity, slippagePct = 0.005, networkFeePct = 0.0015, handlingFeePct = 0.0025 }) {
        const fromQty = parseFloat(fromQuantity);
        if (isNaN(fromQty) || fromQty <= 0) throw new Error('Please enter a valid swap quantity.');

        const existingFrom = (this.guestSession.holdings || []).find(h => h.symbol === fromCrypto.symbol);
        if (!existingFrom || existingFrom.quantity < fromQty) {
            const avail = existingFrom ? existingFrom.quantity : 0;
            throw new Error(`Insufficient ${fromCrypto.symbol} balance. Trying to swap: ${fromQty}, Available: ${avail}.`);
        }

        const fromPrice = fromCrypto.current_price_usd;
        const toPrice = toCrypto.current_price_usd;
        const grossValueUsd = fromQty * fromPrice;

        const networkFeeUsd = grossValueUsd * networkFeePct;
        const handlingFeeUsd = grossValueUsd * handlingFeePct;
        const netValueUsd = Math.max(0, grossValueUsd - networkFeeUsd - handlingFeeUsd);
        const toQuantityReceived = netValueUsd / toPrice;

        // Deduct from holding
        existingFrom.quantity -= fromQty;
        existingFrom.total_invested_usd = Math.max(0, existingFrom.quantity * existingFrom.avg_buy_price_usd);
        if (existingFrom.quantity <= 0.00000001) {
            this.guestSession.holdings = this.guestSession.holdings.filter(h => h.symbol !== fromCrypto.symbol);
        }

        // Add to destination holding
        if (!this.guestSession.holdings) this.guestSession.holdings = [];
        const existingTo = this.guestSession.holdings.find(h => h.symbol === toCrypto.symbol);
        if (existingTo) {
            const newTotalQty = existingTo.quantity + toQuantityReceived;
            const newTotalCost = existingTo.total_invested_usd + netValueUsd;
            existingTo.quantity = newTotalQty;
            existingTo.avg_buy_price_usd = newTotalCost / newTotalQty;
            existingTo.total_invested_usd = newTotalCost;
        } else {
            this.guestSession.holdings.push({
                crypto_id: toCrypto.id,
                symbol: toCrypto.symbol,
                name: toCrypto.name,
                logo_url: toCrypto.logo_url,
                quantity: toQuantityReceived,
                avg_buy_price_usd: toPrice,
                total_invested_usd: netValueUsd
            });
        }

        const swapRef = `GUEST-SWAP-${Date.now()}`;
        if (!this.guestSession.trades) this.guestSession.trades = [];
        this.guestSession.trades.unshift({
            tradeRef: swapRef,
            symbol: `${fromCrypto.symbol} → ${toCrypto.symbol}`,
            type: 'SWAP',
            quantity: toQuantityReceived,
            fromQuantity: fromQty,
            fromSymbol: fromCrypto.symbol,
            toSymbol: toCrypto.symbol,
            priceUsd: toPrice,
            totalValueUsd: netValueUsd,
            networkFeeUsd,
            handlingFeeUsd,
            date: new Date().toISOString()
        });

        localStorage.setItem('ccpulse_guest_session', JSON.stringify(this.guestSession));
        this.notify('wallet');
        return {
            success: true,
            swapRef,
            fromSymbol: fromCrypto.symbol,
            toSymbol: toCrypto.symbol,
            fromQuantity: fromQty,
            toQuantityReceived,
            networkFeeUsd,
            handlingFeeUsd,
            wallet: this.guestSession
        };
    },

    getCoinLogo(crypto) {
        if (!crypto) return './assets/coins/generic.svg';
        const sym = (crypto.symbol || '').toLowerCase();
        const localSvgs = {
            btc: './assets/coins/btc.svg',
            eth: './assets/coins/eth.svg',
            xmr: './assets/coins/xmr.svg',
            bdx: './assets/coins/bdx.png',
            sol: './assets/coins/sol.svg',
            usdt: './assets/coins/usdt.svg',
            bnb: './assets/coins/bnb.svg',
            xrp: './assets/coins/xrp.svg',
            doge: './assets/coins/doge.svg',
            ada: './assets/coins/ada.svg',
            avax: './assets/coins/avax.svg',
            link: './assets/coins/link.svg',
            dot: './assets/coins/dot.svg',
            trx: './assets/coins/trx.svg',
            shib: './assets/coins/shib.svg',
            pepe: './assets/coins/pepe.svg',
            sui: './assets/coins/sui.svg',
            near: './assets/coins/near.svg',
            ltc: './assets/coins/ltc.svg',
            uni: './assets/coins/uni.svg'
        };
        if (localSvgs[sym]) return localSvgs[sym];
        if (crypto.logo_url && crypto.logo_url.startsWith('/assets/')) return '.' + crypto.logo_url;
        if (crypto.logo_url && crypto.logo_url.startsWith('./assets/')) return crypto.logo_url;
        if (crypto.logo_url && crypto.logo_url.startsWith('http') && !crypto.logo_url.includes('missing.png') && !crypto.logo_url.includes('example.com')) {
            return crypto.logo_url;
        }
        return './assets/coins/generic.svg';
    }
};

window.State = State;

