/**
 * CCPulse Safety & Security Center View
 */
const SafetyCenterView = {
    async render(container) {
        container.innerHTML = `
            <div style="margin-bottom: 28px;">
                <h1 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 6px;">
                    <i class="fa-solid fa-shield-halved text-cyan"></i> Safety & Security Center
                </h1>
                <p style="color: var(--text-secondary); font-size: 0.95rem;">
                    Critical security guidelines, scam avoidance protocols, and position risk calculations.
                </p>
            </div>

            <!-- Risk Sizing Calculator -->
            <div class="glass-card" style="padding: 28px; margin-bottom: 32px;">
                <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 16px;">
                    <i class="fa-solid fa-calculator text-cyan"></i> Educational Position Risk Calculator
                </h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 20px;">
                    <div>
                        <label for="calc-balance" style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px;">Virtual Account Balance ($ USD)</label>
                        <input type="number" id="calc-balance" value="5000" style="width: 100%;">
                    </div>
                    <div>
                        <label for="calc-risk-pct" style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px;">Max Risk Per Trade (%)</label>
                        <input type="number" id="calc-risk-pct" value="2" step="0.5" min="0.1" max="10" style="width: 100%;">
                    </div>
                    <div>
                        <label for="calc-stop-loss" style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px;">Stop-Loss Distance (%)</label>
                        <input type="number" id="calc-stop-loss" value="5" step="0.5" min="0.5" max="50" style="width: 100%;">
                    </div>
                </div>

                <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                    <div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Maximum Dollar Risk</div>
                        <div id="calc-res-risk" class="font-mono text-danger" style="font-size: 1.35rem; font-weight: 800; margin-top: 4px;">$100.00 USD</div>
                    </div>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Recommended Position Size</div>
                        <div id="calc-res-size" class="font-mono text-cyan" style="font-size: 1.35rem; font-weight: 800; margin-top: 4px;">$2,000.00 USD</div>
                    </div>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Account Exposure Ratio</div>
                        <div id="calc-res-ratio" class="font-mono" style="font-size: 1.35rem; font-weight: 800; margin-top: 4px;">40.0%</div>
                    </div>
                </div>
            </div>

            <!-- Security Commandments -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
                <div class="glass-card" style="padding: 24px;">
                    <div style="font-size: 1.8rem; color: var(--color-danger); margin-bottom: 12px;">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 8px;">1. Never Share Seed Phrases</h3>
                    <p style="font-size: 0.88rem; line-height: 1.6; color: var(--text-secondary);">
                        No legitimate exchange, developer, or administrator will ever ask for your 12 or 24-word recovery mnemonic. Sharing it surrenders complete cryptographic control of your assets.
                    </p>
                </div>

                <div class="glass-card" style="padding: 24px;">
                    <div style="font-size: 1.8rem; color: var(--color-primary); margin-bottom: 12px;">
                        <i class="fa-solid fa-lock"></i>
                    </div>
                    <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 8px;">2. Hardware Self-Custody</h3>
                    <p style="font-size: 0.88rem; line-height: 1.6; color: var(--text-secondary);">
                        Centralized exchanges represent third-party counterparty risk. Understand the golden rule: <em>"Not your keys, not your coins."</em> Hardware security modules isolate private keys offline.
                    </p>
                </div>

                <div class="glass-card" style="padding: 24px;">
                    <div style="font-size: 1.8rem; color: var(--color-purple); margin-bottom: 12px;">
                        <i class="fa-solid fa-user-secret"></i>
                    </div>
                    <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 8px;">3. Privacy Hygiene</h3>
                    <p style="font-size: 0.88rem; line-height: 1.6; color: var(--text-secondary);">
                        Public blockchains (Bitcoin, Ethereum, Solana) are permanently traceable through heuristic clustering. Confidential ledgers (Monero, Beldex) protect personal financial sovereignty.
                    </p>
                </div>
            </div>
        `;

        // Attach calculator logic
        const balInput = container.querySelector('#calc-balance');
        const riskInput = container.querySelector('#calc-risk-pct');
        const stopInput = container.querySelector('#calc-stop-loss');

        const recompute = () => {
            const bal = parseFloat(balInput.value) || 0;
            const riskPct = parseFloat(riskInput.value) || 0;
            const stopPct = parseFloat(stopInput.value) || 1;

            const maxRiskDollars = bal * (riskPct / 100);
            const posSize = stopPct > 0 ? (maxRiskDollars / (stopPct / 100)) : 0;
            const exposure = bal > 0 ? (posSize / bal) * 100 : 0;

            container.querySelector('#calc-res-risk').textContent = `$${maxRiskDollars.toFixed(2)} USD`;
            container.querySelector('#calc-res-size').textContent = `$${posSize.toFixed(2)} USD`;
            container.querySelector('#calc-res-ratio').textContent = `${exposure.toFixed(1)}%`;
        };

        balInput.oninput = recompute;
        riskInput.oninput = recompute;
        stopInput.oninput = recompute;
    }
};

window.SafetyCenterView = SafetyCenterView;

