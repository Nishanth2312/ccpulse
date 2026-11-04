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

/**
 * Periodic market data tick simulation to produce realistic live fluctuation
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
                // Micro variation +/- 0.35%
                const deltaPct = (Math.random() - 0.49) * 0.007;
                const newPrice = Math.max(0.0001, c.current_price_usd * (1 + deltaPct));
                const newChange = Number((c.change_24h + deltaPct * 10).toFixed(2));
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

// Background market ticker (runs every 10 seconds)
let tickerInterval = setInterval(simulateMarketTick, 10000);
if (tickerInterval.unref) {
    tickerInterval.unref();
}

module.exports = {
    getActiveCryptos,
    getCryptoBySymbolOrSlug,
    getHistoricalChartData,
    getOrderBook,
    simulateMarketTick
};
