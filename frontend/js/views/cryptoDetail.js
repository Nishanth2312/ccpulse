/**
 * CCPulse Cryptocurrency Detail & Chart Profile View
 */
const CryptoDetailView = {
    currentTimeframe: '1D',

    async render(container, symbolOrSlug) {
        let crypto = null;
        try {
            const res = await API.cryptos.get(symbolOrSlug);
            crypto = res.crypto;
        } catch (e) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <h2>Cryptocurrency Not Found</h2>
                    <p style="color: var(--text-muted); margin: 12px 0 24px;">The coin "${symbolOrSlug}" could not be located in the registry.</p>
                    <a href="#markets" class="btn btn-primary">Back to Markets</a>
                </div>
            `;
            return;
        }

        const price = Currency.formatCryptoPrice(crypto.current_price_usd);
        const high = Currency.formatCryptoPrice(crypto.high_24h);
        const low = Currency.formatCryptoPrice(crypto.low_24h);
        const vol = Currency.format(crypto.volume_24h);
        const mcap = Currency.format(crypto.market_cap_usd);

        const changeClass = crypto.change_24h >= 0 ? 'text-success' : 'text-danger';
        const changeSign = crypto.change_24h >= 0 ? '+' : '';

        container.innerHTML = `
            <!-- Top Breadcrumb & Actions -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: var(--text-muted);">
                    <a href="#markets" style="color: var(--color-primary);"><i class="fa-solid fa-arrow-left"></i> Markets</a>
                    <span>/</span>
                    <span style="color: var(--text-primary); font-weight: 600;">${crypto.name} (${crypto.symbol})</span>
                </div>
                <div style="display: flex; gap: 10px;">
                    <a href="#simulator?coin=${crypto.symbol}" class="btn btn-primary">
                        <i class="fa-solid fa-bolt"></i> Sim Trade ${crypto.symbol}
                    </a>
                </div>
            </div>

            <!-- Header Card -->
            <div class="glass-card" style="padding: 24px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px;">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <img src="${State.getCoinLogo(crypto)}" alt="${crypto.name}" class="crypto-logo" style="width: 52px; height: 52px; min-width: 52px; min-height: 52px;" onerror="this.onerror=null; this.src='/assets/coins/generic.svg'">
                        <div>
                            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                                <h1 style="font-size: 1.8rem; font-weight: 800;">${crypto.name}</h1>
                                <span style="font-size: 1rem; color: var(--text-muted); font-weight: 600;">${crypto.symbol}</span>
                                <span style="font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: var(--border-radius-full); background: rgba(0,240,255,0.1); color: var(--color-primary); border: 1px solid rgba(0,240,255,0.25);">
                                    Rank #${crypto.sort_order || 1}
                                </span>
                            </div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
                                <i class="fa-solid fa-link"></i> ${crypto.blockchain} &bull; Data Source: ${crypto.market_data_source}
                            </div>
                        </div>
                    </div>

                    <div style="text-align: right;">
                        <div style="font-size: 2.2rem; font-weight: 900; font-family: var(--font-mono); color: var(--text-primary);">
                            ${price}
                        </div>
                        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 4px; flex-wrap: wrap;">
                            <span class="${changeClass} font-mono" style="font-size: 1.05rem; font-weight: 700;">
                                ${changeSign}${crypto.change_24h}% (24h)
                            </span>
                            <span style="font-size: 0.8rem; color: var(--text-muted);">
                                High: ${high} &bull; Low: ${low}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Stats Bar -->
                <div class="responsive-stats-bar" style="margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                    <div>
                        <div style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Market Capitalization</div>
                        <div style="font-size: 1rem; font-weight: 700; font-family: var(--font-mono); margin-top: 4px;">${mcap}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">24h Trading Volume</div>
                        <div style="font-size: 1rem; font-weight: 700; font-family: var(--font-mono); margin-top: 4px;">${vol}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Circulating Supply</div>
                        <div style="font-size: 1rem; font-weight: 700; font-family: var(--font-mono); margin-top: 4px;">
                            ${crypto.circulating_supply.toLocaleString()} ${crypto.symbol}
                        </div>
                    </div>
                    <div>
                        <div style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Simulation Volatility Risk</div>
                        <div style="font-size: 1rem; font-weight: 700; margin-top: 4px; color: ${crypto.risk_level === 'High' ? 'var(--color-warning)' : 'var(--color-primary)'};">
                            ${crypto.risk_level} Risk Tier
                        </div>
                    </div>
                </div>
            </div>

            <!-- Chart & Orderbook Grid -->
            <div class="responsive-detail-grid">
                <!-- Historical Chart -->
                <div class="glass-card" style="padding: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="font-size: 1.15rem; font-weight: 700;">
                            <i class="fa-solid fa-chart-candlestick text-cyan"></i> Price Performance Chart
                        </h3>
                        <div style="display: flex; gap: 4px;" id="timeframe-buttons">
                            <button type="button" class="btn btn-outline" data-tf="1H" style="font-size: 0.78rem; padding: 4px 10px;">1H</button>
                            <button type="button" class="btn btn-primary" data-tf="1D" style="font-size: 0.78rem; padding: 4px 10px;">1D</button>
                            <button type="button" class="btn btn-outline" data-tf="1W" style="font-size: 0.78rem; padding: 4px 10px;">1W</button>
                            <button type="button" class="btn btn-outline" data-tf="1M" style="font-size: 0.78rem; padding: 4px 10px;">1M</button>
                            <button type="button" class="btn btn-outline" data-tf="1Y" style="font-size: 0.78rem; padding: 4px 10px;">1Y</button>
                        </div>
                    </div>

                    <!-- SVG Chart Container -->
                    <div id="chart-svg-container" style="height: 300px; width: 100%; position: relative;">
                        <!-- SVG injected here -->
                    </div>
                </div>

                <!-- Simulated Order Book Depth -->
                <div class="glass-card" style="padding: 24px;">
                    <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 16px;">
                        <i class="fa-solid fa-layer-group text-cyan"></i> Order Book Depth
                    </h3>
                    <div id="orderbook-container">
                        <!-- Populated by JS -->
                    </div>
                </div>
            </div>

            <!-- Educational & Risk Tabs -->
            <div class="glass-card" style="padding: 24px;">
                <div style="display: flex; gap: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 20px;">
                    <button type="button" id="tab-edu-btn" class="btn btn-primary" style="font-size: 0.9rem;">
                        <i class="fa-solid fa-graduation-cap"></i> Educational Guide
                    </button>
                    <button type="button" id="tab-risk-btn" class="btn btn-outline" style="font-size: 0.9rem;">
                        <i class="fa-solid fa-shield-virus"></i> Risk & Security Analysis
                    </button>
                </div>

                <div id="tab-edu-content">
                    <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 10px;">About ${crypto.name} (${crypto.symbol})</h4>
                    <p style="font-size: 0.95rem; line-height: 1.7; color: var(--text-secondary); margin-bottom: 20px;">
                        ${crypto.educational_content || 'Comprehensive educational guide for this cryptocurrency is provided through CCPulse Learning Academy.'}
                    </p>
                    <div style="background: var(--bg-surface-elevated); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
                        <strong style="color: var(--color-primary);">Architecture & Consensus:</strong>
                        <p style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 4px;">
                            ${crypto.blockchain}
                        </p>
                    </div>
                </div>

                <div id="tab-risk-content" class="hidden">
                    <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 10px; color: var(--color-warning);">
                        <i class="fa-solid fa-triangle-exclamation"></i> Risk Factors & Volatility Exposure
                    </h4>
                    <p style="font-size: 0.95rem; line-height: 1.7; color: var(--text-secondary); margin-bottom: 20px;">
                        ${crypto.risk_information || 'Standard cryptocurrency volatility risks apply. Never trade real funds based on unverified signals.'}
                    </p>
                    <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 8px; padding: 16px;">
                        <strong style="color: var(--color-warning);">CCPulse Safety Notice:</strong>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
                            Practice trading ${crypto.symbol} in the CCPulse Simulator using your virtual $5,000 USD credits to understand how sharp drawdowns affect your position before exposing capital in real markets.
                        </p>
                    </div>
                </div>
            </div>
        `;

        this.renderChart(crypto.id, this.currentTimeframe);
        this.renderOrderBook(crypto.id);
        this.attachDetailEvents(container, crypto);
    },

    async renderChart(cryptoId, timeframe) {
        const svgContainer = document.getElementById('chart-svg-container');
        if (!svgContainer) return;

        svgContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Loading chart data...</div>';

        try {
            const res = await API.cryptos.getChart(cryptoId, timeframe);
            const data = res.data || [];

            if (data.length < 2) {
                svgContainer.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);">No chart points available.</div>';
                return;
            }

            const width = svgContainer.clientWidth || 600;
            const height = 300;
            const padding = { top: 20, right: 30, bottom: 30, left: 20 };

            const prices = data.map(d => d.price);
            const minPrice = Math.min(...prices) * 0.998;
            const maxPrice = Math.max(...prices) * 1.002;

            const getX = (i) => padding.left + (i / (data.length - 1)) * (width - padding.left - padding.right);
            const getY = (p) => height - padding.bottom - ((p - minPrice) / (maxPrice - minPrice)) * (height - padding.top - padding.bottom);

            let pathD = `M ${getX(0)} ${getY(prices[0])}`;
            for (let i = 1; i < prices.length; i++) {
                pathD += ` L ${getX(i)} ${getY(prices[i])}`;
            }

            const areaD = `${pathD} L ${getX(prices.length - 1)} ${height - padding.bottom} L ${getX(0)} ${height - padding.bottom} Z`;

            const isUp = prices[prices.length - 1] >= prices[0];
            const strokeColor = isUp ? '#10B981' : '#EF4444';
            const gradientId = `chart-grad-${cryptoId}-${timeframe}`;

            svgContainer.innerHTML = `
                <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
                    <defs>
                        <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.35"/>
                            <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0.0"/>
                        </linearGradient>
                    </defs>
                    <!-- Grid Lines -->
                    <line x1="${padding.left}" y1="${getY(maxPrice)}" x2="${width - padding.right}" y2="${getY(maxPrice)}" stroke="var(--border-color)" stroke-dasharray="4"/>
                    <line x1="${padding.left}" y1="${getY(minPrice)}" x2="${width - padding.right}" y2="${getY(minPrice)}" stroke="var(--border-color)" stroke-dasharray="4"/>

                    <!-- Area Fill -->
                    <path d="${areaD}" fill="url(#${gradientId})" />

                    <!-- Price Line -->
                    <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>

                    <!-- Price Labels -->
                    <text x="${width - padding.right}" y="${getY(maxPrice) + 12}" fill="var(--text-muted)" font-size="10" font-family="monospace" text-anchor="end">
                        ${Currency.formatCryptoPrice(maxPrice)}
                    </text>
                    <text x="${width - padding.right}" y="${getY(minPrice) - 4}" fill="var(--text-muted)" font-size="10" font-family="monospace" text-anchor="end">
                        ${Currency.formatCryptoPrice(minPrice)}
                    </text>
                </svg>
            `;
        } catch (e) {
            svgContainer.innerHTML = `<div style="text-align:center;padding:40px;color:var(--color-danger);">${e.message}</div>`;
        }
    },

    async renderOrderBook(cryptoId) {
        const obContainer = document.getElementById('orderbook-container');
        if (!obContainer) return;

        try {
            const res = await API.cryptos.getOrderBook(cryptoId);
            const { bids, asks } = res.orderbook;

            const asksRows = asks.slice(0, 5).reverse().map(a => `
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-family: var(--font-mono); padding: 3px 0;">
                    <span style="color: var(--color-danger); font-weight: 700;">${Currency.formatCryptoPrice(a.price)}</span>
                    <span style="color: var(--text-secondary);">${a.quantity}</span>
                    <span style="color: var(--text-muted);">${Currency.format(a.total)}</span>
                </div>
            `).join('');

            const bidsRows = bids.slice(0, 5).map(b => `
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-family: var(--font-mono); padding: 3px 0;">
                    <span style="color: var(--color-success); font-weight: 700;">${Currency.formatCryptoPrice(b.price)}</span>
                    <span style="color: var(--text-secondary);">${b.quantity}</span>
                    <span style="color: var(--text-muted);">${Currency.format(b.total)}</span>
                </div>
            `).join('');

            obContainer.innerHTML = `
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); font-weight: 600; padding-bottom: 6px; border-bottom: 1px solid var(--border-color); margin-bottom: 6px;">
                    <span>Price</span>
                    <span>Size</span>
                    <span>Total</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                    ${asksRows}
                    <div style="text-align: center; padding: 6px 0; margin: 4px 0; background: rgba(255,255,255,0.02); font-weight: 700; font-size: 0.85rem; font-family: var(--font-mono); border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color);">
                        Spread: 0.05%
                    </div>
                    ${bidsRows}
                </div>
            `;
        } catch (e) {
            obContainer.innerHTML = `<div style="color: var(--color-danger); font-size: 0.8rem;">Orderbook unavailable</div>`;
        }
    },

    attachDetailEvents(container, crypto) {
        // Timeframe selector
        container.querySelectorAll('#timeframe-buttons button').forEach(btn => {
            btn.onclick = () => {
                const tf = btn.getAttribute('data-tf');
                this.currentTimeframe = tf;
                container.querySelectorAll('#timeframe-buttons button').forEach(b => b.className = 'btn btn-outline');
                btn.className = 'btn btn-primary';
                this.renderChart(crypto.id, tf);
            };
        });

        // Tabs
        const eduBtn = container.querySelector('#tab-edu-btn');
        const riskBtn = container.querySelector('#tab-risk-btn');
        const eduContent = container.querySelector('#tab-edu-content');
        const riskContent = container.querySelector('#tab-risk-content');

        eduBtn.onclick = () => {
            eduBtn.className = 'btn btn-primary';
            riskBtn.className = 'btn btn-outline';
            eduContent.classList.remove('hidden');
            riskContent.classList.add('hidden');
        };

        riskBtn.onclick = () => {
            riskBtn.className = 'btn btn-primary';
            eduBtn.className = 'btn btn-outline';
            riskContent.classList.remove('hidden');
            eduContent.classList.add('hidden');
        };
    }
};

window.CryptoDetailView = CryptoDetailView;

