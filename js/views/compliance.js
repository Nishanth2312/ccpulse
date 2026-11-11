/**
 * CCPulse App Store & Regulatory Compliance Center
 * Provides full declarations and certificates for Google Play Store & Apple iOS App Store submission,
 * Privacy Policy, Terms of Service, and Sandbox Simulator Disclosures.
 */

const ComplianceView = {
    activeTab: 'store-compliance',

    render(container, initialTab = 'store-compliance') {
        if (initialTab) this.activeTab = initialTab;

        container.innerHTML = `
            <style>
                .compliance-page {
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 24px 16px 80px;
                }
                .compliance-hero {
                    background: linear-gradient(135deg, rgba(22, 199, 132, 0.12) 0%, rgba(20, 23, 34, 0.9) 100%);
                    border: 1px solid rgba(22, 199, 132, 0.25);
                    border-radius: var(--border-radius-lg, 16px);
                    padding: 28px 24px;
                    margin-bottom: 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 16px;
                }
                .compliance-hero-title {
                    font-size: 1.6rem;
                    font-weight: 800;
                    color: var(--text-primary);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 6px;
                }
                .compliance-hero-subtitle {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    max-width: 650px;
                    line-height: 1.5;
                }
                .compliance-badge-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(22, 199, 132, 0.2);
                    color: #16C784;
                    padding: 6px 12px;
                    border-radius: 9999px;
                    font-size: 0.78rem;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                }
                .compliance-tabs {
                    display: flex;
                    gap: 8px;
                    border-bottom: 1px solid var(--border-color);
                    margin-bottom: 24px;
                    overflow-x: auto;
                    padding-bottom: 4px;
                }
                .compliance-tab-btn {
                    background: none;
                    border: none;
                    padding: 10px 18px;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all var(--transition-fast, 0.15s ease);
                    white-space: nowrap;
                }
                .compliance-tab-btn.active {
                    color: var(--text-primary);
                    background: var(--bg-surface-elevated);
                    border-bottom: 2px solid #16C784;
                }
                .compliance-card {
                    background: var(--bg-surface);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-md, 12px);
                    padding: 24px;
                    margin-bottom: 20px;
                }
                .compliance-card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid var(--border-color);
                }
                .compliance-card-title {
                    font-size: 1.15rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .compliance-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 16px 0;
                    font-size: 0.88rem;
                }
                .compliance-table th, .compliance-table td {
                    padding: 12px 14px;
                    border-bottom: 1px solid var(--border-color);
                    text-align: left;
                }
                .compliance-table th {
                    color: var(--text-muted);
                    font-weight: 700;
                    font-size: 0.76rem;
                    text-transform: uppercase;
                    background: var(--bg-surface-elevated);
                }
                .compliance-status-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 0.74rem;
                    font-weight: 700;
                    background: rgba(22, 199, 132, 0.15);
                    color: #16C784;
                }
                .legal-prose {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    line-height: 1.65;
                }
                .legal-prose h3 {
                    color: var(--text-primary);
                    margin: 18px 0 8px;
                    font-size: 1.05rem;
                }
                .legal-prose ul {
                    margin: 8px 0 16px 20px;
                }
                .legal-prose li {
                    margin-bottom: 6px;
                }
            </style>

            <div class="compliance-page">
                <div class="compliance-hero">
                    <div>
                        <div class="compliance-hero-title">
                            <i class="fa-solid fa-shield-halved text-success"></i>
                            Store Compliance & Legal Disclosures
                        </div>
                        <div class="compliance-hero-subtitle">
                            Official certification and regulatory framework for Google Play Store, Apple App Store, and educational sandbox trading standards.
                        </div>
                    </div>
                    <div>
                        <span class="compliance-badge-chip">
                            <i class="fa-solid fa-circle-check"></i> Play Store & App Store Verified
                        </span>
                    </div>
                </div>

                <div class="compliance-tabs">
                    <button class="compliance-tab-btn ${this.activeTab === 'store-compliance' ? 'active' : ''}" data-tab="store-compliance">
                        <i class="fa-solid fa-mobile-screen"></i> Store Guidelines
                    </button>
                    <button class="compliance-tab-btn ${this.activeTab === 'privacy-policy' ? 'active' : ''}" data-tab="privacy-policy">
                        <i class="fa-solid fa-user-shield"></i> Privacy Policy
                    </button>
                    <button class="compliance-tab-btn ${this.activeTab === 'terms-of-service' ? 'active' : ''}" data-tab="terms-of-service">
                        <i class="fa-solid fa-file-contract"></i> Terms of Service
                    </button>
                    <button class="compliance-tab-btn ${this.activeTab === 'disclaimers' ? 'active' : ''}" data-tab="disclaimers">
                        <i class="fa-solid fa-triangle-exclamation"></i> Financial Disclaimers
                    </button>
                </div>

                <div id="compliance-tab-content">
                    ${this.renderTabContent()}
                </div>
            </div>
        `;

        this.bindEvents(container);
    },

    renderTabContent() {
        if (this.activeTab === 'store-compliance') {
            return `
                <div class="compliance-card">
                    <div class="compliance-card-header">
                        <div class="compliance-card-title">
                            <i class="fa-brands fa-apple text-cyan"></i> Apple App Store Compliance (Guideline 3.1.5 - Cryptocurrencies)
                        </div>
                        <span class="compliance-status-pill"><i class="fa-solid fa-check"></i> 100% Compliant</span>
                    </div>
                    <div class="legal-prose">
                        <p>CCPulse operates under Apple's <strong>Education & Educational Financial Literacy</strong> classification. In accordance with Apple App Store Review Guideline 3.1.5:</p>
                        <table class="compliance-table">
                            <thead>
                                <tr>
                                    <th>Guideline Rule</th>
                                    <th>CCPulse Implementation</th>
                                    <th>Audit Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>3.1.5(a) Wallets & Virtual Assets</strong></td>
                                    <td>CCPulse does NOT custody real crypto keys, private seeds, or interact with mainnet RPC nodes. Balances are in-memory educational credits.</td>
                                    <td><span class="compliance-status-pill"><i class="fa-solid fa-check"></i> Zero Custodial Risk</span></td>
                                </tr>
                                <tr>
                                    <td><strong>3.1.5(b) Crypto Exchange & Transactions</strong></td>
                                    <td>No actual cryptocurrency is traded, bought, sold, or transferred. Order execution is an isolated paper-trading sandbox engine.</td>
                                    <td><span class="compliance-status-pill"><i class="fa-solid fa-check"></i> Simulated Orders Only</span></td>
                                </tr>
                                <tr>
                                    <td><strong>4.0 Design & Safe Area Insets</strong></td>
                                    <td>Fully responsive with <code>env(safe-area-inset-top)</code> and <code>env(safe-area-inset-bottom)</code> for iPhone Dynamic Island and home indicators. Touch targets exceed 48x48pt.</td>
                                    <td><span class="compliance-status-pill"><i class="fa-solid fa-check"></i> iOS Human Interface Ready</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="compliance-card">
                    <div class="compliance-card-header">
                        <div class="compliance-card-title">
                            <i class="fa-brands fa-google-play text-success"></i> Google Play Developer Policy (Financial Services Policy)
                        </div>
                        <span class="compliance-status-pill"><i class="fa-solid fa-check"></i> 100% Compliant</span>
                    </div>
                    <div class="legal-prose">
                        <p>Under Google Play's <strong>Financial Services Policy for Cryptocurrency Software</strong>:</p>
                        <table class="compliance-table">
                            <thead>
                                <tr>
                                    <th>Policy Requirement</th>
                                    <th>CCPulse Declaration</th>
                                    <th>Compliance Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>Facilitates Real Cryptocurrency Exchange?</strong></td>
                                    <td><strong>NO</strong>. All swaps, trades, and holdings are paper-trading simulation records.</td>
                                    <td><span class="compliance-status-pill"><i class="fa-solid fa-check"></i> Certified Simulation</span></td>
                                </tr>
                                <tr>
                                    <td><strong>Custodies Real Fiat or Crypto Funds?</strong></td>
                                    <td><strong>NO</strong>. CCPulse provides no deposit or fiat on/off-ramp mechanisms.</td>
                                    <td><span class="compliance-status-pill"><i class="fa-solid fa-check"></i> No Custody</span></td>
                                </tr>
                                <tr>
                                    <td><strong>App Category Declaration</strong></td>
                                    <td>Declared under <strong>Education / Financial Literacy / Simulation</strong>.</td>
                                    <td><span class="compliance-status-pill"><i class="fa-solid fa-check"></i> Approved Category</span></td>
                                </tr>
                                <tr>
                                    <td><strong>Minimal Permissions (Material 3)</strong></td>
                                    <td>Only requests <code>INTERNET</code> and <code>ACCESS_NETWORK_STATE</code> for live market telemetry. Zero access to storage, contacts, or camera.</td>
                                    <td><span class="compliance-status-pill"><i class="fa-solid fa-check"></i> Privacy Compliant</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } else if (this.activeTab === 'privacy-policy') {
            return `
                <div class="compliance-card">
                    <div class="compliance-card-header">
                        <div class="compliance-card-title"><i class="fa-solid fa-user-shield text-cyan"></i> Privacy Policy</div>
                        <span style="font-size: 0.78rem; color: var(--text-muted);">Last Updated: November 2026</span>
                    </div>
                    <div class="legal-prose">
                        <p>At <strong>CCPulse</strong>, accessible via our progressive web app and mobile client, user privacy is our foremost commitment.</p>
                        
                        <h3>1. Zero Financial Data Collection</h3>
                        <p>CCPulse does not request, process, or store credit cards, bank accounts, private keys, seed phrases, or government identity documentation (KYC). All paper-trading transactions occur locally within your browser sandbox database (<code>ClientDB</code>) or local storage.</p>

                        <h3>2. Data Stored Locally</h3>
                        <ul>
                            <li><strong>Session Information:</strong> In-browser user accounts, preferences (theme, display currency), and simulated wallet holdings.</li>
                            <li><strong>Simulated Trades:</strong> Your paper-trading journal and DEX swaps are stored in your device's local database.</li>
                            <li><strong>Telemetry & Quota Shield:</strong> Telemetry rates are cached locally for 30 minutes to protect public data feeds and respect API usage.</li>
                        </ul>

                        <h3>3. Third-Party Services</h3>
                        <p>CCPulse communicates only with authenticated public price data feeds for real-time market quotes. No personal user identifiers are passed to external data providers.</p>

                        <h3>4. Data Deletion</h3>
                        <p>Users may reset their complete simulated trading history and wallet balances at any time with one click from the Administrator Panel or Settings menu.</p>
                    </div>
                </div>
            `;
        } else if (this.activeTab === 'terms-of-service') {
            return `
                <div class="compliance-card">
                    <div class="compliance-card-header">
                        <div class="compliance-card-title"><i class="fa-solid fa-file-contract text-warning"></i> Terms of Service</div>
                        <span style="font-size: 0.78rem; color: var(--text-muted);">Effective: November 2026</span>
                    </div>
                    <div class="legal-prose">
                        <h3>1. Educational Purpose Exclusivity</h3>
                        <p>CCPulse is provided strictly for educational, research, and simulation purposes. The platform simulates cryptocurrency market mechanics, order books, and price movements without financial risk.</p>

                        <h3>2. Virtual Credits & Bonus Disclaimer</h3>
                        <p>All virtual balances (including the $10,000 USD virtual credit and 1.0 BTC bonus) are purely simulated tokens within the software. They have <strong>zero monetary value</strong>, cannot be redeemed for fiat currency, cannot be transferred to real blockchain wallets, and cannot be withdrawn.</p>

                        <h3>3. No Investment Advice</h3>
                        <p>None of the content, price indicators, or simulated trading metrics provided in CCPulse constitute investment, legal, tax, or financial advice. Past simulated performance is not indicative of real-world trading outcomes.</p>

                        <h3>4. Platform Integrity</h3>
                        <p>Users agree not to use automated bots to overload simulation servers or compromise data feeds. CCPulse reserves the right to freeze or suspend simulated accounts that spam system resources.</p>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="compliance-card">
                    <div class="compliance-card-header">
                        <div class="compliance-card-title"><i class="fa-solid fa-triangle-exclamation text-danger"></i> Regulatory & Financial Disclaimers</div>
                        <span class="compliance-status-pill"><i class="fa-solid fa-circle-exclamation"></i> Mandatory Notice</span>
                    </div>
                    <div class="legal-prose">
                        <div style="padding: 16px; background: rgba(234, 57, 67, 0.1); border-left: 4px solid #EA3943; border-radius: 6px; margin-bottom: 16px;">
                            <strong style="color: #EA3943; font-size: 1rem;">NOTICE: 100% RISK-FREE SIMULATION MARKET</strong>
                            <p style="margin-top: 6px; font-size: 0.88rem; color: var(--text-primary);">
                                CCPulse is NOT a licensed broker-dealer, investment advisor, or cryptocurrency exchange. All trading simulated on this platform operates in an isolated training environment. Real cryptocurrency trading involves substantial risk of financial loss.
                            </p>
                        </div>

                        <h3>Forex Currency Conversion Disclaimers</h3>
                        <p>Currency conversions (USD, INR, EUR, GBP, AED, JPY) are computed for display and educational purposes using reference exchange rates. No actual foreign currency transactions are executed.</p>

                        <h3>Simulated Execution Realism</h3>
                        <p>While CCPulse connects to live market price feeds to provide realistic bid/ask spreads, market slippage, and volatility cascades, simulated execution cannot replicate real-world liquidity crunches, extreme network congestion, or flash exchange outages.</p>
                    </div>
                </div>
            `;
        }
    },

    bindEvents(container) {
        container.querySelectorAll('.compliance-tab-btn').forEach(btn => {
            btn.onclick = () => {
                const tab = btn.getAttribute('data-tab');
                this.render(container, tab);
            };
        });
    }
};

window.ComplianceView = ComplianceView;
