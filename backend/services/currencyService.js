const db = require('../database/db');

const NINJA_API_KEY = process.env.API_NINJAS_KEY || 'mGMasDhcrG73bhUPj5VPOvxqdd33xgO5XxpROwjN';

// In-memory cache + DB synchronization
let cachedRates = {};
let lastFetchedAt = null;
let isStale = false;
let lastProvider = 'API Ninjas / ForexLive (Cached)';

// Default fallback exchange rates (USD base)
const DEFAULT_FALLBACK_RATES = {
    USD: 1.0,
    INR: 85.25,
    EUR: 0.92,
    GBP: 0.79,
    AED: 3.67,
    JPY: 153.10
};

// Symbols & Decimals metadata
const CURRENCY_META = {
    USD: { symbol: '$', name: 'US Dollar', decimals: 2 },
    INR: { symbol: '₹', name: 'Indian Rupee', decimals: 2 },
    EUR: { symbol: '€', name: 'Euro', decimals: 2 },
    GBP: { symbol: '£', name: 'British Pound', decimals: 2 },
    AED: { symbol: 'د.إ', name: 'UAE Dirham', decimals: 2 },
    JPY: { symbol: '¥', name: 'Japanese Yen', decimals: 0 }
};

function loadRatesFromDb() {
    try {
        const rows = db.prepare('SELECT code, exchange_rate_to_usd, last_updated_at FROM supported_currencies WHERE is_active = 1').all();
        const rates = {};
        let latestTime = null;

        for (const row of rows) {
            rates[row.code] = Number(row.exchange_rate_to_usd);
            if (!latestTime || new Date(row.last_updated_at) > new Date(latestTime)) {
                latestTime = row.last_updated_at;
            }
        }

        cachedRates = { ...DEFAULT_FALLBACK_RATES, ...rates };
        lastFetchedAt = latestTime || new Date().toISOString();

        // Check staleness (if older than 60 mins)
        const ageMinutes = (Date.now() - new Date(lastFetchedAt).getTime()) / (1000 * 60);
        isStale = ageMinutes > 60;
    } catch (e) {
        cachedRates = { ...DEFAULT_FALLBACK_RATES };
        lastFetchedAt = new Date().toISOString();
        isStale = true;
    }
}

// Initial load
loadRatesFromDb();

/**
 * Fetch real-time exchange rates from API Ninjas or fallback Forex API with graceful degradation
 */
async function fetchLiveExchangeRates(manual = false) {
    // 1. Try API Ninjas first using configured API key
    try {
        const ninjaCurrencies = ['INR', 'EUR', 'GBP', 'AED', 'JPY'];
        const ninjaResults = {};

        await Promise.all(ninjaCurrencies.map(async code => {
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), 3500);
            try {
                const res = await fetch(`https://api.api-ninjas.com/v1/exchangerate?pair=USD_${code}`, {
                    headers: { 'X-Api-Key': NINJA_API_KEY },
                    signal: controller.signal
                });
                clearTimeout(tid);
                if (res.ok) {
                    const json = await res.json();
                    if (json && json.exchange_rate) {
                        ninjaResults[code] = Number(json.exchange_rate);
                    }
                }
            } catch (e) {
                clearTimeout(tid);
            }
        }));

        if (Object.keys(ninjaResults).length >= 2) {
            const now = new Date().toISOString();
            ninjaResults['USD'] = 1.0;

            const updateCur = db.prepare(`
                UPDATE supported_currencies
                SET exchange_rate_to_usd = ?, last_updated_at = ?
                WHERE code = ?
            `);
            const insertHistory = db.prepare(`
                INSERT INTO exchange_rates (base_currency, target_currency, rate, provider, is_stale)
                VALUES ('USD', ?, ?, 'API Ninjas', 0)
            `);

            db.transaction(() => {
                for (const [code, rate] of Object.entries(ninjaResults)) {
                    updateCur.run(rate, now, code);
                    insertHistory.run(code, rate);
                }
            })();

            cachedRates = { ...cachedRates, ...ninjaResults };
            lastFetchedAt = now;
            isStale = false;
            lastProvider = 'API Ninjas (Live Forex)';

            return {
                success: true,
                provider: lastProvider,
                rates: cachedRates,
                lastFetchedAt,
                isStale: false,
                message: 'Forex rates refreshed from API Ninjas.'
            };
        }
    } catch (e) {
        // Fall through to public OpenExchangeAPI
    }

    // 2. Fallback to open.er-api.com
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch('https://open.er-api.com/v6/latest/USD', {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Exchange rate provider returned status ${response.status}`);
        }

        const data = await response.json();
        if (!data || !data.rates) {
            throw new Error('Invalid exchange rate payload format');
        }

        const newRates = {};
        const now = new Date().toISOString();

        // Update database within transaction
        const updateCur = db.prepare(`
            UPDATE supported_currencies
            SET exchange_rate_to_usd = ?, last_updated_at = ?
            WHERE code = ?
        `);

        const insertHistory = db.prepare(`
            INSERT INTO exchange_rates (base_currency, target_currency, rate, provider, is_stale)
            VALUES ('USD', ?, ?, 'OpenExchangeAPI', 0)
        `);

        db.transaction(() => {
            for (const code of Object.keys(CURRENCY_META)) {
                if (data.rates[code]) {
                    const rate = Number(data.rates[code]);
                    newRates[code] = rate;
                    updateCur.run(rate, now, code);
                    insertHistory.run(code, rate);
                }
            }
        })();

        cachedRates = { ...cachedRates, ...newRates };
        lastFetchedAt = now;
        isStale = false;
        lastProvider = 'OpenExchangeAPI (Live)';

        return {
            success: true,
            provider: lastProvider,
            rates: cachedRates,
            lastFetchedAt,
            isStale: false,
            message: 'Rates successfully refreshed from live provider.'
        };
    } catch (err) {
        console.warn('Live Forex API fetch warning:', err.message, '- Falling back to cached database rates.');
        loadRatesFromDb();
        // If it's a manual refresh and API failed, mark stale but keep serving cached
        isStale = true;
        lastProvider = 'Offline Fallback / Database Cache';

        return {
            success: true, // Still success for client using fallback
            provider: lastProvider,
            rates: cachedRates,
            lastFetchedAt,
            isStale: true,
            warning: `Forex API unreachable (${err.message}). Serving cached backup rates.`
        };
    }
}

/**
 * Convert USD amount to target currency
 */
function convertFromUsd(amountUsd, targetCurrency = 'USD') {
    const code = (targetCurrency || 'USD').toUpperCase();
    const rate = cachedRates[code] || 1.0;
    const decimals = CURRENCY_META[code] ? CURRENCY_META[code].decimals : 2;
    const converted = Number(amountUsd) * rate;

    return {
        amountUsd: Number(amountUsd),
        targetCurrency: code,
        exchangeRate: rate,
        convertedAmount: Number(converted.toFixed(decimals)),
        formatted: formatCurrency(converted, code),
        isStale
    };
}

/**
 * Format currency with native internationalization
 */
function formatCurrency(amount, currencyCode = 'USD') {
    const code = (currencyCode || 'USD').toUpperCase();
    const meta = CURRENCY_META[code] || { symbol: '$', decimals: 2 };

    const localeMap = {
        USD: 'en-US',
        INR: 'en-IN',
        EUR: 'de-DE',
        GBP: 'en-GB',
        AED: 'ar-AE',
        JPY: 'ja-JP'
    };

    try {
        return new Intl.NumberFormat(localeMap[code] || 'en-US', {
            style: 'currency',
            currency: code,
            minimumFractionDigits: meta.decimals,
            maximumFractionDigits: meta.decimals
        }).format(amount);
    } catch (e) {
        return `${meta.symbol}${Number(amount).toFixed(meta.decimals)}`;
    }
}

function getSupportedCurrenciesList() {
    loadRatesFromDb();
    const rows = db.prepare('SELECT * FROM supported_currencies ORDER BY is_default DESC, code ASC').all();
    return rows.map(r => ({
        code: r.code,
        name: r.name,
        symbol: r.symbol,
        exchangeRateToUsd: Number(r.exchange_rate_to_usd),
        isActive: Boolean(r.is_active),
        isDefault: Boolean(r.is_default),
        decimalPlaces: r.decimal_places,
        lastUpdatedAt: r.last_updated_at,
        isStale
    }));
}

function getCurrencyStatus() {
    loadRatesFromDb();
    return {
        baseCurrency: 'USD',
        provider: lastProvider,
        lastUpdated: lastFetchedAt,
        isStale,
        rates: cachedRates,
        currencies: getSupportedCurrenciesList(),
        disclaimer: 'Currency conversions are for educational and simulation display purposes only.'
    };
}

// Background Forex rate auto-refresh every 30 minutes
let forexInterval = setInterval(() => {
    fetchLiveExchangeRates().catch(() => {});
}, 30 * 60 * 1000);
if (forexInterval.unref) {
    forexInterval.unref();
}

// Initial async fetch on load
fetchLiveExchangeRates().catch(() => {});

module.exports = {
    fetchLiveExchangeRates,
    convertFromUsd,
    formatCurrency,
    getSupportedCurrenciesList,
    getCurrencyStatus,
    CURRENCY_META,
    DEFAULT_FALLBACK_RATES
};

