/**
 * CCPulse Virtual Portfolio & Transaction History View
 */
const PortfolioView = {
    async render(container) {
        let isGuest = State.isGuest || !State.currentUser;
        let portfolio = null;
        let transactions = [];

        if (!isGuest) {
            try {
                const res = await API.simulator.getPortfolio();
                portfolio = res.portfolio;
                transactions = res.transactions || [];
                State.wallet = portfolio;
            } catch (e) {
                console.warn('Failed to fetch portfolio:', e.message);
            }
        }

        // If guest, compile temporary mock portfolio
        if (isGuest || !portfolio) {
            const guestCash = State.guestSession?.temporaryBalanceUsd || 5000.00;
            let guestInvested = 0;
            const guestHoldings = (State.guestSession?.holdings || []).map(h => {
                const crypto = State.cryptos.find(c => c.symbol === h.symbol) || { current_price_usd: h.avg_buy_price_usd, change_24h: 0 };
                const currentVal = h.quantity * crypto.current_price_usd;
                guestInvested += currentVal;
                const pnl = currentVal - h.total_invested_usd;
                const pnlPct = h.total_invested_usd > 0 ? (pnl / h.total_invested_usd) * 100 : 0;
                return {
                    ...h,
                    current_price_usd: crypto.current_price_usd,
                    current_value_usd: currentVal,
                    pnl_usd: pnl,
                    pnl_percent: pnlPct
                };
            });

            portfolio = {
                availableCashUsd: guestCash,
                investedUsd: guestInvested,
                totalPortfolioValueUsd: guestCash + guestInvested,
                totalDepositedUsd: 5000.00,
                totalProfitLossUsd: (guestCash + guestInvested) - 5000.00,
                totalProfitLossPercent: (((guestCash + guestInvested) - 5000.00) / 5000.00) * 100,
                holdings: guestHoldings
            };

            transactions = (State.guestSession?.trades || []).map(t => ({
                transaction_ref: t.tradeRef,
                type: t.type === 'BUY' ? 'BUY_ORDER' : 'SELL_ORDER',
                amount_usd: t.totalValueUsd,
                balance_after_usd: guestCash,
                description: `Guest ${t.type} ${t.quantity} ${t.symbol}`,
                created_at: t.date
            }));
        }

        const totalValueFmt = Currency.format(portfolio.totalPortfolioValueUsd);
        const cashFmt = Currency.format(portfolio.availableCashUsd);
        const investedFmt = Currency.format(portfolio.investedUsd);
        const pnlFmt = Currency.format(portfolio.totalProfitLossUsd);
        const pnlSign = portfolio.totalProfitLossUsd >= 0 ? '+' : '';
        const pnlClass = portfolio.totalProfitLossUsd >= 0 ? 'text-success' : 'text-danger';

        container.innerHTML = `
            ${isGuest ? `
                <div style="background: linear-gradient(90deg, rgba(139,92,246,0.15), rgba(0,240,255,0.15)); border: 1px solid rgba(0,240,255,0.3); border-radius: var(--border-radius-md); padding: 18px 24px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                    <div>
                        <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                            <i class="fa-solid fa-user-secret text-cyan"></i> Guest Temporary Portfolio
                        </div>
                        <div style="font-size: 0.88rem; color: var(--text-secondary); max-width: 650px;">
                            This temporary simulated portfolio will vanish if browser cache is cleared. Register for free to unlock cross-device synchronization, permanent achievements, and receive your <strong>$5,000 USD welcome bonus</strong>!
                        </div>
                    </div>
                    <button type="button" class="btn btn-primary" onclick="AuthModals.showRegister()">
                        <i class="fa-solid fa-gift"></i> Register & Claim $5,000 Bonus
                    </button>
                </div>
            ` : `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h1 style="font-size: 1.8rem; font-weight: 800;">
                            <i class="fa-solid fa-wallet text-cyan"></i> Virtual Portfolio & Holdings
                        </h1>
                        <p style="color: var(--text-secondary); font-size: 0.92rem; margin-top: 4px;">
                            Secure account ledger for <strong>${State.currentUser.username}</strong> &bull; Display Currency: <strong style="color: var(--color-primary);">${Currency.getActiveCode()}</strong>
                        </p>
                    </div>
                    <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); padding: 8px 16px; border-radius: var(--border-radius-full);">
                        <i class="fa-solid fa-gift text-success"></i>
                        <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-success);">
                            CCPulse Welcome Bonus: $5,000.00 USD Credited
                        </span>
                    </div>
                </div>
            `}

            <!-- Metric Cards -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 32px;">
                <div class="glass-card" style="padding: 22px;">
                    <div style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Total Portfolio Value</div>
                    <div class="font-mono" style="font-size: 1.7rem; font-weight: 800; color: var(--text-primary); margin-top: 6px;">
                        ${totalValueFmt}
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
                        Base: $${portfolio.totalPortfolioValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                    </div>
                </div>

                <div class="glass-card" style="padding: 22px;">
                    <div style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Available Virtual Cash</div>
                    <div class="font-mono" style="font-size: 1.7rem; font-weight: 800; color: var(--color-success); margin-top: 6px;">
                        ${cashFmt}
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
                        Ready for instant order allocation
                    </div>
                </div>

                <div class="glass-card" style="padding: 22px;">
                    <div style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Invested Holdings Value</div>
                    <div class="font-mono" style="font-size: 1.7rem; font-weight: 800; color: var(--color-primary); margin-top: 6px;">
                        ${investedFmt}
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
                        Allocated across ${portfolio.holdings.length} assets
                    </div>
                </div>

                <div class="glass-card" style="padding: 22px;">
                    <div style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Total Profit / Loss</div>
                    <div class="font-mono ${pnlClass}" style="font-size: 1.7rem; font-weight: 800; margin-top: 6px;">
                        ${pnlSign}${pnlFmt}
                    </div>
                    <div class="${pnlClass}" style="font-size: 0.82rem; font-weight: 700; margin-top: 4px;">
                        ${pnlSign}${portfolio.totalProfitLossPercent.toFixed(2)}% Overall ROI
                    </div>
                </div>
            </div>

            <!-- Active Holdings Section -->
            <div class="glass-card" style="padding: 24px; margin-bottom: 32px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
                    <h2 style="font-size: 1.25rem; font-weight: 800;">
                        <i class="fa-solid fa-layer-group text-cyan"></i> Active Asset Allocations
                    </h2>
                    <a href="#simulator" class="btn btn-primary" style="font-size: 0.82rem; padding: 6px 12px;">
                        <i class="fa-solid fa-plus"></i> New Trade
                    </a>
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
                        <tbody>
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
                                            ${h.quantity >= 100 ? Number(h.quantity.toFixed(4)).toLocaleString('en-US', { maximumFractionDigits: 4 }) : h.quantity.toFixed(4)} ${h.symbol}
                                        </td>
                                        <td class="font-mono" style="color: var(--text-secondary);">${avgPrice}</td>
                                        <td class="font-mono" style="font-weight: 700;">${curPrice}</td>
                                        <td class="font-mono" style="font-weight: 700; color: var(--text-primary);">${posVal}</td>
                                        <td class="font-mono ${hPnlClass}" style="font-weight: 700;">
                                            ${hPnlSign}${hPnl} (${hPnlSign}${h.pnl_percent.toFixed(2)}%)
                                        </td>
                                        <td style="text-align: right;">
                                            <a href="#simulator?coin=${h.symbol}" class="btn btn-outline" style="font-size: 0.78rem; padding: 4px 10px;">
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

            <!-- Auditable Transaction Ledger -->
            <div class="glass-card" style="padding: 24px;">
                <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 18px;">
                    <i class="fa-solid fa-clock-rotate-left text-cyan"></i> Auditable Transaction History
                </h2>

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
                                const isBonus = t.type === 'WELCOME_BONUS';
                                const badgeColor = isBonus ? 'var(--color-success)' : (t.type.includes('BUY') ? 'var(--color-primary)' : '#F59E0B');
                                const amtFormatted = Currency.format(t.amount_usd);

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
                                            ${t.audit_reason ? `<div style="font-size: 0.75rem; color: var(--text-muted);">Audit: ${t.audit_reason}</div>` : ''}
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
    }
};

window.PortfolioView = PortfolioView;

