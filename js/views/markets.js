/**
 * CCPulse Markets View
 * Database-driven list of all active cryptocurrencies with real-time currency conversion
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
            cryptos = State.cryptos || [];
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
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 28px;">
                <div>
                    <h1 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 6px;">
                        <i class="fa-solid fa-chart-line text-cyan"></i> Cryptocurrency Markets
                    </h1>
                    <p style="color: var(--text-secondary); font-size: 0.95rem;">
                        Real-time market registry dynamically driven by the platform engine. Displayed in <strong style="color: var(--color-primary);">${Currency.getActiveCode()}</strong>.
                    </p>
                </div>
                <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                    <div style="position: relative;">
                        <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.85rem;"></i>
                        <input type="text" id="market-search" placeholder="Search coin or symbol..." style="padding-left: 34px; width: 220px;" value="${this.searchQuery}">
                    </div>
                </div>
            </div>

            <!-- Category Pills -->
            <div style="display: flex; gap: 8px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 4px;">
                <button type="button" class="btn ${this.currentFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}" data-filter="ALL" style="font-size: 0.82rem; padding: 6px 14px;">All Coins</button>
                <button type="button" class="btn ${this.currentFilter === 'PRIVACY' ? 'btn-primary' : 'btn-outline'}" data-filter="PRIVACY" style="font-size: 0.82rem; padding: 6px 14px;"><i class="fa-solid fa-shield-cat"></i> Privacy (XMR, BDX)</button>
                <button type="button" class="btn ${this.currentFilter === 'LAYER1' ? 'btn-primary' : 'btn-outline'}" data-filter="LAYER1" style="font-size: 0.82rem; padding: 6px 14px;"><i class="fa-solid fa-cubes"></i> Layer 1s</button>
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
                            <th>Risk</th>
                            <th style="text-align: right;">Actions</th>
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

            // Category filter
            if (this.currentFilter === 'PRIVACY') {
                return ['XMR', 'BDX'].includes(c.symbol.toUpperCase());
            } else if (this.currentFilter === 'LAYER1') {
                return ['BTC', 'ETH', 'SOL'].includes(c.symbol.toUpperCase());
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

            const riskColors = {
                Low: 'var(--color-success)',
                Medium: 'var(--color-secondary)',
                High: 'var(--color-warning)',
                'Very High': 'var(--color-danger)'
            };
            const riskColor = riskColors[c.risk_level] || 'var(--text-muted)';

            return `
                <tr>
                    <td style="color: var(--text-muted); font-size: 0.82rem;">${idx + 1}</td>
                    <td>
                        <div class="crypto-cell">
                            <button type="button" class="watchlist-star-btn" data-id="${c.id}" title="${isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}" style="color: ${isWatchlisted ? '#F59E0B' : 'var(--text-muted)'}; font-size: 1rem;">
                                <i class="${isWatchlisted ? 'fa-solid' : 'fa-regular'} fa-star"></i>
                            </button>
                            <img src="${logo}" alt="${c.name}" class="crypto-logo" onerror="this.onerror=null; this.src='/assets/coins/generic.svg'">
                            <div>
                                <a href="#crypto/${c.symbol}" class="crypto-name">${c.name}</a>
                                <div class="crypto-symbol">${c.symbol} &bull; <span style="font-size: 0.72rem; color: var(--color-primary);">${c.blockchain.split(' ')[0]}</span></div>
                            </div>
                        </div>
                    </td>
                    <td class="font-mono" style="font-weight: 700; font-size: 0.98rem;">${price}</td>
                    <td class="${changeClass} font-mono" style="font-weight: 700;">
                        ${changeSign}${c.change_24h}%
                    </td>
                    <td class="font-mono" style="font-size: 0.82rem; color: var(--text-secondary);">
                        <span style="color: var(--color-success);">${high}</span> / <span style="color: var(--color-danger);">${low}</span>
                    </td>
                    <td class="font-mono" style="font-size: 0.85rem; color: var(--text-secondary);">${vol}</td>
                    <td class="font-mono" style="font-size: 0.85rem; color: var(--text-secondary);">${mcap}</td>
                    <td>
                        <span style="font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: var(--border-radius-full); background: rgba(255,255,255,0.05); color: ${riskColor}; border: 1px solid ${riskColor};">
                            ${c.risk_level}
                        </span>
                    </td>
                    <td style="text-align: right;">
                        <div style="display: inline-flex; gap: 8px;">
                            <a href="#crypto/${c.symbol}" class="btn btn-outline" style="font-size: 0.8rem; padding: 4px 10px;">
                                Details
                            </a>
                            <a href="#simulator?coin=${c.symbol}" class="btn btn-primary" style="font-size: 0.8rem; padding: 4px 10px;">
                                <i class="fa-solid fa-bolt"></i> Sim Trade
                            </a>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Attach Watchlist Star Clicks
        tbody.querySelectorAll('.watchlist-star-btn').forEach(btn => {
            btn.onclick = async () => {
                if (!State.currentUser || State.isGuest) {
                    AuthModals.showLogin();
                    return;
                }
                const cryptoId = parseInt(btn.getAttribute('data-id'), 10);
                try {
                    const res = await API.cryptos.toggleWatchlist(cryptoId);
                    if (res.isSaved) {
                        watchlistIds.push(cryptoId);
                    } else {
                        const idx = watchlistIds.indexOf(cryptoId);
                        if (idx > -1) watchlistIds.splice(idx, 1);
                    }
                    this.renderTableRows(cryptos, watchlistIds);
                } catch (e) {
                    alert(e.message);
                }
            };
        });
    }
};

window.MarketsView = MarketsView;

