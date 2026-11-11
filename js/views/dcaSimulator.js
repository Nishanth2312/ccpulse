/**
 * CCPulse Dollar Cost Averaging (DCA) Simulation Lab
 * Interactive mathematical simulator demonstrating systematic recurring investments vs lump sum.
 */
const DCASimulatorView = {
    selectedSymbol: 'BTC',
    investmentAmount: 100,
    frequency: 'weekly', // daily, weekly, biweekly, monthly
    durationMonths: 12, // 3, 6, 12, 24, 36

    getCoinList() {
        if (typeof State !== 'undefined' && State.cryptos && State.cryptos.length > 0) {
            return State.cryptos;
        }
        if (typeof CLIENT_STATIC_COINS !== 'undefined') {
            return CLIENT_STATIC_COINS;
        }
        return [
            { id: 1, name: 'Bitcoin', symbol: 'BTC', current_price_usd: 73932.53 },
            { id: 2, name: 'Ethereum', symbol: 'ETH', current_price_usd: 2056.93 },
            { id: 5, name: 'Solana', symbol: 'SOL', current_price_usd: 83.75 },
            { id: 13, name: 'Monero', symbol: 'XMR', current_price_usd: 158.40 },
            { id: 14, name: 'Beldex', symbol: 'BDX', current_price_usd: 0.0722 }
        ];
    },

    computeDCAResults() {
        const coins = this.getCoinList();
        const coin = coins.find(c => c.symbol === this.selectedSymbol) || coins[0];
        const currentPrice = coin.current_price_usd || 100;

        // Determine number of periods
        let periods = 0;
        let daysPerPeriod = 7;
        const totalDays = this.durationMonths * 30;

        if (this.frequency === 'daily') {
            periods = totalDays;
            daysPerPeriod = 1;
        } else if (this.frequency === 'weekly') {
            periods = Math.floor(totalDays / 7);
            daysPerPeriod = 7;
        } else if (this.frequency === 'biweekly') {
            periods = Math.floor(totalDays / 14);
            daysPerPeriod = 14;
        } else if (this.frequency === 'monthly') {
            periods = this.durationMonths;
            daysPerPeriod = 30;
        }

        const totalInvested = periods * this.investmentAmount;

        // Generate synthetic realistic historical price timeline
        // based on volatility characteristics of the asset
        const volatilityMap = {
            BTC: 0.04, ETH: 0.05, SOL: 0.07, XMR: 0.05, BDX: 0.08, DOGE: 0.09, PEPE: 0.12
        };
        const vol = volatilityMap[coin.symbol] || 0.06;

        // Simulate start price at start of duration (e.g. 1 year ago)
        // Let's create realistic harmonic waves with upward drift
        const points = [];
        let accumulatedCrypto = 0;
        let cumulativeInvested = 0;

        // Start price from 15% to 45% lower or higher depending on market cycle
        const cycleFactor = 0.72 + (coin.symbol.charCodeAt(0) % 20) * 0.015;
        const initialPrice = currentPrice * cycleFactor;

        for (let i = 0; i <= periods; i++) {
            const progress = i / periods; // 0 to 1
            // Wave formulation: drift + periodic cycles
            const wave = Math.sin(progress * Math.PI * 3.2) * (vol * 3.5);
            const secondaryWave = Math.cos(progress * Math.PI * 5) * (vol * 1.5);
            const trend = (currentPrice - initialPrice) * progress;
            const priceAtT = Math.max(currentPrice * 0.15, initialPrice + trend + (initialPrice * (wave + secondaryWave) * 0.25));

            if (i > 0) {
                const boughtCrypto = this.investmentAmount / priceAtT;
                accumulatedCrypto += boughtCrypto;
                cumulativeInvested += this.investmentAmount;
            }

            const portfolioVal = accumulatedCrypto * priceAtT;

            points.push({
                period: i,
                dateOffsetDays: i * daysPerPeriod,
                price: priceAtT,
                invested: cumulativeInvested,
                accumulatedCrypto,
                portfolioValue: portfolioVal
            });
        }

        const currentVal = accumulatedCrypto * currentPrice;
        const pnlUsd = currentVal - totalInvested;
        const pnlPct = totalInvested > 0 ? (pnlUsd / totalInvested) * 100 : 0;
        const avgBuyPrice = accumulatedCrypto > 0 ? (totalInvested / accumulatedCrypto) : currentPrice;

        // Lump sum comparison: what if user invested totalInvested on day 0
        const lumpSumCrypto = totalInvested / initialPrice;
        const lumpSumCurrentVal = lumpSumCrypto * currentPrice;
        const lumpSumPnlUsd = lumpSumCurrentVal - totalInvested;
        const lumpSumPnlPct = totalInvested > 0 ? (lumpSumPnlUsd / totalInvested) * 100 : 0;

        return {
            coin,
            periods,
            totalInvested,
            accumulatedCrypto,
            currentPrice,
            initialPrice,
            avgBuyPrice,
            currentVal,
            pnlUsd,
            pnlPct,
            lumpSumCurrentVal,
            lumpSumPnlUsd,
            lumpSumPnlPct,
            timeline: points
        };
    },

    renderChartSVG(timeline) {
        if (!timeline || timeline.length < 2) return '';
        const width = 640;
        const height = 240;
        const pad = { top: 20, right: 30, bottom: 30, left: 60 };

        const innerW = width - pad.left - pad.right;
        const innerH = height - pad.top - pad.bottom;

        const maxVal = Math.max(...timeline.map(p => Math.max(p.invested, p.portfolioValue)), 100);
        const minVal = 0;

        const getX = (idx) => pad.left + (idx / (timeline.length - 1)) * innerW;
        const getY = (val) => pad.top + innerH - ((val - minVal) / (maxVal - minVal)) * innerH;

        // Invested Path (Dashed gray)
        const investedPath = timeline.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.invested).toFixed(1)}`).join(' ');

        // Value Path (Green solid)
        const valuePath = timeline.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.portfolioValue).toFixed(1)}`).join(' ');

        // Area under Value Path
        const areaPath = `${valuePath} L ${getX(timeline.length - 1).toFixed(1)} ${(pad.top + innerH).toFixed(1)} L ${getX(0).toFixed(1)} ${(pad.top + innerH).toFixed(1)} Z`;

        return `
            <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; max-height: 260px; overflow: visible;">
                <defs>
                    <linearGradient id="dcaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#16C784" stop-opacity="0.35"/>
                        <stop offset="100%" stop-color="#16C784" stop-opacity="0.0"/>
                    </linearGradient>
                </defs>

                <!-- Grid lines -->
                <line x1="${pad.left}" y1="${pad.top}" x2="${width - pad.right}" y2="${pad.top}" stroke="rgba(255,255,255,0.06)" />
                <line x1="${pad.left}" y1="${pad.top + innerH * 0.5}" x2="${width - pad.right}" y2="${pad.top + innerH * 0.5}" stroke="rgba(255,255,255,0.06)" />
                <line x1="${pad.left}" y1="${pad.top + innerH}" x2="${width - pad.right}" y2="${pad.top + innerH}" stroke="rgba(255,255,255,0.12)" />

                <!-- Value Area Fill -->
                <path d="${areaPath}" fill="url(#dcaGrad)" />

                <!-- Invested Line (dashed) -->
                <path d="${investedPath}" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-dasharray="4,4" />

                <!-- Portfolio Value Line -->
                <path d="${valuePath}" fill="none" stroke="#16C784" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

                <!-- End point markers -->
                <circle cx="${getX(timeline.length - 1)}" cy="${getY(timeline[timeline.length - 1].portfolioValue)}" r="5" fill="#16C784" stroke="#0C0E14" stroke-width="2" />
                <circle cx="${getX(timeline.length - 1)}" cy="${getY(timeline[timeline.length - 1].invested)}" r="4" fill="rgba(255,255,255,0.6)" />

                <!-- Axis Labels -->
                <text x="${pad.left - 8}" y="${pad.top + 4}" fill="var(--text-muted)" font-size="10" text-anchor="end" font-family="monospace">${Currency.format(maxVal)}</text>
                <text x="${pad.left - 8}" y="${pad.top + innerH}" fill="var(--text-muted)" font-size="10" text-anchor="end" font-family="monospace">$0</text>
                <text x="${pad.left}" y="${height - 8}" fill="var(--text-muted)" font-size="11">Start</text>
                <text x="${width - pad.right}" y="${height - 8}" fill="var(--text-muted)" font-size="11" text-anchor="end">Today</text>
            </svg>
        `;
    },

    async render(container) {
        const coins = this.getCoinList();
        const results = this.computeDCAResults();
        const isProfitable = results.pnlUsd >= 0;

        container.innerHTML = `
            <style>
                .dca-panel {
                    display: grid;
                    grid-template-columns: 360px 1fr;
                    gap: 28px;
                    margin-bottom: 32px;
                }
                @media (max-width: 980px) {
                    .dca-panel {
                        grid-template-columns: 1fr;
                    }
                }
                .dca-config-card {
                    background: var(--bg-surface);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-lg, 16px);
                    padding: 24px;
                }
                .dca-results-card {
                    background: var(--bg-surface);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-lg, 16px);
                    padding: 28px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                .dca-metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .dca-metric-box {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 14px 16px;
                }
                .dca-metric-label {
                    font-size: 0.76rem;
                    text-transform: uppercase;
                    color: var(--text-muted);
                    font-weight: 700;
                    margin-bottom: 4px;
                }
                .dca-metric-val {
                    font-size: 1.25rem;
                    font-weight: 800;
                    font-family: monospace;
                    color: var(--text-primary);
                }
                .dca-comparison-box {
                    background: rgba(22, 199, 132, 0.05);
                    border: 1px solid rgba(22, 199, 132, 0.2);
                    border-radius: 14px;
                    padding: 20px;
                    margin-top: 24px;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                @media (max-width: 600px) {
                    .dca-comparison-box {
                        grid-template-columns: 1fr;
                    }
                }
                .dca-pill-group {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .dca-pill-btn {
                    padding: 6px 14px;
                    border-radius: 20px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid var(--border-color);
                    color: var(--text-secondary);
                    font-size: 0.82rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .dca-pill-btn.active {
                    background: var(--color-primary);
                    color: #0C0E14;
                    border-color: var(--color-primary);
                }
            </style>

            <!-- Header -->
            <div style="margin-bottom: 28px;">
                <h1 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 6px;">
                    <i class="fa-solid fa-calculator text-cyan"></i> Dollar Cost Averaging (DCA) Simulator
                </h1>
                <p style="color: var(--text-secondary); font-size: 0.95rem; margin: 0;">
                    Simulate how recurring automated purchases neutralize cryptocurrency volatility and outperform emotional market timing.
                </p>
            </div>

            <!-- Interactive Panel -->
            <div class="dca-panel">
                <!-- Left Configuration Controls -->
                <div class="dca-config-card">
                    <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-sliders text-success"></i> Strategy Parameters
                    </h3>

                    <!-- Asset Selector -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 0.82rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px;">
                            Cryptocurrency Asset
                        </label>
                        <select id="dca-coin-select" class="form-control" style="width: 100%; padding: 10px 14px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 10px; color: var(--text-primary); font-weight: 700;">
                            ${coins.map(c => `
                                <option value="${c.symbol}" ${c.symbol === this.selectedSymbol ? 'selected' : ''}>
                                    ${c.name} (${c.symbol}) &bull; ${Currency.format(c.current_price_usd)}
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Recurring Amount -->
                    <div style="margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-secondary);">
                                Amount per Cycle (USD)
                            </label>
                            <span style="font-size: 0.82rem; font-weight: 800; color: var(--color-primary); font-family: monospace;">
                                $${this.investmentAmount} USD
                            </span>
                        </div>
                        <input type="range" id="dca-amount-slider" min="10" max="1000" step="10" value="${this.investmentAmount}" style="width: 100%; accent-color: var(--color-primary); cursor: pointer;" />
                        <div class="dca-pill-group" style="margin-top: 8px;">
                            <button type="button" class="dca-pill-btn ${this.investmentAmount === 25 ? 'active' : ''}" data-amount="25">$25</button>
                            <button type="button" class="dca-pill-btn ${this.investmentAmount === 50 ? 'active' : ''}" data-amount="50">$50</button>
                            <button type="button" class="dca-pill-btn ${this.investmentAmount === 100 ? 'active' : ''}" data-amount="100">$100</button>
                            <button type="button" class="dca-pill-btn ${this.investmentAmount === 250 ? 'active' : ''}" data-amount="250">$250</button>
                            <button type="button" class="dca-pill-btn ${this.investmentAmount === 500 ? 'active' : ''}" data-amount="500">$500</button>
                        </div>
                    </div>

                    <!-- Frequency -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 0.82rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px;">
                            Purchase Frequency
                        </label>
                        <div class="dca-pill-group">
                            <button type="button" class="dca-pill-btn ${this.frequency === 'daily' ? 'active' : ''}" data-freq="daily">Daily</button>
                            <button type="button" class="dca-pill-btn ${this.frequency === 'weekly' ? 'active' : ''}" data-freq="weekly">Weekly</button>
                            <button type="button" class="dca-pill-btn ${this.frequency === 'biweekly' ? 'active' : ''}" data-freq="biweekly">Every 2 Weeks</button>
                            <button type="button" class="dca-pill-btn ${this.frequency === 'monthly' ? 'active' : ''}" data-freq="monthly">Monthly</button>
                        </div>
                    </div>

                    <!-- Horizon Duration -->
                    <div style="margin-bottom: 24px;">
                        <label style="display: block; font-size: 0.82rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px;">
                            Investment Duration
                        </label>
                        <div class="dca-pill-group">
                            <button type="button" class="dca-pill-btn ${this.durationMonths === 3 ? 'active' : ''}" data-duration="3">3 Months</button>
                            <button type="button" class="dca-pill-btn ${this.durationMonths === 6 ? 'active' : ''}" data-duration="6">6 Months</button>
                            <button type="button" class="dca-pill-btn ${this.durationMonths === 12 ? 'active' : ''}" data-duration="12">1 Year</button>
                            <button type="button" class="dca-pill-btn ${this.durationMonths === 24 ? 'active' : ''}" data-duration="24">2 Years</button>
                            <button type="button" class="dca-pill-btn ${this.durationMonths === 36 ? 'active' : ''}" data-duration="36">3 Years</button>
                        </div>
                    </div>

                    <div style="border-top: 1px solid var(--border-color); padding-top: 18px;">
                        <a href="#simulator?coin=${this.selectedSymbol}" class="btn btn-primary" style="width: 100%; text-align: center; font-weight: 800; padding: 12px;">
                            <i class="fa-solid fa-bolt"></i> Trade ${this.selectedSymbol} in Simulator
                        </a>
                    </div>
                </div>

                <!-- Right Results & Chart -->
                <div class="dca-results-card">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
                            <div>
                                <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">
                                    ${this.durationMonths}-Month Simulation Outcome
                                </span>
                                <h2 style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin-top: 4px;">
                                    ${Currency.format(results.currentVal)}
                                    <span style="font-size: 1.05rem; font-weight: 700; color: ${isProfitable ? 'var(--color-success)' : 'var(--color-danger)'}; margin-left: 8px;">
                                        <i class="fa-solid ${isProfitable ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i>
                                        ${isProfitable ? '+' : ''}${results.pnlPct.toFixed(2)}%
                                    </span>
                                </h2>
                            </div>

                            <div style="display: flex; gap: 14px; align-items: center; font-size: 0.8rem;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span style="width: 12px; height: 12px; border-radius: 3px; background: #16C784;"></span>
                                    <span style="color: var(--text-secondary);">DCA Value</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span style="width: 12px; height: 2px; background: rgba(255,255,255,0.4); border-top: 2px dashed rgba(255,255,255,0.6);"></span>
                                    <span style="color: var(--text-secondary);">Total Invested</span>
                                </div>
                            </div>
                        </div>

                        <!-- Metrics Grid -->
                        <div class="dca-metrics-grid">
                            <div class="dca-metric-box">
                                <div class="dca-metric-label">Total Invested</div>
                                <div class="dca-metric-val">${Currency.format(results.totalInvested)}</div>
                                <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">${results.periods} Total Orders</div>
                            </div>
                            <div class="dca-metric-box">
                                <div class="dca-metric-label">Coins Accumulated</div>
                                <div class="dca-metric-val" style="color: var(--color-primary);">${results.accumulatedCrypto.toFixed(6)} ${results.coin.symbol}</div>
                                <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">at spot market rates</div>
                            </div>
                            <div class="dca-metric-box">
                                <div class="dca-metric-label">Average Buy Price</div>
                                <div class="dca-metric-val">${Currency.format(results.avgBuyPrice)}</div>
                                <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">Current: ${Currency.format(results.currentPrice)}</div>
                            </div>
                            <div class="dca-metric-box">
                                <div class="dca-metric-label">Net Return</div>
                                <div class="dca-metric-val" style="color: ${isProfitable ? 'var(--color-success)' : 'var(--color-danger)'};">
                                    ${isProfitable ? '+' : ''}${Currency.format(results.pnlUsd)}
                                </div>
                                <div style="font-size: 0.74rem; color: ${isProfitable ? 'var(--color-success)' : 'var(--color-danger)'}; margin-top: 2px;">
                                    ${results.pnlPct.toFixed(2)}% ROI
                                </div>
                            </div>
                        </div>

                        <!-- Chart -->
                        <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                            ${this.renderChartSVG(results.timeline)}
                        </div>
                    </div>

                    <!-- Comparison Box: DCA vs Lump Sum -->
                    <div class="dca-comparison-box">
                        <div>
                            <div style="font-size: 0.76rem; font-weight: 700; text-transform: uppercase; color: var(--color-primary); margin-bottom: 4px;">
                                <i class="fa-solid fa-shield-halved"></i> DCA Strategy Advantage
                            </div>
                            <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">
                                ${Currency.format(results.currentVal)} (${results.pnlPct >= 0 ? '+' : ''}${results.pnlPct.toFixed(1)}%)
                            </div>
                            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0; line-height: 1.4;">
                                Buying periodically shields you against local market tops and avoids the anxiety of timing the exact bottom.
                            </p>
                        </div>
                        <div>
                            <div style="font-size: 0.76rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">
                                <i class="fa-solid fa-coins"></i> Lump Sum Comparison
                            </div>
                            <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-secondary); margin-bottom: 4px;">
                                ${Currency.format(results.lumpSumCurrentVal)} (${results.lumpSumPnlPct >= 0 ? '+' : ''}${results.lumpSumPnlPct.toFixed(1)}%)
                            </div>
                            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0; line-height: 1.4;">
                                Single upfront purchase of ${Currency.format(results.totalInvested)} on day one @ ${Currency.format(results.initialPrice)}.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Educational Section -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <div class="glass-card" style="padding: 24px;">
                    <div style="font-size: 1.4rem; color: var(--color-primary); margin-bottom: 12px;">
                        <i class="fa-solid fa-brain"></i>
                    </div>
                    <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 8px;">Removes Market Timing Stress</h3>
                    <p style="font-size: 0.86rem; color: var(--text-secondary); line-height: 1.6; margin: 0;">
                        Even institutional professionals struggle to predict exact market cycles. DCA converts volatile swings into opportunities to accumulate assets at discount prices.
                    </p>
                </div>

                <div class="glass-card" style="padding: 24px;">
                    <div style="font-size: 1.4rem; color: #8B5CF6; margin-bottom: 12px;">
                        <i class="fa-solid fa-cubes"></i>
                    </div>
                    <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 8px;">Mathematical Downside Cushion</h3>
                    <p style="font-size: 0.86rem; color: var(--text-secondary); line-height: 1.6; margin: 0;">
                        When asset prices plummet, your fixed recurring payment automatically purchases a larger quantity of tokens, lowering your overall breakeven threshold.
                    </p>
                </div>

                <div class="glass-card" style="padding: 24px;">
                    <div style="font-size: 1.4rem; color: #06B6D4; margin-bottom: 12px;">
                        <i class="fa-solid fa-compass"></i>
                    </div>
                    <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 8px;">Risk-Free Educational Practice</h3>
                    <p style="font-size: 0.86rem; color: var(--text-secondary); line-height: 1.6; margin: 0;">
                        Experiment with different asset classes — from large-cap Layer 1s to privacy ecosystems — without risking real capital before entering live markets.
                    </p>
                </div>
            </div>
        `;

        this.bindEvents(container);
    },

    bindEvents(container) {
        const coinSelect = container.querySelector('#dca-coin-select');
        if (coinSelect) {
            coinSelect.onchange = () => {
                this.selectedSymbol = coinSelect.value;
                this.render(container);
            };
        }

        const slider = container.querySelector('#dca-amount-slider');
        if (slider) {
            slider.oninput = () => {
                this.investmentAmount = parseInt(slider.value, 10);
                this.render(container);
            };
        }

        container.querySelectorAll('[data-amount]').forEach(btn => {
            btn.onclick = () => {
                this.investmentAmount = parseInt(btn.getAttribute('data-amount'), 10);
                this.render(container);
            };
        });

        container.querySelectorAll('[data-freq]').forEach(btn => {
            btn.onclick = () => {
                this.frequency = btn.getAttribute('data-freq');
                this.render(container);
            };
        });

        container.querySelectorAll('[data-duration]').forEach(btn => {
            btn.onclick = () => {
                this.durationMonths = parseInt(btn.getAttribute('data-duration'), 10);
                this.render(container);
            };
        });
    }
};

window.DCASimulatorView = DCASimulatorView;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DCASimulatorView;
}
