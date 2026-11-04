/**
 * CCPulse Virtual Trading Simulator View
 * Supports both Authenticated Users (with permanent wallet) & Anonymous Guests (temporary session)
 */
const SimulatorView = {
    selectedCrypto: null,
    orderType: 'BUY',

    async render(container, preselectedSymbol = null) {
        let cryptos = [];
        try {
            const res = await API.cryptos.list();
            cryptos = res.cryptos || [];
            State.cryptos = cryptos;
        } catch (e) {
            cryptos = State.cryptos || [];
        }

        // Selected coin
        if (preselectedSymbol) {
            this.selectedCrypto = cryptos.find(c => c.symbol.toUpperCase() === preselectedSymbol.toUpperCase()) || cryptos[0];
        } else if (!this.selectedCrypto && cryptos.length > 0) {
            this.selectedCrypto = cryptos[0];
        }

        // Available balance
        let availableCashUsd = 5000.00;
        let isGuest = State.isGuest || !State.currentUser;

        if (!isGuest && State.wallet) {
            availableCashUsd = State.wallet.availableCashUsd;
        } else if (isGuest && State.guestSession) {
            availableCashUsd = State.guestSession.temporaryBalanceUsd;
        }

        const availableCashFormatted = Currency.format(availableCashUsd);

        // Fetch user holdings for selected coin
        let currentHoldingQty = 0;
        if (!isGuest && State.wallet && State.wallet.holdings) {
            const h = State.wallet.holdings.find(item => item.crypto_id === this.selectedCrypto?.id);
            if (h) currentHoldingQty = h.quantity;
        } else if (isGuest && State.guestSession && State.guestSession.holdings) {
            const h = State.guestSession.holdings.find(item => item.symbol === this.selectedCrypto?.symbol);
            if (h) currentHoldingQty = h.quantity;
        }

        container.innerHTML = `
            <!-- Top Alert for Guest Mode -->
            ${isGuest ? `
                <div style="background: linear-gradient(90deg, rgba(139,92,246,0.15), rgba(0,240,255,0.15)); border: 1px solid rgba(0,240,255,0.3); border-radius: var(--border-radius-md); padding: 16px 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <i class="fa-solid fa-user-secret" style="font-size: 1.5rem; color: var(--color-primary);"></i>
                        <div>
                            <strong style="color: var(--text-primary); font-size: 0.95rem;">Guest Simulator Mode Active</strong>
                            <div style="font-size: 0.82rem; color: var(--text-secondary);">
                                Guest portfolios are stored in temporary browser memory. Register to claim your permanent <strong>$5,000 USD welcome bonus</strong> and synchronize progress across devices!
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn btn-primary" onclick="AuthModals.showRegister()" style="font-size: 0.85rem; padding: 6px 16px;">
                        <i class="fa-solid fa-gift"></i> Claim $5,000 Bonus
                    </button>
                </div>
            ` : `
                <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--border-radius-md); padding: 12px 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fa-solid fa-wallet text-success"></i>
                        <span style="font-size: 0.9rem;">Authenticated Account: <strong>${State.currentUser.username}</strong> &bull; Available Virtual Cash: <strong class="text-success font-mono">${availableCashFormatted}</strong></span>
                    </div>
                    <span style="font-size: 0.75rem; background: rgba(16, 185, 129, 0.2); color: var(--color-success); padding: 2px 8px; border-radius: var(--border-radius-full); font-weight: 700;">
                        Welcome Bonus Active
                    </span>
                </div>
            `}

            <div class="responsive-grid-two-col">
                <!-- Left: Trade Order Form -->
                <div class="glass-card" style="padding: 28px;">
                    <h2 style="font-size: 1.35rem; font-weight: 800; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                        <i class="fa-solid fa-bolt text-cyan"></i> Execute Simulated Trade
                    </h2>

                    <!-- Buy / Sell Mode Tabs -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 24px; background: var(--bg-surface-elevated); padding: 4px; border-radius: var(--border-radius-sm);">
                        <button type="button" id="btn-mode-buy" class="btn ${this.orderType === 'BUY' ? 'btn-primary' : 'btn-outline'}" style="width: 100%; border: none;">
                            <i class="fa-solid fa-arrow-down"></i> BUY
                        </button>
                        <button type="button" id="btn-mode-sell" class="btn ${this.orderType === 'SELL' ? 'btn-primary' : 'btn-outline'}" style="width: 100%; border: none; ${this.orderType === 'SELL' ? 'background: var(--color-danger); color: white;' : ''}">
                            <i class="fa-solid fa-arrow-up"></i> SELL
                        </button>
                    </div>

                    <!-- Asset Selector -->
                    <div style="margin-bottom: 20px;">
                        <label for="sim-crypto-select" style="display: block; font-size: 0.88rem; font-weight: 600; margin-bottom: 8px;">
                            Select Cryptocurrency Asset
                        </label>
                        <select id="sim-crypto-select" style="width: 100%; padding: 12px; font-weight: 600; font-size: 1rem;">
                            ${cryptos.map(c => `
                                <option value="${c.symbol}" ${this.selectedCrypto?.symbol === c.symbol ? 'selected' : ''}>
                                    ${c.name} (${c.symbol}) &bull; ${Currency.formatCryptoPrice(c.current_price_usd)}
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Price Card -->
                    <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                        <div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">Current Market Price</div>
                            <div id="sim-current-price" class="font-mono" style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-top: 2px;">
                                ${Currency.formatCryptoPrice(this.selectedCrypto?.current_price_usd || 0)}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 0.8rem; color: var(--text-muted);">Your Current Position</div>
                            <div id="sim-current-holding" class="font-mono" style="font-size: 1.05rem; font-weight: 700; color: var(--color-primary); margin-top: 2px;">
                                ${currentHoldingQty.toFixed(4)} ${this.selectedCrypto?.symbol}
                            </div>
                        </div>
                    </div>

                    <!-- Quantity Input -->
                    <div style="margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <label for="sim-quantity-input" style="font-size: 0.88rem; font-weight: 600;">Order Quantity (${this.selectedCrypto?.symbol})</label>
                            <span style="font-size: 0.8rem; color: var(--text-muted);">
                                Available: ${this.orderType === 'BUY' ? availableCashFormatted : `${currentHoldingQty.toFixed(4)} ${this.selectedCrypto?.symbol}`}
                            </span>
                        </div>
                        <input type="number" id="sim-quantity-input" placeholder="0.00" step="any" min="0" style="width: 100%; padding: 12px; font-size: 1.1rem; font-weight: 700; font-family: var(--font-mono);">
                    </div>

                    <!-- Quick Percent Buttons -->
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 24px;">
                        <button type="button" class="btn btn-outline quick-pct-btn" data-pct="0.25" style="font-size: 0.8rem; padding: 6px;">25%</button>
                        <button type="button" class="btn btn-outline quick-pct-btn" data-pct="0.50" style="font-size: 0.8rem; padding: 6px;">50%</button>
                        <button type="button" class="btn btn-outline quick-pct-btn" data-pct="0.75" style="font-size: 0.8rem; padding: 6px;">75%</button>
                        <button type="button" class="btn btn-outline quick-pct-btn" data-pct="1.00" style="font-size: 0.8rem; padding: 6px;">100%</button>
                    </div>

                    <!-- Order Summary Breakdown -->
                    <div style="border-top: 1px solid var(--border-color); padding-top: 16px; margin-bottom: 24px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 8px;">
                            <span>Subtotal:</span>
                            <span id="order-subtotal" class="font-mono">$0.00</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 8px;">
                            <span>Simulation Execution Fee:</span>
                            <span class="font-mono text-success">$0.00 (Zero Fee)</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); padding-top: 8px; border-top: 1px dashed var(--border-color);">
                            <span>Total Estimated Value:</span>
                            <span id="order-total" class="font-mono text-cyan">$0.00</span>
                        </div>
                        <div style="font-size: 0.78rem; color: var(--text-muted); text-align: right; margin-top: 4px;" id="order-total-converted">
                            <!-- Converted total -->
                        </div>
                    </div>

                    <div id="sim-feedback-msg" class="hidden" style="padding: 12px; border-radius: 6px; font-size: 0.88rem; margin-bottom: 16px;"></div>

                    <button type="button" id="execute-trade-btn" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 1.05rem;">
                        <i class="fa-solid fa-bolt"></i> Execute ${this.orderType} Order
                    </button>
                </div>

                <!-- Right: Quick Market & Portfolio Info -->
                <div style="display: flex; flex-direction: column; gap: 24px;">
                    <!-- Asset Profile Card -->
                    <div class="glass-card" style="padding: 24px;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                            <img src="${State.getCoinLogo(this.selectedCrypto)}" alt="${this.selectedCrypto?.name}" class="crypto-logo" style="width: 40px; height: 40px; min-width: 40px; min-height: 40px;" onerror="this.onerror=null; this.src='/assets/coins/generic.svg'">
                            <div>
                                <h3 style="font-size: 1.15rem; font-weight: 700;">${this.selectedCrypto?.name}</h3>
                                <span style="font-size: 0.8rem; color: var(--text-muted);">${this.selectedCrypto?.blockchain}</span>
                            </div>
                        </div>
                        <p style="font-size: 0.88rem; line-height: 1.6; color: var(--text-secondary); margin-bottom: 16px;">
                            ${this.selectedCrypto?.educational_content?.substring(0, 180)}...
                        </p>
                        <a href="#crypto/${this.selectedCrypto?.symbol}" style="font-size: 0.85rem; color: var(--color-primary); font-weight: 600;">
                            View Full Blockchain Profile <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>

                    <!-- Risk & Safety Reminder -->
                    <div class="glass-card" style="padding: 24px; background: rgba(0, 240, 255, 0.03);">
                        <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 8px; color: var(--color-primary); display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-graduation-cap"></i> Practice Sizing Rules
                        </h4>
                        <p style="font-size: 0.85rem; line-height: 1.6; color: var(--text-secondary);">
                            Professional traders avoid allocating more than 5% to 10% of their total portfolio into a single volatile altcoin position. Use your $5,000 virtual balance to test disciplined position sizing without emotion!
                        </p>
                    </div>
                </div>
            </div>
        `;

        this.attachSimulatorEvents(container, cryptos, availableCashUsd, currentHoldingQty);
    },

    attachSimulatorEvents(container, cryptos, availableCashUsd, currentHoldingQty) {
        const qtyInput = container.querySelector('#sim-quantity-input');
        const subtotalEl = container.querySelector('#order-subtotal');
        const totalEl = container.querySelector('#order-total');
        const totalConvertedEl = container.querySelector('#order-total-converted');
        const feedbackEl = container.querySelector('#sim-feedback-msg');
        const executeBtn = container.querySelector('#execute-trade-btn');

        const updateOrderTotals = () => {
            const qty = parseFloat(qtyInput.value) || 0;
            const priceUsd = this.selectedCrypto?.current_price_usd || 1;
            const costUsd = qty * priceUsd;

            subtotalEl.textContent = `$${costUsd.toFixed(2)} USD`;
            totalEl.textContent = `$${costUsd.toFixed(2)} USD`;

            const activeCur = Currency.getActiveCode();
            if (activeCur !== 'USD') {
                totalConvertedEl.textContent = `≈ ${Currency.format(costUsd, activeCur)}`;
            } else {
                totalConvertedEl.textContent = '';
            }
        };

        if (qtyInput) {
            qtyInput.oninput = updateOrderTotals;
        }

        // Mode switch
        const buyBtn = container.querySelector('#btn-mode-buy');
        const sellBtn = container.querySelector('#btn-mode-sell');

        buyBtn.onclick = () => {
            this.orderType = 'BUY';
            this.render(container, this.selectedCrypto?.symbol);
        };

        sellBtn.onclick = () => {
            this.orderType = 'SELL';
            this.render(container, this.selectedCrypto?.symbol);
        };

        // Crypto Selector
        const selectEl = container.querySelector('#sim-crypto-select');
        selectEl.onchange = (e) => {
            const coin = cryptos.find(c => c.symbol === e.target.value);
            if (coin) {
                this.selectedCrypto = coin;
                this.render(container, coin.symbol);
            }
        };

        // Quick Percent buttons
        container.querySelectorAll('.quick-pct-btn').forEach(btn => {
            btn.onclick = () => {
                const pct = parseFloat(btn.getAttribute('data-pct'));
                const priceUsd = this.selectedCrypto?.current_price_usd || 1;

                if (this.orderType === 'BUY') {
                    const spendUsd = availableCashUsd * pct;
                    const qty = spendUsd / priceUsd;
                    qtyInput.value = qty.toFixed(4);
                } else {
                    const qty = currentHoldingQty * pct;
                    qtyInput.value = qty.toFixed(4);
                }
                updateOrderTotals();
            };
        });

        // Execute trade
        executeBtn.onclick = async () => {
            feedbackEl.classList.add('hidden');
            const qty = parseFloat(qtyInput.value);

            if (isNaN(qty) || qty <= 0) {
                feedbackEl.style.background = 'rgba(239, 68, 68, 0.1)';
                feedbackEl.style.color = 'var(--color-danger)';
                feedbackEl.textContent = 'Please enter a valid positive order quantity.';
                feedbackEl.classList.remove('hidden');
                return;
            }

            executeBtn.disabled = true;
            executeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Executing simulated trade...';

            try {
                if (State.isGuest || !State.currentUser) {
                    // Guest simulation execution
                    State.updateGuestTrade({
                        type: this.orderType,
                        crypto: this.selectedCrypto,
                        quantity: qty,
                        priceUsd: this.selectedCrypto.current_price_usd
                    });

                    feedbackEl.style.background = 'rgba(16, 185, 129, 0.1)';
                    feedbackEl.style.color = 'var(--color-success)';
                    feedbackEl.innerHTML = `
                        <i class="fa-solid fa-circle-check"></i> [Guest Mode] Successfully executed simulated ${this.orderType} for ${qty.toFixed(4)} ${this.selectedCrypto.symbol}!
                        <br><small style="color:var(--text-muted)">Register anytime to keep your portfolio permanently saved.</small>
                    `;
                    feedbackEl.classList.remove('hidden');
                } else {
                    // Authenticated user atomic trade execution
                    const res = await API.simulator.trade({
                        crypto_id: this.selectedCrypto.id,
                        type: this.orderType,
                        quantity: qty
                    });

                    State.wallet = res.wallet;
                    State.notify('wallet');

                    feedbackEl.style.background = 'rgba(16, 185, 129, 0.1)';
                    feedbackEl.style.color = 'var(--color-success)';
                    feedbackEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${res.message}`;
                    feedbackEl.classList.remove('hidden');
                }

                // Re-render to refresh balances
                setTimeout(() => {
                    this.render(container, this.selectedCrypto?.symbol);
                }, 1400);

            } catch (err) {
                feedbackEl.style.background = 'rgba(239, 68, 68, 0.1)';
                feedbackEl.style.color = 'var(--color-danger)';
                feedbackEl.textContent = err.message;
                feedbackEl.classList.remove('hidden');
            } finally {
                executeBtn.disabled = false;
                executeBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> Execute ${this.orderType} Order`;
            }
        };
    }
};

window.SimulatorView = SimulatorView;

