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

// Canonical mapping between cryptocurrency symbols/slugs and primary market feed IDs
const PRIMARY_FEED_SLUG_MAP = {
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

const NINJA_API_KEY = process.env.API_NINJAS_KEY || 'mGMasDhcrG73bhUPj5VPOvxqdd33xgO5XxpROwjN';
const PRIMARY_MARKET_API_KEY = process.env.PRIMARY_MARKET_API_KEY || 'CG-gkSfgK1H4xdgaM7tWABxpbEL';
const CRYPTO_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache to strictly protect monthly API quotas

let lastCryptoFetchTime = null;
let isCryptoFeedLive = false;
let cryptoFeedError = null;
let activeProvider = 'Live Market Feed (Tier 1)';

/**
 * Fetch real-time cryptocurrency market data from API Ninjas (Tier 2 Secondary Failover)
 */
async function fetchLiveCryptoRatesFromNinja() {
    try {
        const cryptos = db.prepare('SELECT id, symbol, current_price_usd FROM cryptocurrencies WHERE is_active = 1').all();
        const topSymbols = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK', 'DOT', 'LTC'];
        let updated = 0;

        const updateStmt = db.prepare(`
            UPDATE cryptocurrencies
            SET current_price_usd = ?, market_data_source = 'API Ninjas Live (Tier 2)', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);

        await Promise.all(topSymbols.map(async sym => {
            const coin = cryptos.find(c => c.symbol === sym);
            if (!coin) return;
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), 3500);
            try {
                const res = await fetch(`https://api.api-ninjas.com/v1/cryptoprice?symbol=${sym}USD`, {
                    headers: { 'X-Api-Key': NINJA_API_KEY },
                    signal: controller.signal
                });
                clearTimeout(tid);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.price) {
                        const p = parseFloat(data.price);
                        if (p > 0) {
                            updateStmt.run(p, coin.id);
                            updated++;
                        }
                    }
                }
            } catch (e) {
                clearTimeout(tid);
            }
        }));

        if (updated > 0) {
            lastCryptoFetchTime = new Date().toISOString();
            isCryptoFeedLive = true;
            cryptoFeedError = null;
            activeProvider = 'API Ninjas (Tier 2 Failover)';
        }
        return { success: true, updated, provider: activeProvider };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

const KUCOIN_ALL_TICKERS_URL = 'https://api.kucoin.com/api/v1/market/allTickers';

/**
 * Fetch real-time cryptocurrency market data directly from KuCoin API (Tier 1 First Priority)
 * Automatically maps spot tickers for all supported cryptocurrencies:
 * BTC-USDT, ETH-USDT, SOL-USDT, BDX-USDT, XMR-USDT, XRP-USDT, DOGE-USDT, ADA-USDT, AVAX-USDT, LINK-USDT,
 * DOT-USDT, TRX-USDT, SHIB-USDT, PEPE-USDT, SUI-USDT, NEAR-USDT, LTC-USDT, UNI-USDT, USDT, BNB-USDT
 */
async function fetchLiveCryptoRatesFromKuCoin(manual = false) {
    try {
        const cryptos = db.prepare('SELECT id, symbol, slug, current_price_usd, high_24h, low_24h, circulating_supply, market_cap_usd, volume_24h FROM cryptocurrencies WHERE is_active = 1').all();
        if (cryptos.length === 0) {
            return { success: true, updated: 0, isLive: isCryptoFeedLive, provider: activeProvider };
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(KUCOIN_ALL_TICKERS_URL, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'CCPulse-Simulation-Lab/2.0'
            }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`KuCoin API HTTP ${response.status}: ${response.statusText}`);
        }

        const json = await response.json();
        if (json.code !== '200000' || !json.data || !Array.isArray(json.data.ticker)) {
            throw new Error(`KuCoin API returned non-success code: ${json.code}`);
        }

        const tickers = json.data.ticker;
        const tickerMap = new Map();
        for (const t of tickers) {
            if (t.symbol) {
                tickerMap.set(t.symbol.toUpperCase(), t);
            }
        }

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
            for (const c of cryptos) {
                const sym = (c.symbol || '').toUpperCase();
                if (sym === 'USDT') {
                    updateStmt.run(1.00, 0.00, c.volume_24h || 50000000000, 120000000000, 1.001, 0.999, 'KuCoin Live (Tier 1 Priority)', c.id);
                    updatedCount++;
                    continue;
                }

                // Check USDT, USDC, or USD quote pair
                const t = tickerMap.get(`${sym}-USDT`) || 
                          tickerMap.get(`${sym}-USDC`) || 
                          tickerMap.get(`${sym}-USD`);

                if (t && t.last) {
                    const price = parseFloat(t.last);
                    if (price > 0) {
                        const changePct = t.changeRate != null 
                            ? parseFloat((parseFloat(t.changeRate) * 100).toFixed(2)) 
                            : (c.change_24h || 0);
                        const volUsd = t.volValue != null 
                            ? Math.round(parseFloat(t.volValue)) 
                            : Math.round(parseFloat(t.vol || 0) * price);
                        const high = t.high != null ? parseFloat(t.high) : price * 1.02;
                        const low = t.low != null ? parseFloat(t.low) : price * 0.98;
                        const mcap = c.circulating_supply 
                            ? Math.round(c.circulating_supply * price) 
                            : (c.market_cap_usd ? Math.round(c.market_cap_usd * (price / (c.current_price_usd || price))) : Math.round(price * 10000000));

                        updateStmt.run(
                            price,
                            isNaN(changePct) ? 0 : changePct,
                            isNaN(volUsd) ? 1000000 : volUsd,
                            mcap,
                            high,
                            low,
                            'KuCoin Live (Tier 1 Priority)',
                            c.id
                        );
                        updatedCount++;
                    }
                }
            }
        })();

        if (updatedCount > 0) {
            lastCryptoFetchTime = new Date().toISOString();
            isCryptoFeedLive = true;
            cryptoFeedError = null;
            activeProvider = 'KuCoin Live (Tier 1 Priority)';
        }

        return {
            success: true,
            updated: updatedCount,
            provider: activeProvider,
            lastUpdated: lastCryptoFetchTime,
            isLive: true
        };
    } catch (err) {
        console.warn('KuCoin Live Priority Error:', err.message, '- Failing over to secondary provider.');
        cryptoFeedError = err.message;
        throw err;
    }
}

// Alias for backwards compatibility
const fetchLiveCryptoRatesFromPrimaryProvider = fetchLiveCryptoRatesFromKuCoin;

/**
 * Multi-Tier Failover Crypto Market Fetcher:
 * Tier 1 (First Priority): KuCoin Public Market API (Immediate return on success, avoids calling other APIs)
 * Tier 2 (Secondary Failover): API Ninjas Crypto Price Feed (Only jumped to upon failure)
 * Tier 3 (Tertiary Failover): Local Procedural Simulation Engine (Offline sandbox)
 */
async function fetchMultiTierCryptoRates(manual = false) {
    // 1. Quota preservation: check 30-minute cache TTL unless manual forced refresh
    if (!manual && lastCryptoFetchTime) {
        const elapsed = Date.now() - new Date(lastCryptoFetchTime).getTime();
        if (elapsed < CRYPTO_CACHE_TTL_MS) {
            return {
                success: true,
                updated: 0,
                cached: true,
                provider: activeProvider,
                lastUpdated: lastCryptoFetchTime,
                isLive: isCryptoFeedLive
            };
        }
    }

    // 2. Tier 1 (First Priority): KuCoin Public Market API
    // When KuCoin succeeds, we avoid calling other APIs completely!
    try {
        const kucoinRes = await fetchLiveCryptoRatesFromKuCoin(manual);
        if (kucoinRes && kucoinRes.success && kucoinRes.updated > 0) {
            return kucoinRes;
        }
    } catch (e1) {
        console.warn('Tier 1 (KuCoin Priority) failed:', e1.message, 'Failing over to Tier 2 (API Ninjas)...');
    }

    // 3. Tier 2 (Secondary Failover): ONLY called if KuCoin fails
    try {
        const ninjaRes = await fetchLiveCryptoRatesFromNinja();
        if (ninjaRes && ninjaRes.success && ninjaRes.updated > 0) {
            return ninjaRes;
        }
    } catch (e2) {
        console.warn('Tier 2 (API Ninjas) failed:', e2.message, 'Failing over to Tier 3 (Simulation)...');
    }

    // 4. Tier 3: Local SQLite Database & Micro-Tick Simulation
    simulateMarketTick();
    activeProvider = 'High-Fidelity Simulation (Tier 3 Fallback)';
    return {
        success: true,
        updated: 0,
        provider: activeProvider,
        lastUpdated: lastCryptoFetchTime || new Date().toISOString(),
        isLive: false,
        warning: 'Live market APIs unavailable. Serving high-fidelity cached simulation.'
    };
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
 * Periodic market data tick simulation to produce realistic live fluctuation between market polls
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

// Background market ticker (runs every 10 seconds for local real-time micro-ticks without external API calls)
let tickerInterval = setInterval(simulateMarketTick, 10000);
if (tickerInterval.unref) {
    tickerInterval.unref();
}

// Background Multi-Tier live feed sync (runs every 30 minutes to protect monthly API quotas)
let multiTierInterval = setInterval(() => {
    fetchMultiTierCryptoRates().catch(() => {});
}, CRYPTO_CACHE_TTL_MS);
if (multiTierInterval.unref) {
    multiTierInterval.unref();
}

// Trigger initial fetch asynchronously
fetchMultiTierCryptoRates().catch(() => {});

module.exports = {
    getActiveCryptos,
    getCryptoBySymbolOrSlug,
    getHistoricalChartData,
    getOrderBook,
    simulateMarketTick,
    fetchLiveCryptoRatesFromKuCoin,
    fetchLiveCryptoRatesFromPrimaryProvider,
    fetchLiveCryptoRatesFromNinja,
    fetchMultiTierCryptoRates,
    getCryptoFeedStatus
};
