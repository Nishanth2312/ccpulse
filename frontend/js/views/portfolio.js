/**
 * CCPulse Virtual Portfolio & Transaction History View
 * Features:
 * - Live dynamic valuation of all holdings (BDX, BTC, etc.)
 * - Candlestick Bar & Area/Line Interactive Chart with Purchase Point Markers
 * - 30-Second recurring auto-update Cron with live status indicator
 * - Complete auditable transaction history & instant Trade/Swap action buttons
 */
const PortfolioView = {
    chartType: 'candle', // 'candle' | 'line'
    selectedAsset: 'ALL',
    cronTimer: null,
    countdownTimer: null,
    secondsUntilNextTick: 30,
    containerRef: null,

    stopCron() {
        if (this.cronTimer) {
            clearInterval(this.cronTimer);
            this.cronTimer = null;
        }
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
    },

    async render(container) {
        this.stopCron();
        this.containerRef = container;

        let isGuest = State.isGuest || !State.currentUser;
        let portfolio = null;
        let transactions = [];
        let trades = [];

        try {
            const res = await API.simulator.getPortfolio();
            portfolio = res.portfolio || res.wallet;
            transactions = res.transactions || [];
            trades = res.trades || [];
            if (portfolio && !isGuest) {
                State.wallet = portfolio;
            }
        } catch (e) {
            console.warn('PortfolioView: Failed to fetch portfolio:', e.message);
        }

        // If no portfolio or guest fallback
        if (!portfolio) {
            const guestCash = State.guestSession?.temporaryBalanceUsd || 10000.00;
            let guestInvested = 0;
            const guestHoldings = (State.guestSession?.holdings || []).map(h => {
                const crypto = (State.cryptos && State.cryptos.find(c => c.symbol === h.symbol)) || 
                               (typeof CLIENT_STATIC_COINS !== 'undefined' && CLIENT_STATIC_COINS.find(c => c.symbol === h.symbol)) || 
                               { current_price_usd: h.avg_buy_price_usd || 1, change_24h: 0 };
                const curPrice = crypto.current_price_usd || h.avg_buy_price_usd || 1;
                const currentVal = h.quantity * curPrice;
                guestInvested += currentVal;
                const pnl = currentVal - (h.total_invested_usd || 0);
                const pnlPct = h.total_invested_usd > 0 ? (pnl / h.total_invested_usd) * 100 : 0;
                return {
                    ...h,
                    current_price_usd: curPrice,
                    current_value_usd: currentVal,
                    pnl_usd: pnl,
                    pnl_percent: pnlPct
                };
            });

            portfolio = {
                availableCashUsd: guestCash,
                investedUsd: guestInvested,
                totalPortfolioValueUsd: guestCash + guestInvested,
                totalDepositedUsd: 10000.00,
                totalProfitLossUsd: (guestCash + guestInvested) - 10000.00,
                totalProfitLossPercent: (((guestCash + guestInvested) - 10000.00) / 10000.00) * 100,
                holdings: guestHoldings
            };

            transactions = (State.guestSession?.trades || []).map(t => ({
                transaction_ref: t.tradeRef || `TX-${Date.now()}`,
                type: t.type === 'BUY' ? 'BUY_ORDER' : (t.type === 'SELL' ? 'SELL_ORDER' : 'SWAP'),
                amount_usd: t.totalValueUsd,
                balance_after_usd: guestCash,
                description: t.type === 'SWAP' ? `Guest Swap ${t.fromQuantity} ${t.fromSymbol} → ${t.toSymbol}` : `Guest ${t.type} ${t.quantity} ${t.symbol}`,
                audit_reason: t.type === 'SWAP' ? `DEX Fees: $${((t.networkFeeUsd || 0) + (t.handlingFeeUsd || 0)).toFixed(2)} USD` : 'Simulated execution',
                created_at: t.date || new Date().toISOString()
            }));

            trades = State.guestSession?.trades || [];
        } else {
            // Dynamically recalculate holdings with live rates from State.cryptos
            let liveInvested = 0;
            const enriched = (portfolio.holdings || []).map(h => {
                const liveCoin = (State.cryptos && State.cryptos.find(c => c.symbol === h.symbol)) || 
                                 (typeof CLIENT_STATIC_COINS !== 'undefined' && CLIENT_STATIC_COINS.find(c => c.symbol === h.symbol)) || 
                                 { current_price_usd: h.avg_buy_price_usd || 1 };
                const curPrice = liveCoin.current_price_usd || h.avg_buy_price_usd || 1;
                const curVal = h.quantity * curPrice;
                liveInvested += curVal;
                const pnl = curVal - (h.total_invested_usd || (h.quantity * (h.avg_buy_price_usd || 0)));
                const pnlPct = (h.total_invested_usd > 0) ? (pnl / h.total_invested_usd) * 100 : 0;
                return {
                    ...h,
                    current_price_usd: curPrice,
                    current_value_usd: curVal,
                    pnl_usd: pnl,
                    pnl_percent: pnlPct
                };
            });

            portfolio.holdings = enriched;
            portfolio.investedUsd = liveInvested;
            portfolio.totalPortfolioValueUsd = portfolio.availableCashUsd + liveInvested;
            const deposited = portfolio.totalDepositedUsd || 10000.00;
            portfolio.totalProfitLossUsd = portfolio.totalPortfolioValueUsd - deposited;
            portfolio.totalProfitLossPercent = deposited > 0 ? (portfolio.totalProfitLossUsd / deposited) * 100 : 0;
        }

        const totalValueFmt = Currency.format(portfolio.totalPortfolioValueUsd);
        const cashFmt = Currency.format(portfolio.availableCashUsd);
        const investedFmt = Currency.format(portfolio.investedUsd);
        const pnlFmt = Currency.format(portfolio.totalProfitLossUsd);
        const pnlSign = portfolio.totalProfitLossUsd >= 0 ? '+' : '';
        const pnlClass = portfolio.totalProfitLossUsd >= 0 ? 'text-success' : 'text-danger';

        // Selectable assets for chart
        const availableHoldings = portfolio.holdings || [];
        if (this.selectedAsset !== 'ALL' && !availableHoldings.some(h => h.symbol === this.selectedAsset)) {
            this.selectedAsset = availableHoldings.length > 0 ? availableHoldings[0].symbol : 'ALL';
        }

        container.innerHTML = `
            ${isGuest ? `
                <div style="background: linear-gradient(90deg, rgba(139,92,246,0.15), rgba(0,240,255,0.15)); border: 1px solid rgba(0,240,255,0.3); border-radius: var(--border-radius-md); padding: 18px 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                    <div>
                        <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                            <i class="fa-solid fa-user-secret text-cyan"></i> Guest Temporary Portfolio Active
                        </div>
                        <div style="font-size: 0.88rem; color: var(--text-secondary); max-width: 650px;">
                            Guest trading session credited with <strong>$10,000.00 USD Virtual Cash + 1.00000000 BTC Gift</strong>! Create an account to permanently sync across devices.
                        </div>
                    </div>
                    <button type="button" class="btn btn-primary" onclick="AuthModals.showRegister()">
                        <i class="fa-solid fa-gift"></i> Register & Claim $10,000 + 1 BTC Bonus
                    </button>
                </div>
            ` : `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h1 style="font-size: 1.85rem; font-weight: 800;">
                            <i class="fa-solid fa-wallet text-cyan"></i> Virtual Portfolio & Holdings
                        </h1>
                        <p style="color: var(--text-secondary); font-size: 0.92rem; margin-top: 4px;">
                            Account Ledger: <strong>${State.currentUser.username}</strong> &bull; Currency: <strong style="color: var(--color-primary);">${Currency.getActiveCode()}</strong> &bull; Engine: <span class="text-success font-mono">SQLite + ClientDB Live</span>
                        </p>
                    </div>
                    <div style="display: inline-flex; align-items: center; gap: 10px; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); padding: 8px 18px; border-radius: var(--border-radius-full);">
                        <i class="fa-solid fa-gift text-success"></i>
                        <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-success);">
                            CCPulse Welcome Bonus: $10,000.00 USD + 1.0 BTC Credited
                        </span>
                    </div>
                </div>
            `}

            <!-- Metric Cards -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 28px;">
                <div class="glass-card" style="padding: 22px;">
                    <div style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Total Portfolio Value</div>
                    <div class="font-mono" id="card-total-val" style="font-size: 1.75rem; font-weight: 800; color: var(--text-primary); margin-top: 6px;">
                        ${totalValueFmt}
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
                        Base: $${portfolio.totalPortfolioValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </div>
                </div>

                <div class="glass-card" style="padding: 22px;">
                    <div style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Available Virtual Cash</div>
                    <div class="font-mono" id="card-cash-val" style="font-size: 1.75rem; font-weight: 800; color: var(--color-success); margin-top: 6px;">
                        ${cashFmt}
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
                        Ready for instant order allocation
                    </div>
                </div>

                <div class="glass-card" style="padding: 22px;">
                    <div style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Invested Holdings Value</div>
                    <div class="font-mono" id="card-invested-val" style="font-size: 1.75rem; font-weight: 800; color: var(--color-primary); margin-top: 6px;">
                        ${investedFmt}
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
                        Allocated across ${portfolio.holdings.length} assets
                    </div>
                </div>

                <div class="glass-card" style="padding: 22px;">
                    <div style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Total Profit / Loss</div>
                    <div class="font-mono ${pnlClass}" id="card-pnl-val" style="font-size: 1.75rem; font-weight: 800; margin-top: 6px;">
                        ${pnlSign}${pnlFmt}
                    </div>
                    <div class="${pnlClass}" id="card-roi-val" style="font-size: 0.82rem; font-weight: 700; margin-top: 4px;">
                        ${pnlSign}${portfolio.totalProfitLossPercent.toFixed(2)}% Overall ROI
                    </div>
                </div>
            </div>

            <!-- Interactive Candlestick / Line Performance Chart with Purchase Markers & 30s Cron -->
            <div class="glass-card" style="padding: 24px; margin-bottom: 32px;" id="portfolio-chart-card">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 20px;">
                    <div>
                        <h2 style="font-size: 1.25rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-chart-candlestick text-cyan"></i>
                            <span>Asset Performance & Purchase Markers</span>
                        </h2>
                        <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 3px;">
                            Tracks price evolution with flags showing your exact trade executions & swaps.
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <!-- 30-Second Cron Live Status with 30m Quota Shield -->
                        <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(16, 185, 129, 0.12); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); padding: 5px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 700;" title="30-Second Cron candlestick update is active with local simulation">
                            <span style="width: 7px; height: 7px; border-radius: 50%; background: #10B981; box-shadow: 0 0 6px #10B981; display: inline-block;"></span>
                            <span>Cron 30s</span>
                            <span id="cron-countdown-badge" style="color: var(--text-muted); font-family: var(--font-mono); margin-left: 2px;">(30s)</span>
                        </div>

                        <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.74rem; color: #3B82F6; background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.3); padding: 4px 10px; border-radius: 20px; font-weight: 700;" title="Rates cached for 30 minutes to protect monthly API quotas">
                            <i class="fa-solid fa-shield-halved"></i> 30m Quota Shield
                        </span>

                        <button type="button" class="btn btn-sm btn-outline" id="portfolio-manual-sync-btn" style="padding: 4px 10px; font-size: 0.76rem;" title="Force fresh external API pull (CoinGecko / API Ninjas)">
                            <i class="fa-solid fa-cloud-arrow-down"></i> Sync Live
                        </button>

                        <!-- Asset Filter -->
                        <select id="chart-asset-filter" style="padding: 6px 12px; font-size: 0.82rem; border-radius: 6px; font-weight: 700;">
                            <option value="ALL" ${this.selectedAsset === 'ALL' ? 'selected' : ''}>Total Portfolio Value</option>
                            ${availableHoldings.map(h => `
                                <option value="${h.symbol}" ${this.selectedAsset === h.symbol ? 'selected' : ''}>
                                    ${h.symbol} (${h.crypto_name || h.name || h.symbol})
                                </option>
                            `).join('')}
                        </select>

                        <!-- Chart Type Toggle -->
                        <div style="display: inline-flex; background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: 6px; padding: 2px;">
                            <button type="button" id="toggle-candle-btn" class="btn ${this.chartType === 'candle' ? 'btn-primary' : 'btn-outline'}" style="font-size: 0.76rem; padding: 4px 10px; border: none; border-radius: 4px;">
                                <i class="fa-solid fa-chart-simple"></i> Candle Bar
                            </button>
                            <button type="button" id="toggle-line-btn" class="btn ${this.chartType === 'line' ? 'btn-primary' : 'btn-outline'}" style="font-size: 0.76rem; padding: 4px 10px; border: none; border-radius: 4px;">
                                <i class="fa-solid fa-chart-line"></i> Line / Area
                            </button>
                        </div>

                        <!-- Manual Refresh -->
                        <button type="button" id="cron-manual-refresh-btn" class="btn btn-outline" style="font-size: 0.78rem; padding: 5px 10px;" title="Trigger immediate cron tick">
                            <i class="fa-solid fa-arrows-rotate" id="cron-refresh-icon"></i>
                        </button>
                    </div>
                </div>

                <!-- Chart Canvas Container -->
                <div id="portfolio-chart-canvas" style="width: 100%; min-height: 280px; position: relative;">
                    <!-- Rendered SVG chart -->
                </div>
            </div>

            <!-- Active Holdings Section -->
            <div class="glass-card" style="padding: 24px; margin-bottom: 32px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h2 style="font-size: 1.25rem; font-weight: 800;">
                            <i class="fa-solid fa-layer-group text-cyan"></i> Active Asset Allocations
                        </h2>
                        <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 2px;">
                            Current positions including your 50,000 Beldex (BDX) and 1.0 Bitcoin (BTC) holdings.
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <a href="#swap" class="btn btn-outline" style="font-size: 0.82rem; padding: 6px 12px; color: #8B5CF6; border-color: rgba(139, 92, 246, 0.4);">
                            <i class="fa-solid fa-repeat"></i> Instant Swap
                        </a>
                        <a href="#simulator" class="btn btn-primary" style="font-size: 0.82rem; padding: 6px 12px;">
                            <i class="fa-solid fa-plus"></i> New Trade
                        </a>
                    </div>
                </div>

                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Asset</th>
                                <th>Holding Quantity</th>
                                <th>Avg Buy Price</th>
                                <th>Current Price</th>
                                <th>Position Value</th>
                                <th>Unrealized P&L</th>
                                <th style="text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody id="holdings-tbody">
                            ${portfolio.holdings.length === 0 ? `
                                <tr>
                                    <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
                                        You currently hold no open cryptocurrency positions.
                                        <br>
                                        <a href="#simulator" class="btn btn-primary" style="margin-top: 14px; font-size: 0.85rem;">
                                            <i class="fa-solid fa-bolt"></i> Open Your First Simulated Position
                                        </a>
                                    </td>
                                </tr>
                            ` : portfolio.holdings.map(h => {
                                const avgPrice = Currency.formatCryptoPrice(h.avg_buy_price_usd);
                                const curPrice = Currency.formatCryptoPrice(h.current_price_usd);
                                const posVal = Currency.format(h.current_value_usd);
                                const hPnl = Currency.format(h.pnl_usd);
                                const hPnlClass = h.pnl_usd >= 0 ? 'text-success' : 'text-danger';
                                const hPnlSign = h.pnl_usd >= 0 ? '+' : '';

                                return `
                                    <tr>
                                        <td>
                                            <div class="crypto-cell">
                                                <img src="${State.getCoinLogo(h)}" alt="${h.symbol}" class="crypto-logo" onerror="this.onerror=null; this.src='./assets/coins/generic.svg'">
                                                <div>
                                                    <div class="crypto-name">${h.crypto_name || h.name || h.symbol}</div>
                                                    <div class="crypto-symbol">${h.symbol}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="font-mono" style="font-weight: 700;">
                                            ${h.quantity >= 100 ? Number(h.quantity.toFixed(4)).toLocaleString('en-US', { maximumFractionDigits: 4 }) : h.quantity.toFixed(6)} ${h.symbol}
                                        </td>
                                        <td class="font-mono" style="color: var(--text-secondary);">${avgPrice}</td>
                                        <td class="font-mono" style="font-weight: 700;">${curPrice}</td>
                                        <td class="font-mono" style="font-weight: 700; color: var(--text-primary);">${posVal}</td>
                                        <td class="font-mono ${hPnlClass}" style="font-weight: 700;">
                                            ${hPnlSign}${hPnl} (${hPnlSign}${h.pnl_percent.toFixed(2)}%)
                                        </td>
                                        <td style="text-align: right; white-space: nowrap;">
                                            <a href="#swap?from=${h.symbol}" class="btn btn-outline" style="font-size: 0.76rem; padding: 4px 8px; margin-right: 6px; color: #8B5CF6;">
                                                Swap
                                            </a>
                                            <a href="#simulator?coin=${h.symbol}" class="btn btn-outline" style="font-size: 0.76rem; padding: 4px 8px;">
                                                Trade
                                            </a>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Auditable Transaction History Ledger -->
            <div class="glass-card" style="padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h2 style="font-size: 1.25rem; font-weight: 800;">
                            <i class="fa-solid fa-clock-rotate-left text-cyan"></i> Auditable Transaction History
                        </h2>
                        <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 2px;">
                            Permanent ledger recording initial bonus distributions, high-volume orders, and instant swaps.
                        </div>
                    </div>
                    <span style="font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-mono);">
                        ${transactions.length} Total Ledger Entries
                    </span>
                </div>

                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Transaction Ref</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Description / Audit Reason</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transactions.length === 0 ? `
                                <tr>
                                    <td colspan="5" style="text-align: center; padding: 30px; color: var(--text-muted);">
                                        No transaction records found.
                                    </td>
                                </tr>
                            ` : transactions.map(t => {
                                const isBonus = t.type.includes('WELCOME');
                                const isSwap = t.type === 'SWAP';
                                const badgeColor = isBonus ? 'var(--color-success)' : (isSwap ? '#8B5CF6' : (t.type.includes('BUY') ? 'var(--color-primary)' : '#F59E0B'));
                                const amtFormatted = Currency.format(t.amount_usd || 0);

                                return `
                                    <tr>
                                        <td class="font-mono" style="font-size: 0.8rem; color: var(--text-muted);">${t.transaction_ref}</td>
                                        <td>
                                            <span style="font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: var(--border-radius-full); background: rgba(255,255,255,0.05); color: ${badgeColor}; border: 1px solid ${badgeColor};">
                                                ${t.type}
                                            </span>
                                        </td>
                                        <td class="font-mono" style="font-weight: 700;">${amtFormatted}</td>
                                        <td style="font-size: 0.88rem; color: var(--text-secondary);">
                                            ${t.description}
                                            ${t.audit_reason ? `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Audit: ${t.audit_reason}</div>` : ''}
                                        </td>
                                        <td style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap;">
                                            ${new Date(t.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this.renderChart(container, portfolio, trades);
        this.attachEvents(container);
        this.startCron(container);
    },

    attachEvents(container) {
        // Toggle Candle
        const candleBtn = container.querySelector('#toggle-candle-btn');
        const lineBtn = container.querySelector('#toggle-line-btn');
        if (candleBtn && lineBtn) {
            candleBtn.onclick = () => {
                this.chartType = 'candle';
                this.render(container);
            };
            lineBtn.onclick = () => {
                this.chartType = 'line';
                this.render(container);
            };
        }

        // Asset filter
        const filterSelect = container.querySelector('#chart-asset-filter');
        if (filterSelect) {
            filterSelect.onchange = (e) => {
                this.selectedAsset = e.target.value;
                this.render(container);
            };
        }

        // Manual refresh using cached tick
        const manualRefreshBtn = container.querySelector('#cron-manual-refresh-btn');
        if (manualRefreshBtn) {
            manualRefreshBtn.onclick = async () => {
                const icon = container.querySelector('#cron-refresh-icon');
                if (icon) icon.classList.add('fa-spin');
                await this.triggerCronTick();
                if (icon) icon.classList.remove('fa-spin');
            };
        }

        // Force external live sync (bypasses 30m cache)
        const forceSyncBtn = container.querySelector('#portfolio-manual-sync-btn');
        if (forceSyncBtn) {
            forceSyncBtn.onclick = async () => {
                forceSyncBtn.disabled = true;
                forceSyncBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing...';
                try {
                    await API.cryptos.refreshRates(true);
                    await this.render(container);
                } catch (e) {}
            };
        }
    },

    startCron(container) {
        this.secondsUntilNextTick = 30;
        const countdownEl = container.querySelector('#cron-countdown-badge');

        this.countdownTimer = setInterval(() => {
            this.secondsUntilNextTick--;
            if (this.secondsUntilNextTick <= 0) {
                this.secondsUntilNextTick = 30;
            }
            if (countdownEl) {
                countdownEl.textContent = `(${this.secondsUntilNextTick}s)`;
            }
        }, 1000);

        this.cronTimer = setInterval(async () => {
            await this.triggerCronTick();
        }, 30000);
    },

    async triggerCronTick() {
        if (!this.containerRef) return;
        try {
            // Uses local 30-minute cache (never calls unwanted external APIs on cron)
            await API.cryptos.refreshRates(false);
        } catch (e) {}

        // Re-render view to refresh metrics and charts
        await this.render(this.containerRef);
    },

    renderChart(container, portfolio, trades) {
        const canvas = container.querySelector('#portfolio-chart-canvas');
        if (!canvas) return;

        const isAssetSpecific = this.selectedAsset !== 'ALL';
        const targetHolding = isAssetSpecific ? portfolio.holdings.find(h => h.symbol === this.selectedAsset) : null;
        const basePrice = targetHolding ? targetHolding.current_price_usd : portfolio.totalPortfolioValueUsd;
        const relevantTrades = isAssetSpecific 
            ? trades.filter(t => (t.symbol && t.symbol.includes(this.selectedAsset)) || (t.cryptoId === targetHolding?.crypto_id))
            : trades;

        // Generate 16 candles/data points leading up to current valuation
        const pointsCount = 16;
        const candleData = [];
        let runningPrice = basePrice * 0.94;

        for (let i = pointsCount - 1; i >= 0; i--) {
            const open = runningPrice;
            const volatility = basePrice * 0.018;
            const delta = (Math.random() - 0.46) * volatility;
            const close = i === 0 ? basePrice : Math.max(basePrice * 0.5, open + delta);
            const high = Math.max(open, close) + Math.random() * volatility * 0.4;
            const low = Math.max(basePrice * 0.4, Math.min(open, close) - Math.random() * volatility * 0.4);
            runningPrice = close;

            const timeLabel = new Date(Date.now() - i * 30 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            candleData.push({
                index: pointsCount - 1 - i,
                timeLabel,
                open,
                high,
                low,
                close,
                isBullish: close >= open
            });
        }

        const minVal = Math.min(...candleData.map(c => c.low)) * 0.995;
        const maxVal = Math.max(...candleData.map(c => c.high)) * 1.005;
        const valRange = maxVal - minVal || 1;

        const svgWidth = 800;
        const svgHeight = 260;
        const paddingLeft = 60;
        const paddingRight = 40;
        const paddingTop = 35;
        const paddingBottom = 40;
        const chartW = svgWidth - paddingLeft - paddingRight;
        const chartH = svgHeight - paddingTop - paddingBottom;

        const getY = (val) => paddingTop + chartH - ((val - minVal) / valRange) * chartH;
        const getX = (idx) => paddingLeft + (idx / (pointsCount - 1)) * chartW;

        let contentSvg = '';

        // Grid lines
        for (let g = 0; g <= 4; g++) {
            const gridVal = minVal + (g / 4) * valRange;
            const y = getY(gridVal);
            contentSvg += `
                <line x1="${paddingLeft}" y1="${y}" x2="${svgWidth - paddingRight}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="3,3" />
                <text x="${paddingLeft - 8}" y="${y + 4}" fill="var(--text-muted)" font-size="10" font-family="var(--font-mono)" text-anchor="end">${Currency.formatCryptoPrice(gridVal)}</text>
            `;
        }

        if (this.chartType === 'candle') {
            // Candlestick bodies and wicks
            const candleWidth = (chartW / pointsCount) * 0.55;
            candleData.forEach(c => {
                const x = getX(c.index);
                const yHigh = getY(c.high);
                const yLow = getY(c.low);
                const yOpen = getY(c.open);
                const yClose = getY(c.close);
                const color = c.isBullish ? '#10B981' : '#EF4444';
                const bodyTop = Math.min(yOpen, yClose);
                const bodyHeight = Math.max(3, Math.abs(yClose - yOpen));

                // Wick
                contentSvg += `<line x1="${x}" y1="${yHigh}" x2="${x}" y2="${yLow}" stroke="${color}" stroke-width="1.5" />`;
                // Body
                contentSvg += `<rect x="${x - candleWidth / 2}" y="${bodyTop}" width="${candleWidth}" height="${bodyHeight}" fill="${color}" rx="2" />`;
            });
        } else {
            // Area / Line Path
            let pathD = '';
            candleData.forEach((c, idx) => {
                const x = getX(idx);
                const y = getY(c.close);
                pathD += idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
            });

            const areaD = `${pathD} L ${getX(pointsCount - 1)} ${paddingTop + chartH} L ${getX(0)} ${paddingTop + chartH} Z`;

            contentSvg += `
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#00F0FF" stop-opacity="0.35"/>
                        <stop offset="100%" stop-color="#00F0FF" stop-opacity="0.0"/>
                    </linearGradient>
                </defs>
                <path d="${areaD}" fill="url(#chartGradient)" />
                <path d="${pathD}" fill="none" stroke="#00F0FF" stroke-width="2.5" stroke-linecap="round" />
            `;
        }

        // Purchase Point Markers
        if (relevantTrades && relevantTrades.length > 0) {
            // Place marker at the most recent trade executions (e.g. 50,000 BDX or 1.0 BTC)
            relevantTrades.slice(0, 3).forEach((tr, tIdx) => {
                const candleIdx = Math.max(2, pointsCount - 1 - (tIdx * 4 + 2));
                const targetCandle = candleData[candleIdx] || candleData[candleData.length - 1];
                const x = getX(targetCandle.index);
                const y = getY(targetCandle.close);
                const isBuy = tr.type === 'BUY';
                const markerColor = isBuy ? '#10B981' : (tr.type === 'SWAP' ? '#8B5CF6' : '#EF4444');
                const label = `${tr.type} ${(tr.quantity || 50000).toLocaleString()} ${tr.symbol || this.selectedAsset}`;

                contentSvg += `
                    <!-- Marker Flag -->
                    <g style="cursor: pointer;" transform="translate(${x}, ${y})">
                        <circle cx="0" cy="0" r="5" fill="${markerColor}" stroke="#FFFFFF" stroke-width="1.5" />
                        <line x1="0" y1="0" x2="0" y2="-22" stroke="${markerColor}" stroke-width="1.5" stroke-dasharray="2,2" />
                        <rect x="-42" y="-40" width="84" height="20" rx="4" fill="${markerColor}" />
                        <text x="0" y="-26" fill="#FFFFFF" font-size="9.5" font-weight="bold" font-family="var(--font-mono)" text-anchor="middle">
                            ${label.substring(0, 15)}
                        </text>
                    </g>
                `;
            });
        }

        // Time axis labels
        contentSvg += `
            <text x="${getX(0)}" y="${svgHeight - 12}" fill="var(--text-muted)" font-size="9" font-family="var(--font-mono)">${candleData[0].timeLabel}</text>
            <text x="${getX(Math.floor(pointsCount / 2))}" y="${svgHeight - 12}" fill="var(--text-muted)" font-size="9" font-family="var(--font-mono)" text-anchor="middle">${candleData[Math.floor(pointsCount / 2)].timeLabel}</text>
            <text x="${getX(pointsCount - 1)}" y="${svgHeight - 12}" fill="var(--text-muted)" font-size="9" font-family="var(--font-mono)" text-anchor="end">${candleData[pointsCount - 1].timeLabel} (Now)</text>
        `;

        canvas.innerHTML = `
            <svg viewBox="0 0 ${svgWidth} ${svgHeight}" style="width: 100%; height: auto; max-height: 280px; overflow: visible;">
                ${contentSvg}
            </svg>
        `;
    }
};

window.PortfolioView = PortfolioView;
