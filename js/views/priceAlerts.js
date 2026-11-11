/**
 * CCPulse Simulated Price Alert & Watchlist System
 * Allows users to set target thresholds, simulate price triggers, and monitor customized watchlists.
 */
const PriceAlertsView = {
    STORAGE_KEY: 'ccpulse_price_alerts_v1',
    WATCHLIST_KEY: 'ccpulse_watchlist_v1',
    monitorInterval: null,

    getAlerts() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            return raw ? JSON.parse(raw) : this.getDefaultAlerts();
        } catch (e) {
            return this.getDefaultAlerts();
        }
    },

    saveAlerts(alerts) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(alerts));
        } catch (e) {
            console.error('Error saving price alerts:', e);
        }
    },

    getWatchlist() {
        try {
            const raw = localStorage.getItem(this.WATCHLIST_KEY);
            return raw ? JSON.parse(raw) : ['BTC', 'ETH', 'SOL', 'BDX', 'XMR'];
        } catch (e) {
            return ['BTC', 'ETH', 'SOL', 'BDX', 'XMR'];
        }
    },

    saveWatchlist(list) {
        try {
            localStorage.setItem(this.WATCHLIST_KEY, JSON.stringify(list));
        } catch (e) {
            console.error('Error saving watchlist:', e);
        }
    },

    getDefaultAlerts() {
        return [
            {
                id: 'alt-1',
                symbol: 'BTC',
                condition: 'ABOVE',
                targetPriceUsd: 75000,
                note: 'Breakout above key psychological resistance',
                isActive: true,
                isTriggered: false,
                createdAt: new Date(Date.now() - 3600000).toISOString(),
                triggeredAt: null
            },
            {
                id: 'alt-2',
                symbol: 'ETH',
                condition: 'BELOW',
                targetPriceUsd: 2000,
                note: 'Accumulation support zone test',
                isActive: true,
                isTriggered: false,
                createdAt: new Date(Date.now() - 7200000).toISOString(),
                triggeredAt: null
            },
            {
                id: 'alt-3',
                symbol: 'BDX',
                condition: 'ABOVE',
                targetPriceUsd: 0.08,
                note: 'Privacy ecosystem momentum surge',
                isActive: true,
                isTriggered: false,
                createdAt: new Date(Date.now() - 10800000).toISOString(),
                triggeredAt: null
            }
        ];
    },

    getCoinList() {
        if (typeof State !== 'undefined' && State.cryptos && State.cryptos.length > 0) {
            return State.cryptos;
        }
        if (typeof CLIENT_STATIC_COINS !== 'undefined') {
            return CLIENT_STATIC_COINS;
        }
        return [
            { id: 1, name: 'Bitcoin', symbol: 'BTC', current_price_usd: 73932.53, change_24h: 2.15 },
            { id: 2, name: 'Ethereum', symbol: 'ETH', current_price_usd: 2056.93, change_24h: 1.45 },
            { id: 5, name: 'Solana', symbol: 'SOL', current_price_usd: 83.75, change_24h: 3.12 },
            { id: 13, name: 'Monero', symbol: 'XMR', current_price_usd: 158.40, change_24h: 2.50 },
            { id: 14, name: 'Beldex', symbol: 'BDX', current_price_usd: 0.0722, change_24h: 3.41 }
        ];
    },

    checkAlerts() {
        const alerts = this.getAlerts();
        const coins = this.getCoinList();
        let changed = false;

        for (const alt of alerts) {
            if (!alt.isActive || alt.isTriggered) continue;
            const coin = coins.find(c => c.symbol === alt.symbol);
            if (!coin || !coin.current_price_usd) continue;

            const price = coin.current_price_usd;
            let triggered = false;

            if (alt.condition === 'ABOVE' && price >= alt.targetPriceUsd) {
                triggered = true;
            } else if (alt.condition === 'BELOW' && price <= alt.targetPriceUsd) {
                triggered = true;
            }

            if (triggered) {
                alt.isTriggered = true;
                alt.triggeredAt = new Date().toISOString();
                changed = true;

                if (typeof Toast !== 'undefined' && Toast.show) {
                    Toast.show({
                        title: `Price Alert: ${alt.symbol} ${alt.condition === 'ABOVE' ? 'Surpassed' : 'Dropped Below'} Target!`,
                        message: `${alt.symbol} is currently trading at ${Currency.format(price)} (Target: ${Currency.format(alt.targetPriceUsd)}). ${alt.note || ''}`,
                        type: alt.condition === 'ABOVE' ? 'success' : 'warning',
                        txRef: 'ALERT-TRIGGERED'
                    });
                }
            }
        }

        if (changed) {
            this.saveAlerts(alerts);
            const container = document.getElementById('view-container');
            if (container && window.location.hash.includes('alerts')) {
                this.render(container);
            }
        }
    },

    async render(container) {
        const alerts = this.getAlerts();
        const watchlistSymbols = this.getWatchlist();
        const coins = this.getCoinList();

        const activeAlerts = alerts.filter(a => a.isActive && !a.isTriggered);
        const triggeredAlerts = alerts.filter(a => a.isTriggered);

        container.innerHTML = `
            <style>
                .alerts-layout {
                    display: grid;
                    grid-template-columns: 380px 1fr;
                    gap: 28px;
                    margin-bottom: 32px;
                }
                @media (max-width: 960px) {
                    .alerts-layout {
                        grid-template-columns: 1fr;
                    }
                }
                .alerts-form-card {
                    background: var(--bg-surface);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-lg, 16px);
                    padding: 24px;
                    height: fit-content;
                }
                .alerts-table-card {
                    background: var(--bg-surface);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-lg, 16px);
                    padding: 24px;
                }
                .alert-item-card {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    transition: border-color 0.2s ease;
                }
                .alert-item-card:hover {
                    border-color: rgba(22, 199, 132, 0.4);
                }
                .alert-item-card.triggered {
                    border-left: 4px solid var(--color-primary);
                    background: rgba(22, 199, 132, 0.04);
                }
                .watchlist-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                    gap: 16px;
                    margin-top: 24px;
                }
                .watchlist-card {
                    background: var(--bg-surface);
                    border: 1px solid var(--border-color);
                    border-radius: 14px;
                    padding: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
            </style>

            <!-- Header -->
            <div style="margin-bottom: 28px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
                    <div>
                        <h1 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 6px;">
                            <i class="fa-solid fa-bell text-cyan"></i> Price Alerts & Watchlist Lab
                        </h1>
                        <p style="color: var(--text-secondary); font-size: 0.95rem; margin: 0;">
                            Set target price alerts, monitor real-time threshold breaches, and track your priority simulation watchlist.
                        </p>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button type="button" id="test-alert-btn" class="btn btn-outline" style="padding: 8px 16px; font-size: 0.86rem;">
                            <i class="fa-solid fa-bolt"></i> Test Trigger Alert
                        </button>
                    </div>
                </div>
            </div>

            <!-- Main Layout -->
            <div class="alerts-layout">
                <!-- Create Alert Form -->
                <div class="alerts-form-card">
                    <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-plus-circle text-success"></i> Create Price Alert
                    </h3>

                    <form id="create-alert-form" style="display: flex; flex-direction: column; gap: 16px;">
                        <div>
                            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px;">
                                Target Cryptocurrency
                            </label>
                            <select id="alert-symbol-select" class="form-control" style="width: 100%; padding: 10px 12px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 10px; color: var(--text-primary); font-weight: 700;">
                                ${coins.map(c => `
                                    <option value="${c.symbol}" data-price="${c.current_price_usd}">
                                        ${c.name} (${c.symbol}) &bull; ${Currency.format(c.current_price_usd)}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <div>
                            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px;">
                                Trigger Condition
                            </label>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                                    <input type="radio" name="alert-condition" value="ABOVE" checked style="accent-color: var(--color-primary);" />
                                    <span>Rises Above (&ge;)</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                                    <input type="radio" name="alert-condition" value="BELOW" style="accent-color: var(--color-primary);" />
                                    <span>Drops Below (&le;)</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px;">
                                Target Price (USD)
                            </label>
                            <input type="number" id="alert-target-price" step="any" required placeholder="e.g. 75000" class="form-control" style="width: 100%; padding: 10px 12px; font-family: monospace; font-size: 1rem; font-weight: 700; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 10px; color: var(--text-primary);" />
                            <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 0.76rem; color: var(--text-muted);">
                                <span>Current: <strong id="alert-current-price-hint">$73,932.53</strong></span>
                                <span style="display: flex; gap: 6px;">
                                    <button type="button" class="btn-subtle-pct" data-pct="1.05">+5%</button>
                                    <button type="button" class="btn-subtle-pct" data-pct="1.10">+10%</button>
                                    <button type="button" class="btn-subtle-pct" data-pct="0.95">-5%</button>
                                </span>
                            </div>
                        </div>

                        <div>
                            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px;">
                                Strategy Note / Rationale (Optional)
                            </label>
                            <input type="text" id="alert-note" placeholder="e.g. Key support bounce or breakout target" class="form-control" style="width: 100%; padding: 10px 12px; font-size: 0.86rem; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 10px; color: var(--text-primary);" />
                        </div>

                        <button type="submit" class="btn btn-primary" style="padding: 12px; font-weight: 800; margin-top: 8px;">
                            <i class="fa-solid fa-bell"></i> Set Active Price Alert
                        </button>
                    </form>
                </div>

                <!-- Right Alerts Management List -->
                <div class="alerts-table-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
                        <h3 style="font-size: 1.15rem; font-weight: 800;">
                            Active Alert Monitor (${activeAlerts.length})
                        </h3>
                        <span style="font-size: 0.8rem; color: var(--color-primary); font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
                            <span class="live-pulsing-dot" style="width: 7px; height: 7px;"></span> Live Threshold Engine
                        </span>
                    </div>

                    ${activeAlerts.length === 0 ? `
                        <div style="text-align: center; padding: 36px 20px; color: var(--text-muted); border: 1px dashed var(--border-color); border-radius: 12px; margin-bottom: 24px;">
                            <i class="fa-solid fa-bell-slash" style="font-size: 2rem; margin-bottom: 8px; opacity: 0.5;"></i>
                            <div>No active price alerts set. Use the form on the left to set your first alert.</div>
                        </div>
                    ` : `
                        <div style="margin-bottom: 24px;">
                            ${activeAlerts.map(alt => {
                                const coin = coins.find(c => c.symbol === alt.symbol);
                                const curPrice = coin ? coin.current_price_usd : 0;
                                const isAbove = alt.condition === 'ABOVE';
                                const diffPct = curPrice > 0 ? ((alt.targetPriceUsd - curPrice) / curPrice) * 100 : 0;

                                return `
                                    <div class="alert-item-card">
                                        <div style="display: flex; align-items: center; gap: 14px;">
                                            <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                                                <i class="fa-solid ${isAbove ? 'fa-arrow-trend-up text-success' : 'fa-arrow-trend-down text-danger'}"></i>
                                            </div>
                                            <div>
                                                <div style="font-weight: 800; font-size: 1.05rem; color: var(--text-primary);">
                                                    ${alt.symbol} ${isAbove ? '&ge;' : '&le;'} ${Currency.format(alt.targetPriceUsd)}
                                                </div>
                                                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
                                                    Current: <strong style="font-family: monospace;">${Currency.format(curPrice)}</strong> 
                                                    (${diffPct >= 0 ? '+' : ''}${diffPct.toFixed(2)}% to target)
                                                </div>
                                                ${alt.note ? `<div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">${alt.note}</div>` : ''}
                                            </div>
                                        </div>

                                        <div style="display: flex; gap: 8px;">
                                            <button type="button" class="btn btn-outline btn-trigger-test" data-id="${alt.id}" title="Simulate Immediate Trigger" style="padding: 6px 12px; font-size: 0.78rem;">
                                                <i class="fa-solid fa-play"></i> Trigger
                                            </button>
                                            <button type="button" class="btn btn-outline btn-delete-alert" data-id="${alt.id}" title="Delete Alert" style="padding: 6px 10px; font-size: 0.78rem; color: var(--color-danger);">
                                                <i class="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}

                    <!-- Triggered Alerts Log -->
                    <div style="border-top: 1px solid var(--border-color); padding-top: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                            <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-primary); margin: 0;">
                                Triggered Alert History (${triggeredAlerts.length})
                            </h4>
                            ${triggeredAlerts.length > 0 ? `
                                <button type="button" id="clear-triggered-btn" style="background: none; border: none; color: var(--color-danger); font-size: 0.78rem; cursor: pointer; text-decoration: underline;">
                                    Clear History
                                </button>
                            ` : ''}
                        </div>

                        ${triggeredAlerts.length === 0 ? `
                            <div style="font-size: 0.82rem; color: var(--text-muted);">No triggered alerts yet.</div>
                        ` : `
                            <div>
                                ${triggeredAlerts.slice(0, 5).map(alt => `
                                    <div class="alert-item-card triggered">
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <i class="fa-solid fa-circle-check text-success"></i>
                                            <div>
                                                <div style="font-weight: 700; font-size: 0.92rem;">
                                                    ${alt.symbol} ${alt.condition === 'ABOVE' ? 'rose above' : 'dropped below'} ${Currency.format(alt.targetPriceUsd)}
                                                </div>
                                                <div style="font-size: 0.74rem; color: var(--text-muted);">
                                                    Triggered at ${new Date(alt.triggeredAt || Date.now()).toLocaleTimeString()} &bull; ${alt.note || 'Target reached'}
                                                </div>
                                            </div>
                                        </div>
                                        <button type="button" class="btn btn-outline btn-delete-alert" data-id="${alt.id}" style="padding: 4px 8px; font-size: 0.74rem;">
                                            &times;
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                </div>
            </div>

            <!-- Priority Watchlist Section -->
            <div class="glass-card" style="padding: 28px; margin-top: 36px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 4px;">
                            <i class="fa-solid fa-star text-warning"></i> Quick Simulation Watchlist
                        </h3>
                        <p style="font-size: 0.86rem; color: var(--text-secondary); margin: 0;">
                            Your personalized set of monitored cryptocurrencies. One-click access to swaps, simulator trades, and target price alerts.
                        </p>
                    </div>

                    <div style="display: flex; gap: 8px; align-items: center;">
                        <select id="add-watchlist-select" class="form-control" style="padding: 8px 12px; font-size: 0.84rem; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary);">
                            <option value="">+ Add to Watchlist...</option>
                            ${coins.filter(c => !watchlistSymbols.includes(c.symbol)).map(c => `
                                <option value="${c.symbol}">${c.name} (${c.symbol})</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="watchlist-grid">
                    ${watchlistSymbols.map(sym => {
                        const coin = coins.find(c => c.symbol === sym) || { name: sym, symbol: sym, current_price_usd: 1.0, change_24h: 0 };
                        const isUp = (coin.change_24h || 0) >= 0;

                        return `
                            <div class="watchlist-card">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.88rem; color: var(--color-primary);">
                                        ${sym.slice(0, 3)}
                                    </div>
                                    <div>
                                        <div style="font-weight: 800; font-size: 0.96rem;">${coin.name}</div>
                                        <div style="font-size: 0.76rem; color: var(--text-muted); font-family: monospace;">${sym}</div>
                                    </div>
                                </div>

                                <div style="text-align: right;">
                                    <div style="font-weight: 800; font-size: 1rem; font-family: monospace;">
                                        ${Currency.format(coin.current_price_usd)}
                                    </div>
                                    <div style="font-size: 0.78rem; font-weight: 700; color: ${isUp ? 'var(--color-success)' : 'var(--color-danger)'};">
                                        <i class="fa-solid ${isUp ? 'fa-caret-up' : 'fa-caret-down'}"></i>
                                        ${isUp ? '+' : ''}${(coin.change_24h || 0).toFixed(2)}%
                                    </div>
                                </div>

                                <button type="button" class="btn-remove-watchlist" data-sym="${sym}" title="Remove from Watchlist" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; font-size: 0.9rem; margin-left: 8px;">
                                    <i class="fa-solid fa-star text-warning"></i>
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        this.bindEvents(container);
    },

    bindEvents(container) {
        const symbolSelect = container.querySelector('#alert-symbol-select');
        const priceHint = container.querySelector('#alert-current-price-hint');
        const targetInput = container.querySelector('#alert-target-price');

        const updateHint = () => {
            const opt = symbolSelect.options[symbolSelect.selectedIndex];
            const p = parseFloat(opt.getAttribute('data-price') || '100');
            if (priceHint) priceHint.textContent = Currency.format(p);
            if (targetInput && !targetInput.value) {
                targetInput.value = (p * 1.05).toFixed(p < 1 ? 4 : 2);
            }
        };

        if (symbolSelect) {
            symbolSelect.onchange = updateHint;
            updateHint();
        }

        container.querySelectorAll('.btn-subtle-pct').forEach(btn => {
            btn.onclick = () => {
                const opt = symbolSelect.options[symbolSelect.selectedIndex];
                const p = parseFloat(opt.getAttribute('data-price') || '100');
                const pct = parseFloat(btn.getAttribute('data-pct'));
                if (targetInput) {
                    targetInput.value = (p * pct).toFixed(p < 1 ? 4 : 2);
                }
            };
        });

        const form = container.querySelector('#create-alert-form');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                const sym = symbolSelect.value;
                const cond = form.querySelector('input[name="alert-condition"]:checked').value;
                const tgt = parseFloat(targetInput.value);
                const note = container.querySelector('#alert-note').value.trim();

                if (isNaN(tgt) || tgt <= 0) {
                    Toast.error('Please enter a valid target price.', 'Invalid Target');
                    return;
                }

                const alerts = this.getAlerts();
                const newAlt = {
                    id: 'alt-' + Date.now(),
                    symbol: sym,
                    condition: cond,
                    targetPriceUsd: tgt,
                    note: note || `Alert when ${sym} is ${cond === 'ABOVE' ? '>=' : '<='} ${Currency.format(tgt)}`,
                    isActive: true,
                    isTriggered: false,
                    createdAt: new Date().toISOString(),
                    triggeredAt: null
                };

                alerts.unshift(newAlt);
                this.saveAlerts(alerts);
                Toast.success(`Price alert created for ${sym} at ${Currency.format(tgt)} USD`, 'Alert Activated');
                this.render(container);
            };
        }

        container.querySelectorAll('.btn-trigger-test').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                const alerts = this.getAlerts();
                const alt = alerts.find(a => a.id === id);
                if (alt) {
                    alt.isTriggered = true;
                    alt.triggeredAt = new Date().toISOString();
                    this.saveAlerts(alerts);
                    Toast.show({
                        title: `Target Breached: ${alt.symbol} Alert Triggered!`,
                        message: `${alt.symbol} has reached ${Currency.format(alt.targetPriceUsd)} USD. Condition (${alt.condition}) met.`,
                        type: 'warning',
                        txRef: 'TRIGGER-TEST'
                    });
                    this.render(container);
                }
            };
        });

        container.querySelectorAll('.btn-delete-alert').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                let alerts = this.getAlerts();
                alerts = alerts.filter(a => a.id !== id);
                this.saveAlerts(alerts);
                Toast.info('Price alert removed.', 'Alert Deleted');
                this.render(container);
            };
        });

        const clearBtn = container.querySelector('#clear-triggered-btn');
        if (clearBtn) {
            clearBtn.onclick = () => {
                let alerts = this.getAlerts();
                alerts = alerts.filter(a => !a.isTriggered);
                this.saveAlerts(alerts);
                Toast.info('Triggered alert history cleared.', 'History Cleared');
                this.render(container);
            };
        }

        const testBtn = container.querySelector('#test-alert-btn');
        if (testBtn) {
            testBtn.onclick = () => {
                Toast.show({
                    title: 'Simulation Price Alert: BTC Surpassed $75,000!',
                    message: 'Bitcoin has broken above the $75,000 threshold. Strategy target reached.',
                    type: 'success',
                    txRef: 'SAMPLE-ALERT'
                });
            };
        }

        const watchlistSelect = container.querySelector('#add-watchlist-select');
        if (watchlistSelect) {
            watchlistSelect.onchange = () => {
                const sym = watchlistSelect.value;
                if (!sym) return;
                const list = this.getWatchlist();
                if (!list.includes(sym)) {
                    list.push(sym);
                    this.saveWatchlist(list);
                    Toast.success(`${sym} added to personal watchlist.`, 'Watchlist Updated');
                    this.render(container);
                }
            };
        }

        container.querySelectorAll('.btn-remove-watchlist').forEach(btn => {
            btn.onclick = () => {
                const sym = btn.getAttribute('data-sym');
                let list = this.getWatchlist();
                list = list.filter(s => s !== sym);
                this.saveWatchlist(list);
                Toast.info(`${sym} removed from watchlist.`, 'Watchlist Updated');
                this.render(container);
            };
        });
    }
};

window.PriceAlertsView = PriceAlertsView;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PriceAlertsView;
}
