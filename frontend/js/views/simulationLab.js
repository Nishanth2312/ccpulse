/**
 * CCPulse Market Simulation Lab View
 */
const SimulationLabView = {
    selectedScenarioId: 'bull-run',

    async render(container) {
        let scenarios = [];
        try {
            const res = await API.simulationLab.getScenarios();
            scenarios = res.scenarios || [];
        } catch (e) {
            scenarios = [];
        }

        container.innerHTML = `
            <div style="margin-bottom: 28px;">
                <h1 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 6px;">
                    <i class="fa-solid fa-flask-vial text-cyan"></i> Market Simulation Lab
                </h1>
                <p style="color: var(--text-secondary); font-size: 0.95rem;">
                    Stress-test your virtual portfolio against simulated historical market shocks, liquidity cascades, and protocol surges.
                </p>
            </div>

            <!-- Scenario Selection Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 32px;" id="scenarios-grid">
                ${scenarios.map(s => `
                    <div class="glass-card scenario-card ${s.id === this.selectedScenarioId ? 'active-scenario' : ''}" data-id="${s.id}" style="padding: 20px; cursor: pointer; border-width: ${s.id === this.selectedScenarioId ? '2px' : '1px'}; border-color: ${s.id === this.selectedScenarioId ? 'var(--color-primary)' : 'var(--border-color)'};">
                        <div style="font-weight: 700; font-size: 1.05rem; margin-bottom: 8px; color: var(--text-primary);">
                            ${s.title}
                        </div>
                        <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary);">
                            ${s.description}
                        </p>
                    </div>
                `).join('')}
            </div>

            <!-- Simulation Runner & Results Container -->
            <div class="glass-card" style="padding: 28px; margin-bottom: 32px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
                    <div>
                        <h2 style="font-size: 1.3rem; font-weight: 800;" id="sim-scenario-title">Scenario Stress Test</h2>
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
                            Applies simulated volatility shocks directly to your portfolio holdings.
                        </div>
                    </div>
                    <button type="button" id="run-sim-test-btn" class="btn btn-primary" style="padding: 10px 20px;">
                        <i class="fa-solid fa-play"></i> Run Portfolio Stress Test
                    </button>
                </div>

                <div id="sim-results-output">
                    <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                        <i class="fa-solid fa-microscope" style="font-size: 2.5rem; margin-bottom: 12px; opacity: 0.5;"></i>
                        <p>Select a market scenario above and click "Run Portfolio Stress Test" to view simulated impact.</p>
                    </div>
                </div>
            </div>
        `;

        this.attachScenarioEvents(container, scenarios);
    },

    attachScenarioEvents(container, scenarios) {
        const grid = container.querySelector('#scenarios-grid');
        const runBtn = container.querySelector('#run-sim-test-btn');
        const output = container.querySelector('#sim-results-output');

        grid.querySelectorAll('.scenario-card').forEach(card => {
            card.onclick = () => {
                const id = card.getAttribute('data-id');
                this.selectedScenarioId = id;
                grid.querySelectorAll('.scenario-card').forEach(c => {
                    c.style.borderColor = 'var(--border-color)';
                    c.style.borderWidth = '1px';
                });
                card.style.borderColor = 'var(--color-primary)';
                card.style.borderWidth = '2px';
            };
        });

        runBtn.onclick = async () => {
            runBtn.disabled = true;
            runBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Calculating scenario impact...';

            try {
                const res = await API.simulationLab.simulate(this.selectedScenarioId);
                const { scenario, impact } = res;

                const deltaClass = impact.totalDeltaUsd >= 0 ? 'text-success' : 'text-danger';
                const deltaSign = impact.totalDeltaUsd >= 0 ? '+' : '';

                output.innerHTML = `
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--border-color);">
                        <div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Original Portfolio</div>
                            <div class="font-mono" style="font-size: 1.4rem; font-weight: 800; margin-top: 4px;">
                                ${Currency.format(impact.originalPortfolioValueUsd)}
                            </div>
                        </div>
                        <div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Simulated Portfolio</div>
                            <div class="font-mono" style="font-size: 1.4rem; font-weight: 800; margin-top: 4px;">
                                ${Currency.format(impact.simulatedPortfolioValueUsd)}
                            </div>
                        </div>
                        <div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Net Simulated Shift</div>
                            <div class="font-mono ${deltaClass}" style="font-size: 1.4rem; font-weight: 800; margin-top: 4px;">
                                ${deltaSign}${Currency.format(impact.totalDeltaUsd)} (${deltaSign}${impact.totalDeltaPercent}%)
                            </div>
                        </div>
                    </div>

                    <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 12px;">Asset-by-Asset Shock Simulation:</h4>
                    <div class="table-wrapper" style="margin-bottom: 24px;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Asset</th>
                                    <th>Quantity</th>
                                    <th>Original Price</th>
                                    <th>Simulated Price</th>
                                    <th>Price Shift</th>
                                    <th>Simulated Position</th>
                                    <th>Impact ($)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${impact.holdings.map(h => {
                                    const hDeltaClass = h.deltaUsd >= 0 ? 'text-success' : 'text-danger';
                                    const hDeltaSign = h.deltaUsd >= 0 ? '+' : '';
                                    return `
                                        <tr>
                                            <td style="font-weight: 700;">${h.symbol}</td>
                                            <td class="font-mono">${h.quantity.toFixed(4)}</td>
                                            <td class="font-mono">${Currency.formatCryptoPrice(h.originalPriceUsd)}</td>
                                            <td class="font-mono" style="font-weight: 700;">${Currency.formatCryptoPrice(h.simulatedPriceUsd)}</td>
                                            <td class="font-mono ${hDeltaClass}" style="font-weight: 700;">
                                                ${hDeltaSign}${h.priceChangePercent}%
                                            </td>
                                            <td class="font-mono">${Currency.format(h.simulatedValueUsd)}</td>
                                            <td class="font-mono ${hDeltaClass}" style="font-weight: 700;">
                                                ${hDeltaSign}${Currency.format(h.deltaUsd)}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>

                    <!-- Risk Takeaway -->
                    <div style="background: rgba(0, 240, 255, 0.05); border: 1px solid rgba(0, 240, 255, 0.25); border-radius: 8px; padding: 18px;">
                        <strong style="color: var(--color-primary); font-size: 0.95rem;">
                            <i class="fa-solid fa-lightbulb"></i> Educational Risk Takeaway:
                        </strong>
                        <p style="font-size: 0.9rem; line-height: 1.6; color: var(--text-secondary); margin-top: 6px;">
                            ${scenario.riskTakeaway}
                        </p>
                    </div>
                `;
            } catch (err) {
                output.innerHTML = `<div style="color: var(--color-danger); padding: 20px;">${err.message}</div>`;
            } finally {
                runBtn.disabled = false;
                runBtn.innerHTML = '<i class="fa-solid fa-play"></i> Run Portfolio Stress Test';
            }
        };
    }
};

window.SimulationLabView = SimulationLabView;

