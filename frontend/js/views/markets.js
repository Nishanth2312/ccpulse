/**
 * CCPulse Markets View (CoinGecko-Style Training Simulator Market Hub)
 * Lists all market coins with categories (Top 10, Layer 1, DeFi, Privacy, Meme),
 * search, 24h metrics, 7d sparkline mini-charts, and instant Trade / Swap actions.
 */
const MarketsView = {
    currentFilter: 'ALL',
    searchQuery: '',

    async render(container) {
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

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 24px;">
                <div>
                    <h1 style="font-size: 1.85rem; font-weight: 800; margin-bottom: 6px;">
                        <i class="fa-solid fa-chart-line text-cyan"></i> Cryptocurrency Markets
                    </h1>
                    <p style="color: var(--text-secondary); font-size: 0.92rem; margin-bottom: 8px;">
                        Comprehensive CoinGecko-style market tracker with live prices from API Ninjas & CoinGecko. Converted to <strong style="color: var(--color-primary);">${Currency.getActiveCode()}</strong>.
                    </p>
                    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                        <span style="display: inline-flex; align-items: center; gap: 6px; background: rgba(16, 185, 129, 0.12); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.25); padding: 3px 10px; border-radius: 20px; font-size: 0.76rem; font-weight: 600;">
                            <span style="width: 7px; height: 7px; border-radius: 50%; background: #10B981; box-shadow: 0 0 6px #10B981; display: inline-block;"></span>
                            API Ninjas + CoinGecko Live Feed
                        </span>
                        <span id="market-last-updated" style="font-size: 0.78rem; color: var(--text-muted);">
                            <i class="fa-regular fa-clock"></i> Updated ${new Date().toLocaleTimeString()}
                        </span>
                    </div>
                </div>

                <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                    <div style="position: relative;">
                        <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.85rem;"></i>
                        <input type="text" id="market-search" placeholder="Search coin or symbol..." style="padding-left: 34px; width: 220px;" value="${this.searchQuery}">
                    </div>
                    <a href="#swap" class="btn btn-outline" style="font-size: 0.82rem; padding: 7px 14px; color: #8B5CF6; border-color: rgba(139, 92, 246, 0.4); display: inline-flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-repeat"></i> Instant Swap
                    </a>
                    <button type="button" id="markets-refresh-rates-btn" class="btn btn-outline" style="font-size: 0.82rem; padding: 7px 14px; display: inline-flex; align-items: center; gap: 6px;" title="Fetch latest prices from API Ninjas & CoinGecko">
                        <i class="fa-solid fa-arrows-rotate" id="markets-refresh-icon"></i> Refresh Rates
                    </button>
                </div>
            </div>

            <!-- CoinGecko Style Category Filters -->
            <div style="display: flex; gap: 8px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 4px;">
                <button type="button" class="btn ${this.currentFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}" data-filter="ALL" style="font-size: 0.82rem; padding: 6px 14px;">All Coins</button>
                <button type="button" class="btn ${this.currentFilter === 'TOP10' ? 'btn-primary' : 'btn-outline'}" data-filter="TOP10" style="font-size: 0.82rem; padding: 6px 14px;"><i class="fa-solid fa-ranking-star"></i> Top 10</button>
                <button type="button" class="btn ${this.currentFilter === 'LAYER1' ? 'btn-primary' : 'btn-outline'}" data-filter="LAYER1" style="font-size: 0.82rem; padding: 6px 14px;"><i class="fa-solid fa-cubes"></i> Layer 1s</button>
                <button type="button" class="btn ${this.currentFilter === 'DEFI' ? 'btn-primary' : 'btn-outline'}" data-filter="DEFI" style="font-size: 0.82rem; padding: 6px 14px;"><i class="fa-solid fa-coins"></i> DeFi</button>
                <button type="button" class="btn ${this.currentFilter === 'PRIVACY' ? 'btn-primary' : 'btn-outline'}" data-filter="PRIVACY" style="font-size: 0.82rem; padding: 6px 14px;"><i class="fa-solid fa-shield-cat"></i> Privacy (BDX, XMR)</button>
                <button type="button" class="btn ${this.currentFilter === 'MEME' ? 'btn-primary' : 'btn-outline'}" data-filter="MEME" style="font-size: 0.82rem; padding: 6px 14px;"><i class="fa-solid fa-face-grin-tongue-wink"></i> Meme Coins</button>
                ${State.currentUser && !State.isGuest ? `
                    <button type="button" class="btn ${this.currentFilter === 'WATCHLIST' ? 'btn-primary' : 'btn-outline'}" data-filter="WATCHLIST" style="font-size: 0.82rem; padding: 6px 14px;"><i class="fa-solid fa-star"></i> My Watchlist</button>
                ` : ''}
            </div>

            <!-- Markets Table -->
            <div class="glass-card table-wrapper">
                <table class="data-table" id="markets-table">
                    <thead>
                        <tr>
                            <th style="width: 40px;">#</th>
                            <th>Asset</th>
                            <th>Price (${Currency.getActiveCode()})</th>
                            <th>24h Change</th>
                            <th>24h High / Low</th>
                            <th>24h Volume</th>
                            <th>Market Cap</th>
                            <th style="text-align: center; width: 110px;">7D Trend</th>
                            <th style="text-align: right; min-width: 140px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="markets-tbody">
                        <!-- Populated by filter -->
                    </tbody>
                </table>
            </div>
        `;

        this.attachEvents(container, cryptos, watchlistIds);
        this.renderTableRows(cryptos, watchlistIds);
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
        const lastUpdatedTag = container.querySelector('#market-last-updated');

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

                    if (lastUpdatedTag) {
                        lastUpdatedTag.innerHTML = `<i class="fa-regular fa-clock"></i> Updated ${new Date().toLocaleTimeString()}`;
                    }
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
                });
                btn.className = 'btn btn-primary';
                this.renderTableRows(cryptos, watchlistIds);
            };
        });
    },

    renderSparkline(points, isPositive) {
        if (!points || points.length < 2) {
            points = isPositive ? [10, 11, 10.5, 12, 11.8, 13] : [13, 12, 12.2, 11, 11.4, 10];
        }
        const min = Math.min(...points);
        const max = Math.max(...points);
        const range = max - min || 1;
        const width = 100;
        const height = 28;
        const strokeColor = isPositive ? '#10B981' : '#EF4444';

        const coords = points.map((p, i) => {
            const x = (i / (points.length - 1)) * width;
            const y = height - 2 - ((p - min) / range) * (height - 6);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');

        return `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
                <polyline fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="${coords}" />
            </svg>
        `;
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
            } else if (this.currentFilter === 'WATCHLIST') {
                return watchlistIds.includes(c.id);
            }

            return true;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-muted);">
                        No cryptocurrencies match your criteria.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map((c, idx) => {
            const price = Currency.formatCryptoPrice(c.current_price_usd);
            const high = Currency.formatCryptoPrice(c.high_24h);
            const low = Currency.formatCryptoPrice(c.low_24h);
            const vol = Currency.format(c.volume_24h);
            const mcap = Currency.format(c.market_cap_usd);
            const logo = State.getCoinLogo(c);

            const changeClass = c.change_24h >= 0 ? 'text-success' : 'text-danger';
            const changeSign = c.change_24h >= 0 ? '+' : '';
            const isWatchlisted = watchlistIds.includes(c.id);
            const sparkline = this.renderSparkline(c.sparkline, c.change_24h >= 0);

            return `
                <tr>
                    <td style="color: var(--text-muted); font-size: 0.82rem;">${idx + 1}</td>
                    <td>
                        <div class="crypto-cell">
                            <button type="button" class="watchlist-star-btn" data-id="${c.id}" title="${isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}" style="color: ${isWatchlisted ? '#F59E0B' : 'var(--text-muted)'}; font-size: 1rem; border: none; background: transparent; cursor: pointer;">
                                <i class="${isWatchlisted ? 'fa-solid' : 'fa-regular'} fa-star"></i>
                            </button>
                            <img src="${logo}" alt="${c.name}" class="crypto-logo" onerror="this.onerror=null; this.src='./assets/coins/generic.svg'">
                            <div>
                                <a href="#crypto/${c.symbol}" class="crypto-name" style="font-weight: 700; color: var(--text-primary); text-decoration: none;">${c.name}</a>
                                <div class="crypto-symbol">${c.symbol} &bull; <span style="font-size: 0.72rem; color: var(--color-primary);">${(c.blockchain || '').split(' ')[0]}</span></div>
                            </div>
                        </div>
                    </td>
                    <td class="font-mono" style="font-weight: 700; font-size: 0.98rem;">${price}</td>
                    <td class="${changeClass} font-mono" style="font-weight: 700;">
                        ${changeSign}${c.change_24h}%
                    </td>
                    <td class="font-mono" style="font-size: 0.82rem; color: var(--text-secondary);">
                        <div>${high}</div>
                        <div style="color: var(--text-muted); font-size: 0.75rem;">${low}</div>
                    </td>
                    <td class="font-mono" style="font-size: 0.85rem;">${vol}</td>
                    <td class="font-mono" style="font-size: 0.85rem; font-weight: 700;">${mcap}</td>
                    <td style="text-align: center;">
                        ${sparkline}
                    </td>
                    <td style="text-align: right; white-space: nowrap;">
                        <a href="#swap?from=${c.symbol}" class="btn btn-outline" style="font-size: 0.76rem; padding: 4px 8px; margin-right: 4px; color: #8B5CF6;" title="Swap ${c.symbol}">
                            Swap
                        </a>
                        <a href="#simulator?coin=${c.symbol}" class="btn btn-primary" style="font-size: 0.76rem; padding: 4px 10px;">
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
