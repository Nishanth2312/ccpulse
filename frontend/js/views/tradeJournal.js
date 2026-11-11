/**
 * CCPulse Interactive Simulated Trading Journal & Performance Analytics
 * 
 * Educational tool designed to cultivate disciplined trading psychology,
 * track win/loss distributions, analyze risk-to-reward ratios, and visualize
 * equity curves without risking real financial capital.
 */
const TradeJournalView = {
    filterType: 'ALL',
    filterSymbol: 'ALL',
    filterRange: 'ALL',
    searchTerm: '',

    getStoredNotes() {
        try {
            return JSON.parse(localStorage.getItem('ccpulse_trade_notes') || '{}');
        } catch (e) {
            return {};
        }
    },

    saveNote(tradeId, noteText, emotion) {
        try {
            const notes = this.getStoredNotes();
            notes[tradeId] = {
                text: noteText,
                emotion: emotion || 'Disciplined',
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem('ccpulse_trade_notes', JSON.stringify(notes));
            if (window.Toast) {
                window.Toast.success('Journal reflection and trading psychology note saved.', 'Journal Updated');
            }
        } catch (e) {
            console.error('Failed to save journal note:', e);
        }
    },

    async render(container) {
        const isGuest = State.isGuest || !State.currentUser;
        const currentUserId = State.currentUser?.id;

        // Fetch user trades from ClientDB or State guest session
        let rawTrades = [];
        if (!isGuest && typeof ClientDB !== 'undefined' && ClientDB.trades) {
            try {
                rawTrades = ClientDB.trades.getByUserId(currentUserId) || [];
            } catch (e) {
                rawTrades = [];
            }
        }

        // If guest or no trades in db, pull from State.guestSession
        if ((!rawTrades || rawTrades.length === 0) && State.guestSession && Array.isArray(State.guestSession.trades)) {
            rawTrades = State.guestSession.trades.map((t, idx) => ({
                id: t.tradeRef || `GUEST-${idx + 1}`,
                userId: 'guest',
                symbol: t.symbol || 'BTC',
                name: t.symbol === 'BTC' ? 'Bitcoin' : t.symbol,
                type: t.type || 'BUY',
                quantity: parseFloat(t.quantity || 1),
                executionPriceUsd: parseFloat(t.priceUsd || t.executionPriceUsd || 73932.53),
                totalCostUsd: parseFloat(t.totalValueUsd || t.totalCostUsd || 73932.53),
                timestamp: t.date || new Date().toISOString()
            }));
        }

        // Enrich trades with live coin prices from State.cryptos or CLIENT_STATIC_COINS
        const enrichedTrades = this.enrichTrades(rawTrades);

        // Calculate journal metrics
        const metrics = this.calculateMetrics(enrichedTrades);

        // Apply filters
        const filteredTrades = this.filterTrades(enrichedTrades);

        // Available symbols for filtering dropdown
        const availableSymbols = Array.from(new Set(enrichedTrades.map(t => t.baseSymbol))).filter(Boolean);

        container.innerHTML = `
            <style>
                .journal-header {
                    margin-bottom: 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    flex-wrap: wrap;
                    gap: 16px;
                }
                .journal-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(22, 199, 132, 0.12);
                    color: #16C784;
                    border: 1px solid rgba(22, 199, 132, 0.28);
                    padding: 4px 10px;
                    border-radius: 999px;
                    font-size: 0.78rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .metric-card {
                    background: var(--bg-surface, #181B24);
                    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
                    border-radius: 12px;
                    padding: 18px;
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.2s ease, border-color 0.2s ease;
                }
                .metric-card:hover {
                    border-color: rgba(22, 199, 132, 0.4);
                    transform: translateY(-2px);
                }
                .metric-label {
                    font-size: 0.78rem;
                    color: var(--text-secondary, #9CA3AF);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 6px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .metric-value {
                    font-size: 1.45rem;
                    font-weight: 800;
                    color: var(--text-primary, #F9FAFB);
                    font-family: monospace;
                }
                .metric-sub {
                    font-size: 0.75rem;
                    color: var(--text-muted, #6B7280);
                    margin-top: 4px;
                }
                .equity-chart-card {
                    background: var(--bg-surface, #181B24);
                    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
                    border-radius: 12px;
                    padding: 22px;
                    margin-bottom: 24px;
                }
                .filter-bar {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    align-items: center;
                    justify-content: space-between;
                    background: var(--bg-surface, #181B24);
                    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
                    border-radius: 12px;
                    padding: 14px 18px;
                    margin-bottom: 20px;
                }
                .filter-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .filter-select, .filter-input {
                    background: var(--bg-card, #1F2430);
                    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.12));
                    color: var(--text-primary, #F9FAFB);
                    border-radius: 8px;
                    padding: 8px 12px;
                    font-size: 0.85rem;
                    outline: none;
                }
                .filter-select:focus, .filter-input:focus {
                    border-color: #16C784;
                }
                .journal-table-wrap {
                    background: var(--bg-surface, #181B24);
                    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
                    border-radius: 12px;
                    overflow-x: auto;
                }
                .journal-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.88rem;
                    text-align: left;
                }
                .journal-table th {
                    background: rgba(255, 255, 255, 0.02);
                    padding: 14px 16px;
                    color: var(--text-secondary, #9CA3AF);
                    font-weight: 700;
                    font-size: 0.76rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
                    white-space: nowrap;
                }
                .journal-table td {
                    padding: 14px 16px;
                    border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
                    color: var(--text-primary, #F9FAFB);
                    vertical-align: middle;
                }
                .journal-table tr:hover td {
                    background: rgba(255, 255, 255, 0.02);
                }
                .badge-buy {
                    background: rgba(22, 199, 132, 0.15);
                    color: #16C784;
                    padding: 3px 8px;
                    border-radius: 6px;
                    font-size: 0.72rem;
                    font-weight: 800;
                }
                .badge-sell {
                    background: rgba(239, 68, 68, 0.15);
                    color: #EF4444;
                    padding: 3px 8px;
                    border-radius: 6px;
                    font-size: 0.72rem;
                    font-weight: 800;
                }
                .badge-swap {
                    background: rgba(59, 130, 246, 0.15);
                    color: #3B82F6;
                    padding: 3px 8px;
                    border-radius: 6px;
                    font-size: 0.72rem;
                    font-weight: 800;
                }
                .pnl-pos { color: #16C784; font-weight: 700; }
                .pnl-neg { color: #EF4444; font-weight: 700; }
                .pnl-neutral { color: var(--text-muted, #9CA3AF); }
                .journal-note-btn {
                    background: transparent;
                    border: 1px dashed var(--border-color, rgba(255, 255, 255, 0.2));
                    color: var(--text-secondary, #9CA3AF);
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 0.76rem;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    transition: all 0.2s ease;
                }
                .journal-note-btn:hover {
                    border-color: #16C784;
                    color: #16C784;
                }
                .note-preview {
                    display: block;
                    font-size: 0.76rem;
                    color: var(--text-secondary, #9CA3AF);
                    font-style: italic;
                    max-width: 220px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    margin-top: 2px;
                }
                .psychology-pill {
                    display: inline-block;
                    font-size: 0.68rem;
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-top: 2px;
                }
                .psy-disciplined { background: rgba(22, 199, 132, 0.15); color: #16C784; }
                .psy-fomo { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
                .psy-panic { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
                .psy-planned { background: rgba(139, 92, 246, 0.15); color: #8B5CF6; }
            </style>

            <div class="journal-header">
                <div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                        <h1 style="font-size: 1.8rem; font-weight: 800; margin: 0;">
                            <i class="fa-solid fa-book-journal-whills text-success"></i> Trading Journal & Analytics
                        </h1>
                        <span class="journal-badge">
                            <i class="fa-solid fa-graduation-cap"></i> Psychology & Risk Lab
                        </span>
                    </div>
                    <p style="color: var(--text-secondary); font-size: 0.92rem; margin: 0;">
                        Analyze simulated trade execution performance, calculate win/loss expectancy, and review trading psychology notes.
                    </p>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button type="button" class="btn btn-outline" id="export-journal-csv-btn" style="padding: 9px 15px; font-size: 0.85rem;">
                        <i class="fa-solid fa-file-csv"></i> Export CSV
                    </button>
                    <a href="#simulator" class="btn btn-primary" style="padding: 9px 15px; font-size: 0.85rem; text-decoration: none;">
                        <i class="fa-solid fa-bolt"></i> New Simulated Trade
                    </a>
                </div>
            </div>

            <!-- Key Performance Metrics Grid -->
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-label"><i class="fa-solid fa-list-check"></i> Total Trades</div>
                    <div class="metric-value">${metrics.totalTrades}</div>
                    <div class="metric-sub">${metrics.buyCount} Buys &bull; ${metrics.sellCount} Sells &bull; ${metrics.swapCount} Swaps</div>
                </div>

                <div class="metric-card">
                    <div class="metric-label"><i class="fa-solid fa-trophy"></i> Win Rate</div>
                    <div class="metric-value ${metrics.winRate >= 50 ? 'pnl-pos' : 'pnl-neg'}">${metrics.winRate}%</div>
                    <div class="metric-sub">${metrics.wins} Profitable / ${metrics.losses} Drawdowns</div>
                </div>

                <div class="metric-card">
                    <div class="metric-label"><i class="fa-solid fa-chart-line"></i> Total Simulated P&L</div>
                    <div class="metric-value ${metrics.totalPnlUsd >= 0 ? 'pnl-pos' : 'pnl-neg'}">
                        ${metrics.totalPnlUsd >= 0 ? '+' : ''}${Currency.format(metrics.totalPnlUsd)}
                    </div>
                    <div class="metric-sub">Realized & Active Simulated P&L</div>
                </div>

                <div class="metric-card">
                    <div class="metric-label"><i class="fa-solid fa-scale-balanced"></i> Profit Factor</div>
                    <div class="metric-value">${metrics.profitFactor}</div>
                    <div class="metric-sub">Gross Gains vs Gross Losses</div>
                </div>

                <div class="metric-card">
                    <div class="metric-label"><i class="fa-solid fa-arrow-trend-up"></i> Avg Win / Loss</div>
                    <div class="metric-value font-mono" style="font-size: 1.15rem;">
                        <span class="pnl-pos">+${Currency.format(metrics.avgWinUsd)}</span> / 
                        <span class="pnl-neg">-${Currency.format(metrics.avgLossUsd)}</span>
                    </div>
                    <div class="metric-sub">Payoff Ratio: <strong>${metrics.payoffRatio}:1</strong></div>
                </div>

                <div class="metric-card">
                    <div class="metric-label"><i class="fa-solid fa-crown"></i> Best Asset</div>
                    <div class="metric-value font-mono" style="font-size: 1.25rem; color: #16C784;">
                        ${metrics.bestAsset || 'N/A'}
                    </div>
                    <div class="metric-sub">Largest Trade: +${Currency.format(metrics.largestWinUsd)}</div>
                </div>
            </div>

            <!-- Equity Curve SVG Visualization -->
            <div class="equity-chart-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div>
                        <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0;">
                            <i class="fa-solid fa-wave-pulse text-success"></i> Simulated Equity Curve
                        </h3>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                            Portfolio capital trajectory across consecutive trade executions
                        </div>
                    </div>
                    <div style="font-size: 0.82rem; font-family: monospace; color: ${metrics.totalPnlUsd >= 0 ? '#16C784' : '#EF4444'}; font-weight: 700;">
                        Net Shift: ${metrics.totalPnlUsd >= 0 ? '+' : ''}${Currency.format(metrics.totalPnlUsd)}
                    </div>
                </div>
                <div id="equity-svg-container" style="width: 100%; height: 180px; position: relative;">
                    ${this.renderEquityChart(enrichedTrades)}
                </div>
            </div>

            <!-- Interactive Filters & Search -->
            <div class="filter-bar">
                <div class="filter-group">
                    <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">Type:</label>
                    <select id="journal-filter-type" class="filter-select">
                        <option value="ALL" ${this.filterType === 'ALL' ? 'selected' : ''}>All Types</option>
                        <option value="BUY" ${this.filterType === 'BUY' ? 'selected' : ''}>BUY Orders</option>
                        <option value="SELL" ${this.filterType === 'SELL' ? 'selected' : ''}>SELL Orders</option>
                        <option value="SWAP" ${this.filterType === 'SWAP' ? 'selected' : ''}>DEX Swaps</option>
                    </select>

                    <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; margin-left: 8px;">Asset:</label>
                    <select id="journal-filter-symbol" class="filter-select">
                        <option value="ALL" ${this.filterSymbol === 'ALL' ? 'selected' : ''}>All Assets</option>
                        ${availableSymbols.map(s => `<option value="${s}" ${this.filterSymbol === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>

                    <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; margin-left: 8px;">Timeframe:</label>
                    <select id="journal-filter-range" class="filter-select">
                        <option value="ALL" ${this.filterRange === 'ALL' ? 'selected' : ''}>All Time</option>
                        <option value="7D" ${this.filterRange === '7D' ? 'selected' : ''}>Last 7 Days</option>
                        <option value="30D" ${this.filterRange === '30D' ? 'selected' : ''}>Last 30 Days</option>
                    </select>
                </div>

                <div class="filter-group">
                    <div style="position: relative;">
                        <input type="text" id="journal-search" class="filter-input" placeholder="Search symbol or notes..." value="${this.searchTerm}" style="padding-left: 32px; width: 220px;">
                        <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 0.78rem; color: var(--text-muted);"></i>
                    </div>
                    <button type="button" class="btn btn-outline" id="journal-reset-filters" style="padding: 7px 12px; font-size: 0.8rem;" title="Reset Filters">
                        <i class="fa-solid fa-arrow-rotate-left"></i>
                    </button>
                </div>
            </div>

            <!-- Detailed Trade Table -->
            <div class="journal-table-wrap">
                <table class="journal-table">
                    <thead>
                        <tr>
                            <th>Date / Time</th>
                            <th>Type</th>
                            <th>Asset</th>
                            <th style="text-align: right;">Executed Qty</th>
                            <th style="text-align: right;">Entry Price</th>
                            <th style="text-align: right;">Total Value</th>
                            <th style="text-align: right;">Simulated P&L</th>
                            <th>Psychology / Reflection</th>
                            <th style="text-align: center;">Action</th>
                        </tr>
                    </thead>
                    <tbody id="journal-table-body">
                        ${filteredTrades.length === 0 ? `
                            <tr>
                                <td colspan="9" style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
                                    <i class="fa-solid fa-inbox" style="font-size: 2.2rem; margin-bottom: 12px; opacity: 0.4; display: block;"></i>
                                    <p style="margin: 0; font-size: 0.95rem; font-weight: 600;">No trades match your criteria.</p>
                                    <p style="margin: 4px 0 16px; font-size: 0.82rem;">Head over to the Trading Simulator or Instant Swap to execute virtual orders.</p>
                                    <a href="#simulator" class="btn btn-primary" style="font-size: 0.82rem; padding: 7px 16px; text-decoration: none;">Launch Simulator</a>
                                </td>
                            </tr>
                        ` : filteredTrades.map(t => {
                            const notes = this.getStoredNotes();
                            const noteObj = notes[t.id];
                            const badgeClass = t.type === 'BUY' ? 'badge-buy' : (t.type === 'SELL' ? 'badge-sell' : 'badge-swap');
                            const pnlClass = t.pnlUsd > 0 ? 'pnl-pos' : (t.pnlUsd < 0 ? 'pnl-neg' : 'pnl-neutral');
                            const dateStr = new Date(t.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                            let psyClass = 'psy-disciplined';
                            if (noteObj?.emotion === 'FOMO') psyClass = 'psy-fomo';
                            if (noteObj?.emotion === 'Panic') psyClass = 'psy-panic';
                            if (noteObj?.emotion === 'Planned Setup') psyClass = 'psy-planned';

                            return `
                                <tr data-trade-id="${t.id}">
                                    <td style="font-size: 0.82rem; color: var(--text-secondary); white-space: nowrap;">
                                        <i class="fa-regular fa-clock" style="font-size: 0.72rem; margin-right: 4px;"></i>${dateStr}
                                    </td>
                                    <td><span class="${badgeClass}">${t.type}</span></td>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <img src="${t.logoUrl}" alt="${t.baseSymbol}" style="width: 22px; height: 22px; border-radius: 50%;" onerror="this.src='./assets/coins/generic.svg'">
                                            <div>
                                                <div style="font-weight: 700; font-size: 0.88rem;">${t.displaySymbol}</div>
                                                <div style="font-size: 0.74rem; color: var(--text-muted);">${t.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style="text-align: right; font-family: monospace; font-weight: 600;">
                                        ${t.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                    </td>
                                    <td style="text-align: right; font-family: monospace;">
                                        ${Currency.format(t.executionPriceUsd)}
                                    </td>
                                    <td style="text-align: right; font-family: monospace; font-weight: 700;">
                                        ${Currency.format(t.totalCostUsd)}
                                    </td>
                                    <td style="text-align: right; font-family: monospace;" class="${pnlClass}">
                                        ${t.pnlUsd > 0 ? '+' : ''}${Currency.format(t.pnlUsd)}
                                        <div style="font-size: 0.72rem; opacity: 0.85;">
                                            ${t.pnlPercent > 0 ? '+' : ''}${t.pnlPercent.toFixed(2)}%
                                        </div>
                                    </td>
                                    <td>
                                        ${noteObj ? `
                                            <div>
                                                <span class="psychology-pill ${psyClass}">${noteObj.emotion}</span>
                                                <span class="note-preview" title="${this.escapeHtml(noteObj.text)}">"${this.escapeHtml(noteObj.text)}"</span>
                                            </div>
                                        ` : `
                                            <span style="font-size: 0.76rem; color: var(--text-muted); font-style: italic;">No reflection logged</span>
                                        `}
                                    </td>
                                    <td style="text-align: center; white-space: nowrap;">
                                        <button type="button" class="journal-note-btn add-note-trigger" data-trade-id="${t.id}" data-symbol="${t.displaySymbol}">
                                            <i class="fa-solid fa-pen-to-square"></i> ${noteObj ? 'Edit Note' : 'Add Note'}
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Educational Methodology Footer -->
            <div style="margin-top: 24px; padding: 18px 22px; background: rgba(22, 199, 132, 0.05); border: 1px solid rgba(22, 199, 132, 0.2); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(22, 199, 132, 0.15); display: flex; align-items: center; justify-content: center; color: #16C784; font-size: 1.2rem;">
                        <i class="fa-solid fa-brain"></i>
                    </div>
                    <div>
                        <div style="font-weight: 700; font-size: 0.92rem; color: var(--text-primary);">Educational Trading Discipline</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary); max-width: 650px;">
                            Professional traders maintain a journal to identify emotional biases (FOMO vs. planned risk). Reviewing your simulated win rate and average win-to-loss ratio reinforces disciplined position sizing.
                        </div>
                    </div>
                </div>
                <a href="#learn" class="btn btn-outline" style="font-size: 0.8rem; padding: 7px 14px; text-decoration: none;">
                    <i class="fa-solid fa-book-open"></i> Read Risk Management Guide
                </a>
            </div>
        `;

        this.attachEventListeners(container, enrichedTrades);
    },

    enrichTrades(rawTrades) {
        return rawTrades.map(t => {
            const sym = (t.symbol || 'BTC').split(' ')[0].split('→')[0].trim().toUpperCase();
            const liveCoin = (State.cryptos && State.cryptos.find(c => c.symbol === sym)) ||
                             (typeof CLIENT_STATIC_COINS !== 'undefined' && CLIENT_STATIC_COINS.find(c => c.symbol === sym)) ||
                             { current_price_usd: t.executionPriceUsd || 73932.53, logo_url: './assets/coins/btc.svg' };

            const curPrice = liveCoin.current_price_usd || t.executionPriceUsd || 1;
            const logoUrl = State.getCoinLogo(liveCoin);

            let pnlUsd = 0;
            let pnlPercent = 0;

            if (t.type === 'BUY') {
                pnlUsd = (curPrice - t.executionPriceUsd) * t.quantity;
                pnlPercent = t.executionPriceUsd > 0 ? ((curPrice - t.executionPriceUsd) / t.executionPriceUsd) * 100 : 0;
            } else if (t.type === 'SELL') {
                pnlUsd = (t.executionPriceUsd - (t.avgBuyPrice || (t.executionPriceUsd * 0.95))) * t.quantity;
                pnlPercent = 5.0;
            } else if (t.type === 'SWAP') {
                const toSym = (t.toSymbol || 'BDX').toUpperCase();
                const toCoin = (State.cryptos && State.cryptos.find(c => c.symbol === toSym)) ||
                              (typeof CLIENT_STATIC_COINS !== 'undefined' && CLIENT_STATIC_COINS.find(c => c.symbol === toSym)) ||
                              { current_price_usd: t.executionPriceUsd || 1 };
                const currentVal = t.quantity * (toCoin.current_price_usd || 1);
                pnlUsd = currentVal - t.totalCostUsd;
                pnlPercent = t.totalCostUsd > 0 ? (pnlUsd / t.totalCostUsd) * 100 : 0;
            }

            return {
                ...t,
                baseSymbol: sym,
                displaySymbol: t.symbol,
                currentPriceUsd: curPrice,
                logoUrl,
                pnlUsd,
                pnlPercent
            };
        }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },

    calculateMetrics(trades) {
        if (!trades || trades.length === 0) {
            return {
                totalTrades: 0,
                buyCount: 0,
                sellCount: 0,
                swapCount: 0,
                winRate: 0,
                wins: 0,
                losses: 0,
                totalPnlUsd: 0,
                profitFactor: '0.00',
                avgWinUsd: 0,
                avgLossUsd: 0,
                payoffRatio: '0.00',
                largestWinUsd: 0,
                bestAsset: 'N/A'
            };
        }

        let buyCount = 0;
        let sellCount = 0;
        let swapCount = 0;
        let wins = 0;
        let losses = 0;
        let grossGains = 0;
        let grossLosses = 0;
        let totalPnl = 0;
        let largestWin = 0;

        const assetPnlMap = {};

        trades.forEach(t => {
            if (t.type === 'BUY') buyCount++;
            else if (t.type === 'SELL') sellCount++;
            else if (t.type === 'SWAP') swapCount++;

            totalPnl += t.pnlUsd;

            if (t.pnlUsd > 0) {
                wins++;
                grossGains += t.pnlUsd;
                if (t.pnlUsd > largestWin) largestWin = t.pnlUsd;
            } else if (t.pnlUsd < 0) {
                losses++;
                grossLosses += Math.abs(t.pnlUsd);
            }

            assetPnlMap[t.baseSymbol] = (assetPnlMap[t.baseSymbol] || 0) + t.pnlUsd;
        });

        const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;
        const avgWin = wins > 0 ? grossGains / wins : 0;
        const avgLoss = losses > 0 ? grossLosses / losses : 0;
        const profitFactor = grossLosses > 0 ? (grossGains / grossLosses).toFixed(2) : (grossGains > 0 ? '99.9+' : '1.00');
        const payoffRatio = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : '1.00';

        let bestAsset = 'BTC';
        let maxAssetPnl = -Infinity;
        Object.entries(assetPnlMap).forEach(([sym, pnl]) => {
            if (pnl > maxAssetPnl) {
                maxAssetPnl = pnl;
                bestAsset = sym;
            }
        });

        return {
            totalTrades: trades.length,
            buyCount,
            sellCount,
            swapCount,
            winRate,
            wins,
            losses,
            totalPnlUsd: totalPnl,
            profitFactor,
            avgWinUsd: avgWin,
            avgLossUsd: avgLoss,
            payoffRatio,
            largestWinUsd: largestWin,
            bestAsset: bestAsset || 'BTC'
        };
    },

    filterTrades(trades) {
        return trades.filter(t => {
            if (this.filterType !== 'ALL' && t.type !== this.filterType) return false;
            if (this.filterSymbol !== 'ALL' && t.baseSymbol !== this.filterSymbol) return false;

            if (this.filterRange === '7D') {
                const cutoff = Date.now() - 7 * 86400000;
                if (new Date(t.timestamp).getTime() < cutoff) return false;
            } else if (this.filterRange === '30D') {
                const cutoff = Date.now() - 30 * 86400000;
                if (new Date(t.timestamp).getTime() < cutoff) return false;
            }

            if (this.searchTerm) {
                const term = this.searchTerm.toLowerCase();
                const notes = this.getStoredNotes();
                const noteText = (notes[t.id]?.text || '').toLowerCase();
                const sym = (t.displaySymbol || '').toLowerCase();
                const id = String(t.id).toLowerCase();
                if (!sym.includes(term) && !id.includes(term) && !noteText.includes(term)) {
                    return false;
                }
            }

            return true;
        });
    },

    renderEquityChart(trades) {
        // Chronological order for equity curve
        const chronological = [...trades].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const initialCapital = 10000.00;
        const points = [initialCapital];

        let running = initialCapital;
        chronological.forEach(t => {
            running += t.pnlUsd;
            points.push(running);
        });

        if (points.length === 1) {
            // Add a mock curve so it displays beautifully even with 1 trade
            points.push(running + 150, running + 480);
        }

        const minVal = Math.min(...points) * 0.98;
        const maxVal = Math.max(...points) * 1.02;
        const range = maxVal - minVal || 1;

        const width = 800;
        const height = 150;
        const padding = 20;

        const coords = points.map((p, i) => {
            const x = padding + (i / (points.length - 1)) * (width - padding * 2);
            const y = height - padding - ((p - minVal) / range) * (height - padding * 2);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        });

        const isPositive = points[points.length - 1] >= points[0];
        const lineColor = isPositive ? '#16C784' : '#EF4444';
        const startArea = `${coords[0].split(',')[0]},${height - padding}`;
        const endArea = `${coords[coords.length - 1].split(',')[0]},${height - padding}`;
        const areaPoints = `${startArea} ${coords.join(' ')} ${endArea}`;

        return `
            <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%; overflow: visible;" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${lineColor}" stop-opacity="0.3" />
                        <stop offset="100%" stop-color="${lineColor}" stop-opacity="0.0" />
                    </linearGradient>
                </defs>
                <!-- Baseline horizontal -->
                <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
                <polygon points="${areaPoints}" fill="url(#equityGrad)" />
                <polyline points="${coords.join(' ')}" fill="none" stroke="${lineColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                <!-- End point node -->
                <circle cx="${coords[coords.length - 1].split(',')[0]}" cy="${coords[coords.length - 1].split(',')[1]}" r="4" fill="${lineColor}" stroke="#181B24" stroke-width="2" />
            </svg>
        `;
    },

    attachEventListeners(container, allTrades) {
        // Filter change handlers
        const typeSelect = container.querySelector('#journal-filter-type');
        const symSelect = container.querySelector('#journal-filter-symbol');
        const rangeSelect = container.querySelector('#journal-filter-range');
        const searchInput = container.querySelector('#journal-search');
        const resetBtn = container.querySelector('#journal-reset-filters');
        const exportBtn = container.querySelector('#export-journal-csv-btn');

        if (typeSelect) {
            typeSelect.onchange = (e) => {
                this.filterType = e.target.value;
                this.render(container);
            };
        }

        if (symSelect) {
            symSelect.onchange = (e) => {
                this.filterSymbol = e.target.value;
                this.render(container);
            };
        }

        if (rangeSelect) {
            rangeSelect.onchange = (e) => {
                this.filterRange = e.target.value;
                this.render(container);
            };
        }

        if (searchInput) {
            let debounceTimer;
            searchInput.oninput = (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.searchTerm = e.target.value.trim();
                    this.render(container);
                }, 250);
            };
        }

        if (resetBtn) {
            resetBtn.onclick = () => {
                this.filterType = 'ALL';
                this.filterSymbol = 'ALL';
                this.filterRange = 'ALL';
                this.searchTerm = '';
                this.render(container);
            };
        }

        if (exportBtn) {
            exportBtn.onclick = () => {
                this.exportToCsv(allTrades);
            };
        }

        // Add/Edit Note Modal
        container.querySelectorAll('.add-note-trigger').forEach(btn => {
            btn.onclick = (e) => {
                const tradeId = btn.getAttribute('data-trade-id');
                const sym = btn.getAttribute('data-symbol');
                this.showNoteModal(tradeId, sym, () => this.render(container));
            };
        });
    },

    showNoteModal(tradeId, symbol, onSaved) {
        const notes = this.getStoredNotes();
        const existing = notes[tradeId] || { text: '', emotion: 'Disciplined' };

        const host = document.getElementById('modals-host') || document.body;
        const dialog = document.createElement('dialog');
        dialog.className = 'tx-security-dialog';

        dialog.innerHTML = `
            <div class="tx-security-card" style="max-width: 480px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(22, 199, 132, 0.15); display: flex; align-items: center; justify-content: center; color: #16C784;">
                            <i class="fa-solid fa-pen-nib"></i>
                        </div>
                        <div>
                            <h3 style="font-size: 1.15rem; font-weight: 800; margin: 0;">Trade Reflection & Psychology</h3>
                            <div style="font-size: 0.78rem; color: var(--text-muted);">Trade Ref: ${tradeId} (${symbol})</div>
                        </div>
                    </div>
                    <button type="button" id="close-note-dialog" style="background: none; border: none; font-size: 1.2rem; color: var(--text-muted); cursor: pointer;">&times;</button>
                </div>

                <form id="trade-note-form" style="display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 6px; color: var(--text-secondary);">
                            Emotional State / Trading Psychology:
                        </label>
                        <select id="trade-emotion-select" class="form-control" style="width: 100%; padding: 8px 12px; background: var(--bg-card); color: var(--text-primary); border-radius: 8px; border: 1px solid var(--border-color);">
                            <option value="Disciplined" ${existing.emotion === 'Disciplined' ? 'selected' : ''}>🎯 Disciplined (Followed Trading Plan)</option>
                            <option value="Planned Setup" ${existing.emotion === 'Planned Setup' ? 'selected' : ''}>📐 Planned Setup (Technical / Fundamental Thesis)</option>
                            <option value="FOMO" ${existing.emotion === 'FOMO' ? 'selected' : ''}>⚡ FOMO (Fear of Missing Out / Chased Candle)</option>
                            <option value="Panic" ${existing.emotion === 'Panic' ? 'selected' : ''}>⚠️ Panic (Emotional Reaction to Market Dip)</option>
                        </select>
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 6px; color: var(--text-secondary);">
                            Trade Thesis & Educational Post-Mortem:
                        </label>
                        <textarea id="trade-note-textarea" rows="4" class="form-control" placeholder="What was your rationale for entering? What would you do differently next time?" style="width: 100%; padding: 10px 12px; background: var(--bg-card); color: var(--text-primary); border-radius: 8px; border: 1px solid var(--border-color); font-size: 0.85rem; resize: vertical;">${this.escapeHtml(existing.text)}</textarea>
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 8px;">
                        <button type="button" id="cancel-note-btn" class="btn btn-outline" style="flex: 1; padding: 9px;">Cancel</button>
                        <button type="submit" class="btn btn-primary" style="flex: 2; padding: 9px; font-weight: 700;">
                            <i class="fa-solid fa-floppy-disk"></i> Save Reflection
                        </button>
                    </div>
                </form>
            </div>
        `;

        host.appendChild(dialog);
        dialog.showModal();

        const closeBtn = dialog.querySelector('#close-note-dialog');
        const cancelBtn = dialog.querySelector('#cancel-note-btn');
        const form = dialog.querySelector('#trade-note-form');

        const cleanClose = () => {
            dialog.close();
            dialog.remove();
        };

        if (closeBtn) closeBtn.onclick = cleanClose;
        if (cancelBtn) cancelBtn.onclick = cleanClose;

        form.onsubmit = (e) => {
            e.preventDefault();
            const text = dialog.querySelector('#trade-note-textarea').value.trim();
            const emotion = dialog.querySelector('#trade-emotion-select').value;
            this.saveNote(tradeId, text, emotion);
            cleanClose();
            if (onSaved) onSaved();
        };
    },

    exportToCsv(trades) {
        if (!trades || trades.length === 0) {
            if (window.Toast) window.Toast.warning('No trades to export in the journal.', 'Empty Journal');
            return;
        }

        const notes = this.getStoredNotes();
        const headers = ['Trade_ID', 'Timestamp', 'Type', 'Asset', 'Quantity', 'Entry_Price_USD', 'Total_Cost_USD', 'Simulated_PnL_USD', 'PnL_Percent', 'Psychology_Emotion', 'Journal_Notes'];

        const rows = trades.map(t => {
            const noteObj = notes[t.id] || {};
            const cleanNote = (noteObj.text || '').replace(/"/g, '""');
            return [
                `"${t.id}"`,
                `"${t.timestamp}"`,
                `"${t.type}"`,
                `"${t.displaySymbol || t.symbol}"`,
                t.quantity,
                t.executionPriceUsd.toFixed(4),
                t.totalCostUsd.toFixed(2),
                t.pnlUsd.toFixed(2),
                t.pnlPercent.toFixed(2),
                `"${noteObj.emotion || 'N/A'}"`,
                `"${cleanNote}"`
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `ccpulse-trade-journal-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        if (window.Toast) {
            window.Toast.success('Trading journal exported as CSV file.', 'Export Successful');
        }
    },

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};

window.TradeJournalView = TradeJournalView;
