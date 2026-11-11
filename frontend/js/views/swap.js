/**
 * CCPulse Instant Cryptocurrency Swap View
 * Converts coin to coin with realistic DEX liquidity handling fees,
 * network gas fees, and slippage calculations.
 */
const SwapView = {
    fromSymbol: 'BTC',
    toSymbol: 'BDX',
    fromQuantity: 0.1,
    slippageTolerance: 0.005, // 0.5%
    networkFeePct: 0.0015,    // 0.15%
    handlingFeePct: 0.0025,   // 0.25%

    async render(container, params = {}) {
        let cryptos = [];
        try {
            const res = await API.cryptos.list();
            cryptos = res.cryptos || [];
            State.cryptos = cryptos;
        } catch (e) {
            cryptos = State.cryptos && State.cryptos.length ? State.cryptos : CLIENT_STATIC_COINS;
        }

        if (params.fromCoin) this.fromSymbol = params.fromCoin.toUpperCase();
        if (params.toCoin) this.toSymbol = params.toCoin.toUpperCase();
        if (this.fromSymbol === this.toSymbol) {
            this.toSymbol = this.fromSymbol === 'BDX' ? 'BTC' : 'BDX';
        }

        const isGuest = State.isGuest || !State.currentUser;
        let holdings = [];
        if (!isGuest && State.wallet && State.wallet.holdings) {
            holdings = State.wallet.holdings;
        } else if (isGuest && State.guestSession && State.guestSession.holdings) {
            holdings = State.guestSession.holdings;
        }

        // Available balance of the source coin
        const sourceHolding = holdings.find(h => h.symbol === this.fromSymbol);
        const sourceBalance = sourceHolding ? sourceHolding.quantity : 0;

        const fromCrypto = cryptos.find(c => c.symbol === this.fromSymbol) || cryptos[0];
        const toCrypto = cryptos.find(c => c.symbol === this.toSymbol) || cryptos[1];

        const fromPrice = fromCrypto.current_price_usd;
        const toPrice = toCrypto.current_price_usd;
        const exchangeRate = toPrice > 0 ? (fromPrice / toPrice) : 0;
        const inverseRate = fromPrice > 0 ? (toPrice / fromPrice) : 0;

        container.innerHTML = `
            <div style="max-width: 580px; margin: 0 auto; padding: 10px 0 40px 0;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(139, 92, 246, 0.12); color: #8B5CF6; border: 1px solid rgba(139, 92, 246, 0.3); padding: 5px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; margin-bottom: 10px;">
                        <i class="fa-solid fa-repeat"></i> Simulated DEX & AMM Engine
                    </div>
                    <h1 style="font-size: 1.85rem; font-weight: 800; margin-bottom: 6px;">
                        Instant Coin-to-Coin Swap
                    </h1>
                    <p style="color: var(--text-secondary); font-size: 0.92rem;">
                        Convert any cryptocurrency seamlessly with real-time exchange rates, transparent network gas, and liquidity handling fees.
                    </p>
                </div>

                <!-- Swap Card -->
                <div class="glass-card" style="padding: 26px; border: 1px solid rgba(139, 92, 246, 0.25); box-shadow: 0 10px 30px rgba(0,0,0,0.25);">
                    
                    <!-- You Pay Section -->
                    <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: 12px; padding: 18px; margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">You Pay</span>
                            <span style="font-size: 0.82rem; color: var(--text-muted);">
                                Balance: <strong class="font-mono text-cyan" id="swap-from-bal">${sourceBalance >= 100 ? Number(sourceBalance.toFixed(4)).toLocaleString('en-US') : sourceBalance.toFixed(6)} ${this.fromSymbol}</strong>
                            </span>
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                            <input type="number" id="swap-from-input" placeholder="0.00" step="any" min="0" value="${this.fromQuantity || ''}" style="width: 58%; font-size: 1.5rem; font-weight: 800; font-family: var(--font-mono); background: transparent; border: none; outline: none; padding: 0;">
                            
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <select id="swap-from-select" style="padding: 8px 12px; border-radius: 8px; font-weight: 700; font-size: 0.95rem; cursor: pointer;">
                                    ${cryptos.map(c => `
                                        <option value="${c.symbol}" ${c.symbol === this.fromSymbol ? 'selected' : ''}>
                                            ${c.symbol} - ${c.name}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; font-size: 0.8rem; color: var(--text-muted);">
                            <span id="swap-from-usd-val">≈ $0.00 USD</span>
                            <!-- Quick Allocation Buttons -->
                            <div style="display: flex; gap: 6px;">
                                <button type="button" class="btn btn-outline swap-pct-btn" data-pct="0.25" style="padding: 2px 8px; font-size: 0.72rem;">25%</button>
                                <button type="button" class="btn btn-outline swap-pct-btn" data-pct="0.50" style="padding: 2px 8px; font-size: 0.72rem;">50%</button>
                                <button type="button" class="btn btn-outline swap-pct-btn" data-pct="0.75" style="padding: 2px 8px; font-size: 0.72rem;">75%</button>
                                <button type="button" class="btn btn-outline swap-pct-btn" data-pct="1.00" style="padding: 2px 8px; font-size: 0.72rem; font-weight: 700; color: var(--color-primary);">MAX</button>
                            </div>
                        </div>
                    </div>

                    <!-- Invert / Reverse Direction Button -->
                    <div style="display: flex; justify-content: center; margin: -6px 0 6px 0; position: relative; z-index: 2;">
                        <button type="button" id="swap-reverse-btn" class="btn btn-outline" style="width: 40px; height: 40px; border-radius: 50%; padding: 0; display: inline-flex; align-items: center; justify-content: center; background: var(--bg-surface); border: 2px solid var(--border-color); box-shadow: 0 4px 10px rgba(0,0,0,0.2);" title="Switch tokens">
                            <i class="fa-solid fa-arrow-down-up" style="color: var(--color-primary); font-size: 0.95rem;"></i>
                        </button>
                    </div>

                    <!-- You Receive Section -->
                    <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: 12px; padding: 18px; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">You Receive (Estimated)</span>
                            <span style="font-size: 0.82rem; color: var(--text-muted);">
                                ${toCrypto.name}
                            </span>
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                            <input type="text" id="swap-to-output" readonly placeholder="0.00" style="width: 58%; font-size: 1.5rem; font-weight: 800; font-family: var(--font-mono); background: transparent; border: none; outline: none; padding: 0; color: var(--color-success);" value="0.00">
                            
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <select id="swap-to-select" style="padding: 8px 12px; border-radius: 8px; font-weight: 700; font-size: 0.95rem; cursor: pointer;">
                                    ${cryptos.map(c => `
                                        <option value="${c.symbol}" ${c.symbol === this.toSymbol ? 'selected' : ''}>
                                            ${c.symbol} - ${c.name}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; font-size: 0.8rem; color: var(--text-muted);">
                            <span id="swap-to-usd-val">≈ $0.00 USD</span>
                            <span class="text-success font-mono" id="swap-rate-badge" style="font-size: 0.78rem;">
                                1 ${this.fromSymbol} ≈ ${exchangeRate >= 1 ? exchangeRate.toFixed(4) : exchangeRate.toFixed(8)} ${this.toSymbol}
                            </span>
                        </div>
                    </div>

                    <!-- Conversion Breakdown & Fees Details -->
                    <div style="background: rgba(255,255,255,0.02); border: 1px dashed var(--border-color); border-radius: 8px; padding: 14px 18px; margin-bottom: 22px; font-size: 0.82rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: var(--text-secondary);">
                            <span>Exchange Rate:</span>
                            <span class="font-mono text-primary">1 ${this.fromSymbol} = ${exchangeRate >= 1 ? exchangeRate.toFixed(4) : exchangeRate.toFixed(8)} ${this.toSymbol}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: var(--text-secondary);">
                            <span>Liquidity Provider Fee (0.25%):</span>
                            <span class="font-mono" id="swap-handling-fee">$0.00 USD</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: var(--text-secondary);">
                            <span>Network Gas & Transaction Fee (0.15%):</span>
                            <span class="font-mono" id="swap-network-fee">$0.00 USD</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: var(--text-secondary);">
                            <span>Slippage Tolerance:</span>
                            <span class="font-mono">0.50% (Standard AMM)</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid var(--border-color); font-weight: 700; color: var(--text-primary);">
                            <span>Guaranteed Minimum Received:</span>
                            <span class="font-mono text-cyan" id="swap-min-received">0.00 ${this.toSymbol}</span>
                        </div>
                    </div>

                    <!-- Feedback message -->
                    <div id="swap-feedback" class="hidden" style="padding: 12px 16px; border-radius: 8px; font-size: 0.88rem; margin-bottom: 18px;"></div>

                    <!-- Swap Action Button -->
                    <button type="button" id="swap-execute-btn" class="btn btn-primary" style="width: 100%; padding: 15px; font-size: 1.1rem; font-weight: 800; border-radius: 10px; display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <i class="fa-solid fa-repeat"></i> Swap ${this.fromSymbol} to ${this.toSymbol}
                    </button>
                </div>

                <!-- Info footer -->
                <div style="margin-top: 20px; font-size: 0.8rem; color: var(--text-muted); text-align: center; line-height: 1.5;">
                    <i class="fa-solid fa-shield-halved text-success"></i> Zero real money risk. All simulated swaps are recorded in your auditable portfolio ledger.
                </div>
            </div>
        `;

        this.attachEvents(container, cryptos, sourceBalance);
    },

    attachEvents(container, cryptos, initialSourceBalance) {
        const fromInput = container.querySelector('#swap-from-input');
        const toOutput = container.querySelector('#swap-to-output');
        const fromSelect = container.querySelector('#swap-from-select');
        const toSelect = container.querySelector('#swap-to-select');
        const reverseBtn = container.querySelector('#swap-reverse-btn');
        const fromUsdVal = container.querySelector('#swap-from-usd-val');
        const toUsdVal = container.querySelector('#swap-to-usd-val');
        const handlingFeeEl = container.querySelector('#swap-handling-fee');
        const networkFeeEl = container.querySelector('#swap-network-fee');
        const minReceivedEl = container.querySelector('#swap-min-received');
        const executeBtn = container.querySelector('#swap-execute-btn');
        const feedbackEl = container.querySelector('#swap-feedback');

        let currentSourceBal = initialSourceBalance;

        const updateCalculations = () => {
            const fromCrypto = cryptos.find(c => c.symbol === this.fromSymbol) || cryptos[0];
            const toCrypto = cryptos.find(c => c.symbol === this.toSymbol) || cryptos[1];

            const qty = parseFloat(fromInput.value) || 0;
            const fromPrice = fromCrypto.current_price_usd;
            const toPrice = toCrypto.current_price_usd;

            const grossUsd = qty * fromPrice;
            const handlingFee = grossUsd * this.handlingFeePct;
            const networkFee = grossUsd * this.networkFeePct;
            const netUsd = Math.max(0, grossUsd - handlingFee - networkFee);
            const toQty = toPrice > 0 ? (netUsd / toPrice) : 0;
            const minReceived = toQty * (1 - this.slippageTolerance);

            fromUsdVal.textContent = `≈ $${grossUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
            toUsdVal.textContent = `≈ $${netUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
            
            toOutput.value = toQty >= 100 ? Number(toQty.toFixed(4)).toLocaleString('en-US') : toQty.toFixed(6);
            handlingFeeEl.textContent = `$${handlingFee.toFixed(2)} USD`;
            networkFeeEl.textContent = `$${networkFee.toFixed(2)} USD`;
            minReceivedEl.textContent = `${minReceived >= 100 ? Number(minReceived.toFixed(4)).toLocaleString('en-US') : minReceived.toFixed(6)} ${this.toSymbol}`;
        };

        if (fromInput) {
            fromInput.oninput = updateCalculations;
            updateCalculations();
        }

        // Quick Allocation Percent Buttons
        container.querySelectorAll('.swap-pct-btn').forEach(btn => {
            btn.onclick = () => {
                const pct = parseFloat(btn.getAttribute('data-pct'));
                const allocated = currentSourceBal * pct;
                fromInput.value = allocated > 0 ? (allocated >= 100 ? Number(allocated.toFixed(4)) : allocated.toFixed(6)) : '';
                updateCalculations();
            };
        });

        // From Select Change
        fromSelect.onchange = (e) => {
            this.fromSymbol = e.target.value;
            if (this.fromSymbol === this.toSymbol) {
                this.toSymbol = cryptos.find(c => c.symbol !== this.fromSymbol)?.symbol || 'BDX';
            }
            this.render(container);
        };

        // To Select Change
        toSelect.onchange = (e) => {
            this.toSymbol = e.target.value;
            if (this.toSymbol === this.fromSymbol) {
                this.fromSymbol = cryptos.find(c => c.symbol !== this.toSymbol)?.symbol || 'BTC';
            }
            this.render(container);
        };

        // Reverse Direction
        reverseBtn.onclick = () => {
            const temp = this.fromSymbol;
            this.fromSymbol = this.toSymbol;
            this.toSymbol = temp;
            this.render(container);
        };

        // Execute Swap
        executeBtn.onclick = async () => {
            feedbackEl.classList.add('hidden');
            const qty = parseFloat(fromInput.value);

            if (isNaN(qty) || qty <= 0) {
                feedbackEl.style.background = 'rgba(239, 68, 68, 0.1)';
                feedbackEl.style.color = 'var(--color-danger)';
                feedbackEl.textContent = 'Please specify a valid quantity to swap.';
                feedbackEl.classList.remove('hidden');
                return;
            }

            if (qty > currentSourceBal) {
                feedbackEl.style.background = 'rgba(239, 68, 68, 0.1)';
                feedbackEl.style.color = 'var(--color-danger)';
                feedbackEl.textContent = `Insufficient ${this.fromSymbol} balance. Available: ${currentSourceBal.toFixed(6)} ${this.fromSymbol}.`;
                feedbackEl.classList.remove('hidden');
                return;
            }

            executeBtn.disabled = true;
            executeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Executing swap on simulated DEX...';

            try {
                const res = await API.simulator.swap({
                    fromSymbol: this.fromSymbol,
                    toSymbol: this.toSymbol,
                    fromQuantity: qty,
                    slippageTolerance: this.slippageTolerance,
                    networkFeePct: this.networkFeePct,
                    handlingFeePct: this.handlingFeePct
                });

                feedbackEl.style.background = 'rgba(16, 185, 129, 0.1)';
                feedbackEl.style.color = 'var(--color-success)';
                feedbackEl.innerHTML = `
                    <div style="font-weight: 700; margin-bottom: 4px;">
                        <i class="fa-solid fa-circle-check"></i> Swap Executed Successfully!
                    </div>
                    <div>
                        Swapped <strong>${qty.toLocaleString()} ${this.fromSymbol}</strong> for <strong>${res.toQuantityReceived ? res.toQuantityReceived.toFixed(6) : toOutput.value} ${this.toSymbol}</strong>.
                    </div>
                    <div style="margin-top: 8px;">
                        <a href="#portfolio" class="btn btn-outline" style="font-size: 0.78rem; padding: 4px 10px;">
                            <i class="fa-solid fa-wallet"></i> View in Portfolio
                        </a>
                    </div>
                `;
                feedbackEl.classList.remove('hidden');

                // Reload view after brief delay
                setTimeout(() => {
                    this.render(container);
                }, 1600);

            } catch (err) {
                feedbackEl.style.background = 'rgba(239, 68, 68, 0.1)';
                feedbackEl.style.color = 'var(--color-danger)';
                feedbackEl.textContent = err.message || 'Failed to execute swap.';
                feedbackEl.classList.remove('hidden');
            } finally {
                executeBtn.disabled = false;
                executeBtn.innerHTML = `<i class="fa-solid fa-repeat"></i> Swap ${this.fromSymbol} to ${this.toSymbol}`;
            }
        };
    }
};

window.SwapView = SwapView;
