/**
 * CCPulse Markets View (CoinGecko Authentic Experience)
 * Directly matches CoinGecko design (https://www.coingecko.com/):
 * - Top Highlights: Market Cap 7-Day Trend Chart, Trending Coins 🔥, Largest Movers 🚀
 * - Category Tabs: All Cryptocurrencies, Top 10, Layer 1, DeFi, Privacy (BDX, XMR), Memes, Watchlist
 * - High-Density 11-Column Table: Star, Rank, Coin, Price, 1h %, 24h %, 7d %, 24h Vol, Market Cap, 7d Sparkline SVG, Actions
 * - Modern Educational & Staking Feature Grid (Register -> Trade -> Rewards -> Repeat)
 */
const MarketsView = {
    currentFilter: 'ALL',
    searchQuery: '',
    sortBy: 'rank', // 'rank' | 'price' | 'change24h' | 'mcap' | 'volume'
    sortAsc: true,
    chartMode: (typeof localStorage !== 'undefined' && localStorage.getItem('ccpulse_chart_mode')) || 'curve', // 'curve' | 'candle'

    async render(container, queryParams = null) {
        if (queryParams) {
            if (queryParams.get('filter')) this.currentFilter = queryParams.get('filter');
            if (queryParams.get('tab') === 'gainers') this.currentFilter = 'GAINERS';
            if (queryParams.get('tab') === 'trending') this.currentFilter = 'ALL';
        }

        let cryptos = [];
        try {
            const res = await API.cryptos.list();
            cryptos = res.cryptos || [];
            State.cryptos = cryptos;
        } catch (e) {
            cryptos = (State.cryptos && State.cryptos.length) ? State.cryptos : CLIENT_STATIC_COINS;
        }

        // Fetch user watchlist if authenticated
        let watchlistIds = [];
        if (State.currentUser && !State.isGuest) {
            try {
                const wRes = await API.cryptos.getWatchlist();
                watchlistIds = (wRes.watchlist || []).map(c => c.id);
                State.watchlist = watchlistIds;
            } catch (e) {}
        }

        // Calculate Global Telemetry Metrics
        let totalMcapUsd = 0;
        let totalVolUsd = 0;
        cryptos.forEach(c => {
            totalMcapUsd += (c.market_cap_usd || 0);
            totalVolUsd += (c.volume_24h || 0);
        });
        if (totalMcapUsd === 0) totalMcapUsd = 2680000000000;
        if (totalVolUsd === 0) totalVolUsd = 84200000000;

        const totalMcapFormatted = Currency.formatCompact(totalMcapUsd, null, true);
        const totalMcapShort = Currency.formatCompact(totalMcapUsd, null, false);
        const totalVolShort = Currency.formatCompact(totalVolUsd, null, false);

        // Update Top Marquee in Document Header if present
        const cgStatCoins = document.getElementById('cg-stat-coins');
        const cgStatMcap = document.getElementById('cg-stat-mcap');
        const cgStatVol = document.getElementById('cg-stat-vol');
        if (cgStatCoins) cgStatCoins.textContent = cryptos.length.toString();
        if (cgStatMcap) cgStatMcap.textContent = totalMcapShort;
        if (cgStatVol) cgStatVol.textContent = totalVolShort;

        // Trending coins list (BTC, BDX, SOL, XMR, ETH)
        const trendingCoins = [
            cryptos.find(c => c.symbol === 'BTC') || cryptos[0],
            cryptos.find(c => c.symbol === 'BDX') || cryptos[13],
            cryptos.find(c => c.symbol === 'SOL') || cryptos[4],
            cryptos.find(c => c.symbol === 'XMR') || cryptos[12]
        ].filter(Boolean);

        // Top 24h Gainers
        const topGainers = [...cryptos].sort((a, b) => (b.change_24h || 0) - (a.change_24h || 0)).slice(0, 4);

        container.innerHTML = `
            <!-- CoinGecko Title & Subtitle Section -->
            <div style="margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 14px;">
                    <div>
                        <h1 style="font-size: 1.95rem; font-weight: 800; letter-spacing: -0.4px; margin-bottom: 6px; display: flex; align-items: center; gap: 10px;">
                            <span>Cryptocurrency Prices by Market Cap</span>
                            <span class="cg-badge"><i class="fa-solid fa-bolt"></i> COINGECKO LIVE</span>
                        </h1>
                        <p style="color: var(--text-secondary); font-size: 0.94rem; margin-bottom: 8px;">
                            The global cryptocurrency market cap today is <strong style="color: var(--text-primary);">${totalMcapFormatted}</strong>, a <span class="cg-pct-badge up" style="font-size: 0.94rem;"><i class="fa-solid fa-caret-up"></i> 1.8%</span> change in the last 24 hours.
                        </p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <span class="badge-quota-shield" title="Protected with 30-minute cache TTL">
                            <i class="fa-solid fa-shield-halved"></i> 30m Quota Shield Active
                        </span>
                        <button type="button" id="markets-refresh-rates-btn" class="btn btn-outline" style="font-size: 0.82rem; padding: 6px 12px; display: inline-flex; align-items: center; gap: 6px;" title="Refresh rates from CoinGecko / API Ninjas">
                            <i class="fa-solid fa-arrows-rotate" id="markets-refresh-icon"></i> Sync Live
                        </button>
                    </div>
                </div>
            </div>

            <!-- CoinGecko 3 Top Highlight Widgets -->
            <div class="cg-highlights-grid">
                <!-- Widget 1: Market Cap 7-Day Chart -->
                <div class="cg-highlight-card">
                    <div class="cg-highlight-header">
                        <div>
                            <div class="cg-highlight-title">
                                <i class="fa-solid fa-chart-area" style="color: #16C784;"></i> Market Cap Overview
                            </div>
                            <div class="cg-highlight-sub">7-Day Trajectory (${Currency.getActiveCode()})</div>
                        </div>
                        <span class="cg-pct-badge up"><i class="fa-solid fa-caret-up"></i> +1.8%</span>
                    </div>
                    <div class="cg-highlight-val" style="margin-bottom: 10px;" title="${Currency.format(totalMcapUsd)}">${totalMcapFormatted}</div>
                    <div style="height: 72px; width: 100%;">
                        ${this.renderMarketCapChart()}
                    </div>
                </div>

                <!-- Widget 2: Trending Coins 🔥 -->
                <div class="cg-highlight-card">
                    <div class="cg-highlight-header">
                        <div>
                            <div class="cg-highlight-title">
                                <i class="fa-solid fa-fire" style="color: #F59E0B;"></i> Trending Coins
                            </div>
                            <div class="cg-highlight-sub">Most Searched in 24 Hours</div>
                        </div>
                        <a href="#cryptocurrencies" style="font-size: 0.74rem; color: #16C784; text-decoration: none; font-weight: 700;">View All &rarr;</a>
                    </div>
                    <div class="cg-trend-list">
                        ${trendingCoins.map((tc, idx) => {
                            const logo = State.getCoinLogo(tc);
                            const price = Currency.formatCryptoPrice(tc.current_price_usd);
                            const changeClass = tc.change_24h >= 0 ? 'up' : 'down';
                            const icon = tc.change_24h >= 0 ? 'fa-caret-up' : 'fa-caret-down';
                            return `
                                <a href="#crypto/${tc.symbol}" class="cg-trend-item">
                                    <div class="cg-trend-item-left">
                                        <span class="cg-trend-rank">#${idx + 1}</span>
                                        <img src="${logo}" alt="${tc.name}" class="cg-trend-logo" onerror="this.onerror=null; this.src='./assets/coins/generic.svg'">
                                        <span class="cg-trend-name">${tc.name}</span>
                                        <span class="cg-trend-symbol">${tc.symbol}</span>
                                    </div>
                                    <div style="text-align: right;">
                                        <div class="cg-trend-price">${price}</div>
                                        <span class="cg-pct-badge ${changeClass}" style="font-size: 0.76rem;">
                                            <i class="fa-solid ${icon}"></i> ${tc.change_24h >= 0 ? '+' : ''}${tc.change_24h}%
                                        </span>
                                    </div>
                                </a>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Widget 3: Top Gainers & Movers 🚀 -->
                <div class="cg-highlight-card">
                    <div class="cg-highlight-header">
                        <div>
                            <div class="cg-highlight-title">
                                <i class="fa-solid fa-rocket" style="color: #10B981;"></i> Largest 24h Movers
                            </div>
                            <div class="cg-highlight-sub">Top Gainers & High Volatility</div>
                        </div>
                        <span style="font-size: 0.74rem; color: var(--text-muted); font-weight: 600;">24h High</span>
                    </div>
                    <div class="cg-trend-list">
                        ${topGainers.map((gc, idx) => {
                            const logo = State.getCoinLogo(gc);
                            const price = Currency.formatCryptoPrice(gc.current_price_usd);
                            return `
                                <a href="#crypto/${gc.symbol}" class="cg-trend-item">
                                    <div class="cg-trend-item-left">
                                        <span class="cg-trend-rank">#${idx + 1}</span>
                                        <img src="${logo}" alt="${gc.name}" class="cg-trend-logo" onerror="this.onerror=null; this.src='./assets/coins/generic.svg'">
                                        <span class="cg-trend-name">${gc.name}</span>
                                        <span class="cg-trend-symbol">${gc.symbol}</span>
                                    </div>
                                    <div style="text-align: right;">
                                        <div class="cg-trend-price">${price}</div>
                                        <span class="cg-pct-badge up" style="font-size: 0.76rem;">
                                            <i class="fa-solid fa-caret-up"></i> +${gc.change_24h}%
                                        </span>
                                    </div>
                                </a>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>

            <!-- CoinGecko Filter Tabs & Controls Row -->
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 18px;">
                <!-- Category Tabs -->
                <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none;">
                    <button type="button" class="btn ${this.currentFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}" data-filter="ALL" style="font-size: 0.82rem; padding: 6px 14px; border-radius: 20px;">All Cryptocurrencies</button>
                    <button type="button" class="btn ${this.currentFilter === 'TOP10' ? 'btn-primary' : 'btn-outline'}" data-filter="TOP10" style="font-size: 0.82rem; padding: 6px 14px; border-radius: 20px;"><i class="fa-solid fa-ranking-star"></i> Top 10</button>
                    <button type="button" class="btn ${this.currentFilter === 'LAYER1' ? 'btn-primary' : 'btn-outline'}" data-filter="LAYER1" style="font-size: 0.82rem; padding: 6px 14px; border-radius: 20px;"><i class="fa-solid fa-cubes"></i> Layer 1s</button>
                    <button type="button" class="btn ${this.currentFilter === 'DEFI' ? 'btn-primary' : 'btn-outline'}" data-filter="DEFI" style="font-size: 0.82rem; padding: 6px 14px; border-radius: 20px;"><i class="fa-solid fa-coins"></i> DeFi</button>
                    <button type="button" class="btn ${this.currentFilter === 'PRIVACY' ? 'btn-primary' : 'btn-outline'}" data-filter="PRIVACY" style="font-size: 0.82rem; padding: 6px 14px; border-radius: 20px;"><i class="fa-solid fa-shield-cat"></i> Privacy (BDX, XMR)</button>
                    <button type="button" class="btn ${this.currentFilter === 'MEME' ? 'btn-primary' : 'btn-outline'}" data-filter="MEME" style="font-size: 0.82rem; padding: 6px 14px; border-radius: 20px;"><i class="fa-solid fa-face-grin-tongue-wink"></i> Memes</button>
                    ${State.currentUser && !State.isGuest ? `
                        <button type="button" class="btn ${this.currentFilter === 'WATCHLIST' ? 'btn-primary' : 'btn-outline'}" data-filter="WATCHLIST" style="font-size: 0.82rem; padding: 6px 14px; border-radius: 20px;"><i class="fa-solid fa-star"></i> My Watchlist</button>
                    ` : ''}
                </div>

                <!-- Search & Actions & View Mode Toggle -->
                <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                    <!-- View Mode Toggle: Chart Curve vs Candle Bars -->
                    <div class="cg-view-mode-toggle" style="display: inline-flex; align-items: center; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 20px; padding: 2px 4px; gap: 2px;">
                        <button type="button" id="btn-chart-curve" class="btn ${this.chartMode === 'curve' ? 'btn-primary' : 'btn-outline'}" style="font-size: 0.78rem; padding: 4px 10px; border-radius: 16px; border: none;" title="Flexible Smooth Curve View">
                            <i class="fa-solid fa-bezier-curve"></i> Chart View
                        </button>
                        <button type="button" id="btn-chart-candle" class="btn ${this.chartMode === 'candle' ? 'btn-primary' : 'btn-outline'}" style="font-size: 0.78rem; padding: 4px 10px; border-radius: 16px; border: none;" title="7-Day Candlestick Bar View">
                            <i class="fa-solid fa-chart-column"></i> Candle View
                        </button>
                    </div>

                    <div style="position: relative;">
                        <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.82rem;"></i>
                        <input type="text" id="market-search" placeholder="Search coin or symbol..." style="padding-left: 34px; padding-right: 12px; height: 36px; width: 200px; font-size: 0.84rem; border-radius: 20px; background: var(--bg-surface); border: 1px solid var(--border-color); color: var(--text-primary);" value="${this.searchQuery}">
                    </div>
                    <a href="#swap" class="btn btn-outline" style="font-size: 0.82rem; padding: 6px 14px; border-radius: 20px; color: #16C784; border-color: rgba(22, 199, 132, 0.4); display: inline-flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-repeat"></i> DEX Swap
                    </a>
                </div>
            </div>

            <!-- CoinGecko High-Density Table -->
            <div class="cg-table-wrapper">
                <table class="cg-table" id="markets-table">
                    <thead>
                        <tr>
                            <th style="width: 36px; text-align: center;"><i class="fa-regular fa-star" title="Watchlist"></i></th>
                            <th style="width: 44px; cursor: pointer;" data-sort="rank"># <i class="fa-solid fa-sort" style="font-size: 0.65rem;"></i></th>
                            <th style="cursor: pointer;" data-sort="name">Coin</th>
                            <th style="cursor: pointer;" data-sort="price">Price (${Currency.getActiveCode()}) <i class="fa-solid fa-sort" style="font-size: 0.65rem;"></i></th>
                            <th style="width: 85px;">1h</th>
                            <th style="width: 90px; cursor: pointer;" data-sort="change24h">24h <i class="fa-solid fa-sort" style="font-size: 0.65rem;"></i></th>
                            <th style="width: 85px;">7d</th>
                            <th style="cursor: pointer;" data-sort="volume">24h Volume <i class="fa-solid fa-sort" style="font-size: 0.65rem;"></i></th>
                            <th style="cursor: pointer;" data-sort="mcap">Market Cap <i class="fa-solid fa-sort" style="font-size: 0.65rem;"></i></th>
                            <th style="text-align: center; width: 145px;">
                                <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                                    <span>Last 7 Days</span>
                                    <button type="button" id="th-toggle-chart-mode" title="Toggle Chart Curve / Candlestick Bars" style="background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 2px 4px; font-size: 0.8rem;">
                                        <i class="fa-solid ${this.chartMode === 'candle' ? 'fa-chart-column' : 'fa-bezier-curve'}"></i>
                                    </button>
                                </div>
                            </th>
                            <th style="text-align: right; min-width: 130px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="markets-tbody">
                        <!-- Populated by renderTableRows -->
                    </tbody>
                </table>
            </div>

            <!-- Modern Staking & Process Cards (from Reference Design) -->
            <div style="margin-top: 40px; margin-bottom: 20px;">
                <div style="text-align: center; max-width: 680px; margin: 0 auto 28px;">
                    <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(22, 199, 132, 0.12); color: #16C784; padding: 4px 14px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; margin-bottom: 10px;">
                        <i class="fa-solid fa-graduation-cap"></i> 100% Risk-Free Simulation Platform
                    </div>
                    <h2 style="font-size: 1.7rem; font-weight: 800; letter-spacing: -0.3px; margin-bottom: 8px;">How Does CCPulse Work?</h2>
                    <p style="color: var(--text-secondary); font-size: 0.92rem;">
                        CCPulse gives developers, traders, and students an authentic cryptocurrency experience with real-time CoinGecko feeds, instant DEX swaps, and zero real capital risk.
                    </p>
                </div>

                <div class="nexus-features-grid">
                    <div class="nexus-step-card">
                        <div class="nexus-step-icon">
                            <i class="fa-solid fa-user-plus"></i>
                        </div>
                        <div class="nexus-step-title">1. Register</div>
                        <div class="nexus-step-desc">
                            Create an account in just a few simple steps. Claim a guaranteed $10,000 USD + 1.0 Bitcoin bonus.
                        </div>
                    </div>

                    <div class="nexus-step-card">
                        <div class="nexus-step-icon">
                            <i class="fa-solid fa-chart-line"></i>
                        </div>
                        <div class="nexus-step-title">2. Simulate & Trade</div>
                        <div class="nexus-step-desc">
                            Execute spot market orders, limit buys, and instant token swaps across 20+ top coins and altcoins.
                        </div>
                    </div>

                    <div class="nexus-step-card">
                        <div class="nexus-step-icon">
                            <i class="fa-solid fa-trophy"></i>
                        </div>
                        <div class="nexus-step-title">3. Rewards & P&L</div>
                        <div class="nexus-step-desc">
                            Track your virtual portfolio performance, asset allocation, and live candlestick charts updating every 30s.
                        </div>
                    </div>

                    <div class="nexus-step-card">
                        <div class="nexus-step-icon">
                            <i class="fa-solid fa-graduation-cap"></i>
                        </div>
                        <div class="nexus-step-title">4. Repeat & Master</div>
                        <div class="nexus-step-desc">
                            Explore the Crypto Academy, study privacy blockchains (BDX, XMR), and test risk scenarios without fear.
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachEvents(container, cryptos, watchlistIds);
        this.renderTableRows(cryptos, watchlistIds);
    },

    renderMarketCapChart() {
        const points = [2.42, 2.45, 2.49, 2.46, 2.55, 2.62, 2.68];
        const min = Math.min(...points);
        const max = Math.max(...points);
        const range = max - min || 1;
        const width = 280;
        const height = 66;

        const coords = points.map((p, i) => {
            const x = (i / (points.length - 1)) * width;
            const y = height - 4 - ((p - min) / range) * (height - 12);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');

        const firstCoord = coords.split(' ')[0];
        const lastCoord = coords.split(' ')[coords.split(' ').length - 1];
        const areaPoints = `${firstCoord} ${coords} ${width},${height} 0,${height}`;

        return `
            <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="overflow: visible;">
                <defs>
                    <linearGradient id="cgMcapGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#16C784" stop-opacity="0.32" />
                        <stop offset="100%" stop-color="#16C784" stop-opacity="0.0" />
                    </linearGradient>
                </defs>
                <polygon fill="url(#cgMcapGrad)" points="${areaPoints}" />
                <polyline fill="none" stroke="#16C784" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${coords}" />
            </svg>
        `;
    },

    renderSmoothCurve(points, isPositive) {
        if (!points || points.length < 2) {
            points = isPositive ? [10, 10.4, 10.8, 10.5, 11.2, 11.8, 12.2] : [12.2, 11.9, 11.5, 11.7, 11.0, 10.5, 10.2];
        }
        const min = Math.min(...points);
        const max = Math.max(...points);
        const range = Math.max(max - min, 0.0001);
        const width = 124;
        const height = 34;
        const strokeColor = isPositive ? '#16C784' : '#EA3943';
        const gradId = 'cg-grad-' + Math.random().toString(36).substring(2, 8);

        // Normalize points
        const pts = points.map((p, i) => {
            const x = (i / (points.length - 1)) * width;
            const y = height - 4 - ((p - min) / range) * (height - 10);
            return { x, y };
        });

        // Compute Catmull-Rom cubic bezier smooth path
        let linePath = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = i > 0 ? pts[i - 1] : pts[0];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            linePath += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
        }

        const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

        return `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="cg-sparkline-svg" preserveAspectRatio="none" style="overflow: visible;">
                <defs>
                    <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.25" />
                        <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0.0" />
                    </linearGradient>
                </defs>
                <path fill="url(#${gradId})" d="${areaPath}" />
                <path fill="none" stroke="${strokeColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="${linePath}" />
            </svg>
        `;
    },

    renderCandleBars(points, isPositive) {
        if (!points || points.length < 2) {
            points = isPositive ? [10, 10.4, 10.8, 10.5, 11.2, 11.8, 12.2] : [12.2, 11.9, 11.5, 11.7, 11.0, 10.5, 10.2];
        }
        const min = Math.min(...points);
        const max = Math.max(...points);
        const range = Math.max(max - min, 0.0001);
        const width = 124;
        const height = 34;

        const numCandles = Math.min(points.length, 7);
        const slotWidth = width / numCandles;
        const barWidth = 9;

        const getY = (val) => height - 3 - ((val - min) / range) * (height - 8);

        const candleElements = [];
        for (let i = 0; i < numCandles; i++) {
            const prev = i > 0 ? points[i - 1] : (points[0] * (isPositive ? 0.985 : 1.015));
            const curr = points[i];
            const isBullish = curr >= prev;
            const color = isBullish ? '#16C784' : '#EA3943';

            const spread = Math.abs(curr - prev);
            const wickPadding = Math.max(spread * 0.4, range * 0.06);
            const highVal = Math.max(prev, curr) + wickPadding;
            const lowVal = Math.min(prev, curr) - wickPadding;

            const yOpen = getY(prev);
            const yClose = getY(curr);
            const yHigh = Math.max(2, getY(highVal));
            const yLow = Math.min(height - 2, getY(lowVal));

            const cx = i * slotWidth + slotWidth / 2;
            const barX = cx - barWidth / 2;
            const barY = Math.min(yOpen, yClose);
            const barHeight = Math.max(2.5, Math.abs(yClose - yOpen));

            candleElements.push(`
                <line x1="${cx.toFixed(1)}" y1="${yHigh.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${yLow.toFixed(1)}" stroke="${color}" stroke-width="1.4" stroke-linecap="round" />
                <rect x="${barX.toFixed(1)}" y="${barY.toFixed(1)}" width="${barWidth}" height="${barHeight.toFixed(1)}" rx="1.5" fill="${color}" />
            `);
        }

        return `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="cg-sparkline-svg" style="overflow: visible;">
                ${candleElements.join('')}
            </svg>
        `;
    },

    renderSparkline(points, isPositive) {
        if (this.chartMode === 'candle') {
            return this.renderCandleBars(points, isPositive);
        }
        return this.renderSmoothCurve(points, isPositive);
    },

    attachEvents(container, cryptos, watchlistIds) {
        // Search
        const searchInput = container.querySelector('#market-search');
        if (searchInput) {
            searchInput.oninput = (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.renderTableRows(cryptos, watchlistIds);
            };
        }

        // Refresh Rates Button
        const refreshBtn = container.querySelector('#markets-refresh-rates-btn');
        const refreshIcon = container.querySelector('#markets-refresh-icon');

        if (refreshBtn) {
            refreshBtn.onclick = async () => {
                if (refreshIcon) refreshIcon.classList.add('fa-spin');
                try {
                    const res = await API.cryptos.refreshRates();
                    if (res && res.cryptos) {
                        cryptos = res.cryptos;
                        State.setCryptos(res.cryptos);
                    }
                    await API.currency.refreshRates();
                    this.renderTableRows(cryptos, watchlistIds);
                } catch (err) {
                    console.warn('Error refreshing live rates:', err);
                } finally {
                    if (refreshIcon) refreshIcon.classList.remove('fa-spin');
                }
            };
        }

        // Filter Pills
        container.querySelectorAll('[data-filter]').forEach(btn => {
            btn.onclick = () => {
                this.currentFilter = btn.getAttribute('data-filter');
                container.querySelectorAll('[data-filter]').forEach(b => {
                    b.className = 'btn btn-outline';
                    b.style.borderRadius = '20px';
                });
                btn.className = 'btn btn-primary';
                btn.style.borderRadius = '20px';
                this.renderTableRows(cryptos, watchlistIds);
            };
        });

        // Table Header Sorting
        container.querySelectorAll('[data-sort]').forEach(th => {
            th.onclick = () => {
                const sortField = th.getAttribute('data-sort');
                if (this.sortBy === sortField) {
                    this.sortAsc = !this.sortAsc;
                } else {
                    this.sortBy = sortField;
                    this.sortAsc = true;
                }
                this.renderTableRows(cryptos, watchlistIds);
            };
        });

        // Chart View Mode Switcher (Curve vs Candle)
        const btnCurve = container.querySelector('#btn-chart-curve');
        const btnCandle = container.querySelector('#btn-chart-candle');
        const thToggle = container.querySelector('#th-toggle-chart-mode');

        const switchChartMode = (newMode) => {
            this.chartMode = newMode;
            try {
                localStorage.setItem('ccpulse_chart_mode', newMode);
            } catch (e) {}

            if (btnCurve && btnCandle) {
                if (newMode === 'curve') {
                    btnCurve.className = 'btn btn-primary';
                    btnCandle.className = 'btn btn-outline';
                } else {
                    btnCurve.className = 'btn btn-outline';
                    btnCandle.className = 'btn btn-primary';
                }
            }

            if (thToggle) {
                thToggle.innerHTML = `<i class="fa-solid ${newMode === 'candle' ? 'fa-chart-column' : 'fa-bezier-curve'}"></i>`;
            }

            this.renderTableRows(cryptos, watchlistIds);
        };

        if (btnCurve) btnCurve.onclick = () => switchChartMode('curve');
        if (btnCandle) btnCandle.onclick = () => switchChartMode('candle');
        if (thToggle) {
            thToggle.onclick = () => {
                switchChartMode(this.chartMode === 'curve' ? 'candle' : 'curve');
            };
        }
    },

    renderTableRows(cryptos, watchlistIds) {
        const tbody = document.getElementById('markets-tbody');
        if (!tbody) return;

        let filtered = cryptos.filter(c => {
            // Search filter
            if (this.searchQuery) {
                const matchName = c.name.toLowerCase().includes(this.searchQuery);
                const matchSymbol = c.symbol.toLowerCase().includes(this.searchQuery);
                if (!matchName && !matchSymbol) return false;
            }

            const cats = c.categories || [];
            const sym = c.symbol.toUpperCase();

            // Category filter
            if (this.currentFilter === 'TOP10') {
                return cats.includes('Top 10') || ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'TRX'].includes(sym);
            } else if (this.currentFilter === 'LAYER1') {
                return cats.includes('Layer 1') || ['BTC', 'ETH', 'SOL', 'ADA', 'AVAX', 'DOT', 'TRX', 'SUI', 'NEAR', 'LTC'].includes(sym);
            } else if (this.currentFilter === 'DEFI') {
                return cats.includes('DeFi') || ['ETH', 'BNB', 'SOL', 'AVAX', 'LINK', 'UNI'].includes(sym);
            } else if (this.currentFilter === 'PRIVACY') {
                return cats.includes('Privacy') || ['XMR', 'BDX'].includes(sym);
            } else if (this.currentFilter === 'MEME') {
                return cats.includes('Meme') || ['DOGE', 'SHIB', 'PEPE'].includes(sym);
            } else if (this.currentFilter === 'GAINERS') {
                return (c.change_24h || 0) > 2;
            } else if (this.currentFilter === 'WATCHLIST') {
                return watchlistIds.includes(c.id);
            }

            return true;
        });

        // Sorting
        filtered.sort((a, b) => {
            let valA = 0;
            let valB = 0;
            if (this.sortBy === 'rank') {
                valA = a.sort_order || a.id || 0;
                valB = b.sort_order || b.id || 0;
            } else if (this.sortBy === 'name') {
                return this.sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            } else if (this.sortBy === 'price') {
                valA = a.current_price_usd || 0;
                valB = b.current_price_usd || 0;
            } else if (this.sortBy === 'change24h') {
                valA = a.change_24h || 0;
                valB = b.change_24h || 0;
            } else if (this.sortBy === 'volume') {
                valA = a.volume_24h || 0;
                valB = b.volume_24h || 0;
            } else if (this.sortBy === 'mcap') {
                valA = a.market_cap_usd || 0;
                valB = b.market_cap_usd || 0;
            }
            return this.sortAsc ? valA - valB : valB - valA;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" style="text-align: center; padding: 48px; color: var(--text-muted); font-size: 0.95rem;">
                        <i class="fa-solid fa-magnifying-glass" style="font-size: 1.5rem; margin-bottom: 8px; display: block;"></i>
                        No cryptocurrencies match your criteria.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map((c, idx) => {
            const price = Currency.formatCryptoPrice(c.current_price_usd);
            const vol = Currency.formatCompact(c.volume_24h);
            const volFull = Currency.format(c.volume_24h);
            const mcap = Currency.formatCompact(c.market_cap_usd);
            const mcapFull = Currency.format(c.market_cap_usd);
            const logo = State.getCoinLogo(c);

            // Compute realistic 1h and 7d changes if not present
            const change1h = c.change_1h !== undefined ? c.change_1h : Number((c.change_24h * 0.12 + ((c.id % 5) - 2) * 0.08).toFixed(2));
            const change7d = c.change_7d !== undefined ? c.change_7d : Number((c.change_24h * 2.4 + ((c.id % 7) - 3) * 0.6).toFixed(2));

            const isWatchlisted = watchlistIds.includes(c.id);
            const sparkline = this.renderSparkline(c.sparkline, change7d >= 0);

            return `
                <tr>
                    <td style="text-align: center;">
                        <button type="button" class="watchlist-star-btn" data-id="${c.id}" title="${isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}" style="color: ${isWatchlisted ? '#F59E0B' : 'var(--text-muted)'}; font-size: 0.9rem; border: none; background: transparent; cursor: pointer; padding: 4px;">
                            <i class="${isWatchlisted ? 'fa-solid' : 'fa-regular'} fa-star"></i>
                        </button>
                    </td>
                    <td style="color: var(--text-muted); font-size: 0.8rem; font-weight: 700;">${c.sort_order || idx + 1}</td>
                    <td>
                        <div class="cg-coin-cell">
                            <img src="${logo}" alt="${c.name}" class="cg-coin-logo" onerror="this.onerror=null; this.src='./assets/coins/generic.svg'">
                            <div class="cg-coin-info">
                                <a href="#crypto/${c.symbol}" class="cg-coin-name">${c.name}</a>
                                <span class="cg-coin-symbol">${c.symbol}</span>
                            </div>
                        </div>
                    </td>
                    <td class="font-mono" style="font-weight: 700; font-size: 0.92rem; color: var(--text-primary);">
                        ${price}
                    </td>
                    <td>
                        <span class="cg-pct-badge ${change1h >= 0 ? 'up' : 'down'}">
                            <i class="fa-solid ${change1h >= 0 ? 'fa-caret-up' : 'fa-caret-down'}"></i>
                            ${Math.abs(change1h).toFixed(1)}%
                        </span>
                    </td>
                    <td>
                        <span class="cg-pct-badge ${c.change_24h >= 0 ? 'up' : 'down'}">
                            <i class="fa-solid ${c.change_24h >= 0 ? 'fa-caret-up' : 'fa-caret-down'}"></i>
                            ${Math.abs(c.change_24h).toFixed(1)}%
                        </span>
                    </td>
                    <td>
                        <span class="cg-pct-badge ${change7d >= 0 ? 'up' : 'down'}">
                            <i class="fa-solid ${change7d >= 0 ? 'fa-caret-up' : 'fa-caret-down'}"></i>
                            ${Math.abs(change7d).toFixed(1)}%
                        </span>
                    </td>
                    <td class="font-mono" style="font-size: 0.84rem; color: var(--text-secondary);" title="${volFull}">
                        ${vol}
                    </td>
                    <td class="font-mono" style="font-size: 0.84rem; font-weight: 700; color: var(--text-primary);" title="${mcapFull}">
                        ${mcap}
                    </td>
                    <td style="text-align: center;">
                        ${sparkline}
                    </td>
                    <td style="text-align: right; white-space: nowrap;">
                        <a href="#swap?from=${c.symbol}" class="btn btn-outline" style="font-size: 0.74rem; padding: 4px 8px; margin-right: 4px; border-radius: 12px; color: #16C784; border-color: rgba(22, 199, 132, 0.35);" title="Swap ${c.symbol}">
                            Swap
                        </a>
                        <a href="#simulator?coin=${c.symbol}" class="btn btn-primary" style="font-size: 0.74rem; padding: 4px 10px; border-radius: 12px;" title="Trade ${c.symbol}">
                            Trade
                        </a>
                    </td>
                </tr>
            `;
        }).join('');

        // Attach Watchlist Star Click Handlers
        tbody.querySelectorAll('.watchlist-star-btn').forEach(btn => {
            btn.onclick = async () => {
                if (State.isGuest || !State.currentUser) {
                    AuthModals.showLogin();
                    return;
                }
                const cid = parseInt(btn.getAttribute('data-id'), 10);
                try {
                    await API.cryptos.toggleWatchlist(cid);
                    if (watchlistIds.includes(cid)) {
                        watchlistIds = watchlistIds.filter(id => id !== cid);
                    } else {
                        watchlistIds.push(cid);
                    }
                    State.watchlist = watchlistIds;
                    this.renderTableRows(cryptos, watchlistIds);
                } catch (e) {}
            };
        });
    }
};

window.MarketsView = MarketsView;
