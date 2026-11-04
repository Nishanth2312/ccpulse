/**
 * CCPulse Currency Conversion & Formatting Service
 * Underlying portfolio remains USD-based; display adapts dynamically.
 */
const Currency = {
    meta: {
        USD: { symbol: '$', name: 'US Dollar', decimals: 2, locale: 'en-US' },
        INR: { symbol: '₹', name: 'Indian Rupee', decimals: 2, locale: 'en-IN' },
        EUR: { symbol: '€', name: 'Euro', decimals: 2, locale: 'de-DE' },
        GBP: { symbol: '£', name: 'British Pound', decimals: 2, locale: 'en-GB' },
        AED: { symbol: 'د.إ', name: 'UAE Dirham', decimals: 2, locale: 'ar-AE' },
        JPY: { symbol: '¥', name: 'Japanese Yen', decimals: 0, locale: 'ja-JP' }
    },

    getActiveCode() {
        return (State.activeCurrency || 'USD').toUpperCase();
    },

    getRate(targetCurrency) {
        const code = (targetCurrency || this.getActiveCode()).toUpperCase();
        return State.rates[code] || 1.0;
    },

    convert(amountUsd, targetCurrency = null) {
        const code = (targetCurrency || this.getActiveCode()).toUpperCase();
        const rate = this.getRate(code);
        const meta = this.meta[code] || { decimals: 2 };
        const converted = Number(amountUsd) * rate;
        return Number(converted.toFixed(meta.decimals));
    },

    format(amountUsd, targetCurrency = null) {
        const code = (targetCurrency || this.getActiveCode()).toUpperCase();
        const meta = this.meta[code] || { symbol: '$', decimals: 2, locale: 'en-US' };
        const converted = this.convert(amountUsd, code);

        try {
            return new Intl.NumberFormat(meta.locale, {
                style: 'currency',
                currency: code,
                minimumFractionDigits: meta.decimals,
                maximumFractionDigits: meta.decimals
            }).format(converted);
        } catch (e) {
            return `${meta.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: meta.decimals, maximumFractionDigits: meta.decimals })}`;
        }
    },

    formatCryptoPrice(priceUsd, targetCurrency = null) {
        const code = (targetCurrency || this.getActiveCode()).toUpperCase();
        const meta = this.meta[code] || { symbol: '$', decimals: 2, locale: 'en-US' };
        const rate = this.getRate(code);
        const converted = Number(priceUsd) * rate;

        // If price is tiny (like Beldex at ~$0.04 or in other currencies)
        const decimals = converted < 1 ? 4 : (meta.decimals || 2);

        try {
            return new Intl.NumberFormat(meta.locale, {
                style: 'currency',
                currency: code,
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(converted);
        } catch (e) {
            return `${meta.symbol}${converted.toFixed(decimals)}`;
        }
    },

    async refreshRates() {
        const refreshBtn = document.getElementById('refresh-rates-btn');
        if (refreshBtn) refreshBtn.classList.add('fa-spin');

        try {
            // Simultaneously refresh live Forex rates and live CoinGecko cryptocurrency prices
            const [forexData, cryptoData] = await Promise.allSettled([
                API.currency.refreshRates(),
                API.cryptos.refreshRates()
            ]);

            if (forexData.status === 'fulfilled' && forexData.value) {
                State.setRates(forexData.value);
            }

            if (cryptoData.status === 'fulfilled' && cryptoData.value && cryptoData.value.cryptos) {
                State.setCryptos(cryptoData.value.cryptos);
            }

            const staleTag = document.getElementById('rate-stale-tag');
            if (staleTag) {
                if (forexData.status === 'fulfilled' && forexData.value && forexData.value.isStale) {
                    staleTag.classList.remove('hidden');
                } else {
                    staleTag.classList.add('hidden');
                }
            }

            return forexData.value || {};
        } catch (err) {
            console.warn('Failed to refresh live exchange rates:', err.message);
        } finally {
            if (refreshBtn) refreshBtn.classList.remove('fa-spin');
        }
    },

    async init() {
        // Sync currency select element
        const select = document.getElementById('currency-select');
        if (select) {
            select.value = this.getActiveCode();
            select.addEventListener('change', (e) => {
                State.setCurrency(e.target.value);
            });
        }

        const refreshBtn = document.getElementById('refresh-rates-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshRates());
        }

        // Fetch initial exchange status
        try {
            const status = await API.currency.getStatus();
            State.setRates(status);

            const staleTag = document.getElementById('rate-stale-tag');
            if (staleTag && status.isStale) {
                staleTag.classList.remove('hidden');
            }
        } catch (e) {
            console.warn('Initial rates fetch failed, using built-in defaults:', e.message);
        }
    }
};

window.Currency = Currency;

