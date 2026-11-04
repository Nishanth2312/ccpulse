const db = require('../database/db');

/**
 * Get all active and visible cryptocurrencies
 */
function getActiveCryptos() {
    return db.prepare(`
        SELECT * FROM cryptocurrencies
        WHERE is_active = 1 AND is_visible = 1
        ORDER BY sort_order ASC, market_cap_usd DESC
    `).all();
}

/**
 * Get single crypto details and increment view count
 */
function getCryptoBySymbolOrSlug(identifier, incrementView = true) {
    const crypto = db.prepare(`
        SELECT * FROM cryptocurrencies
        WHERE (LOWER(symbol) = LOWER(?) OR LOWER(slug) = LOWER(?))
    `).get(identifier, identifier);

    if (crypto && incrementView) {
        db.prepare('UPDATE cryptocurrencies SET view_count = view_count + 1 WHERE id = ?').run(crypto.id);
        crypto.view_count += 1;
    }

    return crypto;
}

/**
 * Generate simulated realistic historical chart data points for any cryptocurrency
 */
function getHistoricalChartData(cryptoId, timeframe = '1D') {
    const crypto = db.prepare('SELECT current_price_usd, change_24h, symbol FROM cryptocurrencies WHERE id = ?').get(cryptoId);
    if (!crypto) return [];

    const basePrice = crypto.current_price_usd;
    let pointsCount = 24;
    let intervalMs = 60 * 60 * 1000; // 1 hour for 1D
    let volatility = 0.015;

    switch (timeframe) {
        case '1H':
            pointsCount = 60;
            intervalMs = 60 * 1000;
            volatility = 0.003;
            break;
        case '1D':
            pointsCount = 24;
            intervalMs = 60 * 60 * 1000;
            volatility = 0.012;
            break;
        case '1W':
            pointsCount = 28;
            intervalMs = 6 * 60 * 60 * 1000;
            volatility = 0.025;
            break;
        case '1M':
            pointsCount = 30;
            intervalMs = 24 * 60 * 60 * 1000;
            volatility = 0.04;
            break;
        case '1Y':
            pointsCount = 52;
            intervalMs = 7 * 24 * 60 * 60 * 1000;
            volatility = 0.08;
            break;
    }

    const now = Date.now();
    const data = [];
    let currentWalk = basePrice * (1 - (crypto.change_24h / 100));

    // Seeded random walk ending at current_price_usd
    for (let i = pointsCount - 1; i >= 0; i--) {
        const time = new Date(now - i * intervalMs).toISOString();
        if (i === 0) {
            data.push({ timestamp: time, price: basePrice });
        } else {
            const shock = (Math.random() - 0.48) * volatility * currentWalk;
            currentWalk = Math.max(currentWalk * 0.5, currentWalk + shock);
            data.push({
                timestamp: time,
                price: Number(currentWalk.toFixed(basePrice < 1 ? 4 : 2))
            });
        }
    }

    return data;
}

/**
 * Generate synthetic order book depth (Bids and Asks) around current price
 */
function getOrderBook(cryptoId) {
    const crypto = db.prepare('SELECT current_price_usd FROM cryptocurrencies WHERE id = ?').get(cryptoId);
    if (!crypto) return { bids: [], asks: [] };

    const mid = crypto.current_price_usd;
    const bids = [];
    const asks = [];

    for (let i = 1; i <= 6; i++) {
        const bidPrice = mid * (1 - 0.0015 * i);
        const askPrice = mid * (1 + 0.0015 * i);
        const qty = Number(((Math.random() * 2 + 0.2) * (mid > 1000 ? 0.5 : 50)).toFixed(4));

        bids.push({
            price: Number(bidPrice.toFixed(mid < 1 ? 4 : 2)),
            quantity: qty,
            total: Number((bidPrice * qty).toFixed(2))
        });

        asks.push({
            price: Number(askPrice.toFixed(mid < 1 ? 4 : 2)),
            quantity: qty,
            total: Number((askPrice * qty).toFixed(2))
        });
    }

    return { bids, asks };
}

// Canonical mapping between cryptocurrency symbols/slugs and CoinGecko IDs
const COINGECKO_SLUG_MAP = {
    'btc': 'bitcoin',
    'bitcoin': 'bitcoin',
    'eth': 'ethereum',
    'ethereum': 'ethereum',
    'xmr': 'monero',
    'monero': 'monero',
    'bdx': 'beldex',
    'beldex': 'beldex',
    'sol': 'solana',
    'solana': 'solana',
    'doge': 'dogecoin',
    'dogecoin': 'dogecoin',
    'ada': 'cardano',
    'cardano': 'cardano',
    'xrp': 'ripple',
    'ripple': 'ripple',
    'bnb': 'binancecoin',
    'binancecoin': 'binancecoin'
};

let lastCryptoFetchTime = null;
let isCryptoFeedLive = false;
let cryptoFeedError = null;
let activeProvider = 'CoinGecko Live API';

/**
 * Fetch real-time cryptocurrency market data directly from CoinGecko API over the internet
 */
async function fetchLiveCryptoRatesFromCoinGecko(manual = false) {
    try {
        const cryptos = db.prepare('SELECT id, symbol, slug, current_price_usd, high_24h, low_24h FROM cryptocurrencies WHERE is_active = 1').all();
        if (cryptos.length === 0) {
            return { success: true, updated: 0, isLive: isCryptoFeedLive, provider: activeProvider };
        }

        // Map CoinGecko IDs to DB rows
        const idMap = {};
        for (const c of cryptos) {
            const symKey = (c.symbol || '').toLowerCase();
            const slugKey = (c.slug || '').toLowerCase();
            const geckoId = COINGECKO_SLUG_MAP[slugKey] || COINGECKO_SLUG_MAP[symKey] || slugKey;
            if (geckoId) {
                idMap[geckoId] = c;
            }
        }

        const ids = Object.keys(idMap).join(',');
        if (!ids) {
            return { success: true, updated: 0, isLive: isCryptoFeedLive, provider: activeProvider };
        }

        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'CCPulse-Simulation-Lab/2.0'
            }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`CoinGecko HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const updateStmt = db.prepare(`
            UPDATE cryptocurrencies
            SET current_price_usd = ?,
                change_24h = ?,
                volume_24h = ?,
                market_cap_usd = ?,
                high_24h = ?,
                low_24h = ?,
                market_data_source = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);

        let updatedCount = 0;
        db.transaction(() => {
            for (const [geckoId, market] of Object.entries(data)) {
                const c = idMap[geckoId];
                if (c && market && typeof market.usd === 'number') {
                    const price = market.usd;
                    const change = Number((market.usd_24h_change || 0).toFixed(2));
                    const volume = Math.round(market.usd_24h_vol || 0);
                    const mcap = Math.round(market.usd_market_cap || 0);
                    const high = Math.max(c.high_24h || 0, price * (1 + Math.max(0, change / 100)));
                    const low = Math.min(c.low_24h > 0 ? c.low_24h : price * 0.98, price * (1 - Math.abs(change / 100)));

                    updateStmt.run(price, change, volume, mcap, high, low, 'CoinGecko Live API', c.id);
                    updatedCount++;
                }
            }
        })();

        lastCryptoFetchTime = new Date().toISOString();
        isCryptoFeedLive = true;
        cryptoFeedError = null;
        activeProvider = 'CoinGecko Live API';

        return {
            success: true,
            updated: updatedCount,
            provider: activeProvider,
            lastUpdated: lastCryptoFetchTime,
            isLive: true
        };
    } catch (err) {
        console.warn('CoinGecko Live API Warning:', err.message, '- Using cached database prices.');
        isCryptoFeedLive = false;
        cryptoFeedError = err.message;
        activeProvider = 'Cached Database (Offline Fallback)';

        return {
            success: true,
            updated: 0,
            provider: activeProvider,
            lastUpdated: lastCryptoFetchTime || new Date().toISOString(),
            isLive: false,
            warning: `CoinGecko live feed unavailable (${err.message}). Retaining cached market data.`
        };
    }
}

/**
 * Return live feed status and metadata
 */
function getCryptoFeedStatus() {
    return {
        isLive: isCryptoFeedLive,
        provider: activeProvider,
        lastUpdated: lastCryptoFetchTime,
        error: cryptoFeedError
    };
}

/**
 * Periodic market data tick simulation to produce realistic live fluctuation between CoinGecko polls
 */
function simulateMarketTick() {
    try {
        const cryptos = db.prepare('SELECT id, current_price_usd, change_24h, high_24h, low_24h FROM cryptocurrencies WHERE is_active = 1').all();
        const updateStmt = db.prepare(`
            UPDATE cryptocurrencies
            SET current_price_usd = ?, change_24h = ?, high_24h = ?, low_24h = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);

        db.transaction(() => {
            for (const c of cryptos) {
                // Micro variation +/- 0.15% to simulate live order flow
                const deltaPct = (Math.random() - 0.49) * 0.003;
                const newPrice = Math.max(0.0001, c.current_price_usd * (1 + deltaPct));
                const newChange = Number((c.change_24h + deltaPct * 5).toFixed(2));
                const newHigh = Math.max(c.high_24h, newPrice);
                const newLow = Math.min(c.low_24h > 0 ? c.low_24h : newPrice, newPrice);

                updateStmt.run(
                    Number(newPrice.toFixed(newPrice < 1 ? 4 : 2)),
                    newChange,
                    Number(newHigh.toFixed(newHigh < 1 ? 4 : 2)),
                    Number(newLow.toFixed(newLow < 1 ? 4 : 2)),
                    c.id
                );
            }
        })();
    } catch (e) {
        // Silently skip if DB locked momentarily
    }
}

// Background market ticker (runs every 10 seconds for real-time micro-ticks)
let tickerInterval = setInterval(simulateMarketTick, 10000);
if (tickerInterval.unref) {
    tickerInterval.unref();
}

// Background CoinGecko live feed sync (runs every 60 seconds)
let geckoInterval = setInterval(() => {
    fetchLiveCryptoRatesFromCoinGecko().catch(() => {});
}, 60000);
if (geckoInterval.unref) {
    geckoInterval.unref();
}

// Trigger initial fetch asynchronously
fetchLiveCryptoRatesFromCoinGecko().catch(() => {});

module.exports = {
    getActiveCryptos,
    getCryptoBySymbolOrSlug,
    getHistoricalChartData,
    getOrderBook,
    simulateMarketTick,
    fetchLiveCryptoRatesFromCoinGecko,
    getCryptoFeedStatus
};
