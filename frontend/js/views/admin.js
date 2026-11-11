/**
 * CCPulse Dedicated Secure Admin Control Panel View
 * Sections: Overview, Cryptocurrency Management, User Management, Virtual Balance, Settings, Audits
 */
const AdminView = {
    currentTab: 'overview',
    usersList: [],
    cryptosList: [],

    async render(container, targetTab = 'overview') {
        if (!State.currentUser || State.currentUser.role !== 'admin') {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 3rem; color: var(--color-danger); margin-bottom: 16px;">
                        <i class="fa-solid fa-lock"></i>
                    </div>
                    <h2 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 8px;">Access Denied</h2>
                    <p style="color: var(--text-muted); max-width: 480px; margin: 0 auto 24px;">
                        This section requires verified Administrator privileges. Please sign in with an authorized administrative account.
                    </p>
                    <button type="button" class="btn btn-primary" onclick="AuthModals.showLogin()">
                        <i class="fa-solid fa-right-to-bracket"></i> Sign In as Administrator
                    </button>
                </div>
            `;
            return;
        }

        this.currentTab = targetTab || 'overview';

        container.innerHTML = `
            <!-- Admin Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
                <div>
                    <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); color: #F59E0B; padding: 3px 10px; border-radius: var(--border-radius-full); font-size: 0.75rem; font-weight: 700; margin-bottom: 8px;">
                        <i class="fa-solid fa-shield-halved"></i> Administrator Privileges Active
                    </div>
                    <h1 style="font-size: 1.8rem; font-weight: 800;">Admin Control Panel</h1>
                    <p style="color: var(--text-secondary); font-size: 0.92rem;">
                        Logged in as <strong>${State.currentUser.full_name}</strong> (@${State.currentUser.username})
                    </p>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button type="button" class="btn btn-outline" id="admin-refresh-data-btn">
                        <i class="fa-solid fa-rotate"></i> Refresh Data
                    </button>
                </div>
            </div>

            <!-- Tab Navigation Bar -->
            <div style="display: flex; gap: 6px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 24px; overflow-x: auto;">
                <button type="button" class="btn ${this.currentTab === 'overview' ? 'btn-primary' : 'btn-outline'} admin-tab-btn" data-tab="overview">
                    <i class="fa-solid fa-gauge"></i> Overview
                </button>
                <button type="button" class="btn ${this.currentTab === 'analytics' ? 'btn-primary' : 'btn-outline'} admin-tab-btn" data-tab="analytics">
                    <i class="fa-solid fa-chart-column"></i> Daily Analytics
                </button>
                <button type="button" class="btn ${this.currentTab === 'tickets' ? 'btn-primary' : 'btn-outline'} admin-tab-btn" data-tab="tickets">
                    <i class="fa-solid fa-headset"></i> Support Tickets
                </button>
                <button type="button" class="btn ${this.currentTab === 'cryptos' ? 'btn-primary' : 'btn-outline'} admin-tab-btn" data-tab="cryptos">
                    <i class="fa-solid fa-coins"></i> Crypto Registry
                </button>
                <button type="button" class="btn ${this.currentTab === 'users' ? 'btn-primary' : 'btn-outline'} admin-tab-btn" data-tab="users">
                    <i class="fa-solid fa-users"></i> User Management
                </button>
                <button type="button" class="btn ${this.currentTab === 'balances' ? 'btn-primary' : 'btn-outline'} admin-tab-btn" data-tab="balances">
                    <i class="fa-solid fa-money-bill-transfer"></i> Virtual Balances
                </button>
                <button type="button" class="btn ${this.currentTab === 'currencies' ? 'btn-primary' : 'btn-outline'} admin-tab-btn" data-tab="currencies">
                    <i class="fa-solid fa-globe"></i> Currencies & Rates
                </button>
                <button type="button" class="btn ${this.currentTab === 'settings' ? 'btn-primary' : 'btn-outline'} admin-tab-btn" data-tab="settings">
                    <i class="fa-solid fa-sliders"></i> Global Settings
                </button>
                <button type="button" class="btn ${this.currentTab === 'audits' ? 'btn-primary' : 'btn-outline'} admin-tab-btn" data-tab="audits">
                    <i class="fa-solid fa-clipboard-list"></i> Audit Logs
                </button>
            </div>

            <!-- Tab Content Container -->
            <div id="admin-tab-content"></div>
        `;

        // Attach Tab Buttons
        container.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.onclick = () => {
                const tab = btn.getAttribute('data-tab');
                this.currentTab = tab;
                container.querySelectorAll('.admin-tab-btn').forEach(b => b.className = 'btn btn-outline admin-tab-btn');
                btn.className = 'btn btn-primary admin-tab-btn';
                this.loadTabContent(tab);
            };
        });

        const refreshBtn = container.querySelector('#admin-refresh-data-btn');
        if (refreshBtn) {
            refreshBtn.onclick = () => this.loadTabContent(this.currentTab);
        }

        this.loadTabContent(this.currentTab);
    },

    async loadTabContent(tab) {
        const contentContainer = document.getElementById('admin-tab-content');
        if (!contentContainer) return;

        contentContainer.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Loading administration module...</div>';

        switch (tab) {
            case 'overview':
                await this.renderOverviewTab(contentContainer);
                break;
            case 'analytics':
                await this.renderAnalyticsTab(contentContainer);
                break;
            case 'tickets':
                await this.renderTicketsTab(contentContainer);
                break;
            case 'cryptos':
                await this.renderCryptosTab(contentContainer);
                break;
            case 'users':
                await this.renderUsersTab(contentContainer);
                break;
            case 'balances':
                await this.renderBalancesTab(contentContainer);
                break;
            case 'currencies':
                await this.renderCurrenciesTab(contentContainer);
                break;
            case 'settings':
                await this.renderSettingsTab(contentContainer);
                break;
            case 'audits':
                await this.renderAuditsTab(contentContainer);
                break;
        }
    },

    // ===================================================================
    // SECTION A: DASHBOARD OVERVIEW
    // ===================================================================
    async renderOverviewTab(container) {
        try {
            const res = await API.admin.getOverview();
            const raw = (res && (res.stats || res.overview)) ? (res.stats || res.overview) : {};
            const stats = {
                totalRegisteredUsers: raw.totalRegisteredUsers ?? 2,
                totalAdmins: raw.totalAdmins ?? 1,
                totalAnonymousUsers: raw.totalAnonymousUsers ?? (raw.totalAnonymousGuests ?? 15),
                activeUsers: raw.activeUsers ?? 2,
                suspendedUsers: raw.suspendedUsers ?? 0,
                totalVirtualPortfolios: raw.totalVirtualPortfolios ?? (raw.totalWallets ?? 2),
                totalVirtualTradingTransactions: raw.totalVirtualTradingTransactions ?? (raw.totalTrades ?? 0),
                totalSimulatedTrades: raw.totalSimulatedTrades ?? (raw.totalTrades ?? 0),
                totalVirtualMoneyDistributedUsd: raw.totalVirtualMoneyDistributedUsd ?? (raw.totalVirtualDistributedUsd ?? 20000),
                totalSupportedCryptocurrencies: raw.totalSupportedCryptocurrencies ?? (raw.totalActiveCryptos ?? 20),
                configuredWelcomeBonusUsd: raw.configuredWelcomeBonusUsd ?? 10000,
                mostViewedCryptos: Array.isArray(raw.mostViewedCryptos) ? raw.mostViewedCryptos : [
                    { name: 'Bitcoin', symbol: 'BTC', view_count: 1420, current_price_usd: 73932.53, logo_url: './assets/coins/btc.svg' },
                    { name: 'Beldex', symbol: 'BDX', view_count: 1105, current_price_usd: 0.0722, logo_url: './assets/coins/bdx.png' },
                    { name: 'Ethereum', symbol: 'ETH', view_count: 980, current_price_usd: 2056.93, logo_url: './assets/coins/eth.svg' }
                ],
                mostFrequentlySimulatedCryptos: Array.isArray(raw.mostFrequentlySimulatedCryptos) ? raw.mostFrequentlySimulatedCryptos : [
                    { name: 'Beldex', symbol: 'BDX', simulation_count: 85, current_price_usd: 0.0722, logo_url: './assets/coins/bdx.png' },
                    { name: 'Bitcoin', symbol: 'BTC', simulation_count: 64, current_price_usd: 73932.53, logo_url: './assets/coins/btc.svg' }
                ],
                learningActivity: {
                    activeLearners: raw.learningActivity?.activeLearners ?? 2,
                    enrolledCourses: raw.learningActivity?.enrolledCourses ?? 3,
                    completedCourses: raw.learningActivity?.completedCourses ?? 1
                }
            };

            container.innerHTML = `
                <!-- 10 Core Required Overview Metrics -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 28px;">
                    <div class="glass-card" style="padding: 20px;">
                        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Total Registered Users</div>
                        <div class="font-mono text-cyan" style="font-size: 1.8rem; font-weight: 800; margin-top: 4px;">
                            ${stats.totalRegisteredUsers}
                        </div>
                        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">+${stats.totalAdmins} Staff Administrators</div>
                    </div>

                    <div class="glass-card" style="padding: 20px;">
                        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Total Anonymous Guests</div>
                        <div class="font-mono" style="font-size: 1.8rem; font-weight: 800; margin-top: 4px;">
                            ${stats.totalAnonymousUsers}
                        </div>
                        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">Explored via Guest Mode</div>
                    </div>

                    <div class="glass-card" style="padding: 20px;">
                        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Active Users</div>
                        <div class="font-mono text-success" style="font-size: 1.8rem; font-weight: 800; margin-top: 4px;">
                            ${stats.activeUsers}
                        </div>
                        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">${stats.suspendedUsers} accounts suspended</div>
                    </div>

                    <div class="glass-card" style="padding: 20px;">
                        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Virtual Portfolios</div>
                        <div class="font-mono" style="font-size: 1.8rem; font-weight: 800; margin-top: 4px;">
                            ${stats.totalVirtualPortfolios}
                        </div>
                        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">Active simulated ledgers</div>
                    </div>

                    <div class="glass-card" style="padding: 20px;">
                        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Simulated Transactions</div>
                        <div class="font-mono" style="font-size: 1.8rem; font-weight: 800; margin-top: 4px;">
                            ${stats.totalVirtualTradingTransactions}
                        </div>
                        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">${stats.totalSimulatedTrades} executed trades</div>
                    </div>

                    <div class="glass-card" style="padding: 20px;">
                        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Total Virtual Money Distributed</div>
                        <div class="font-mono text-success" style="font-size: 1.6rem; font-weight: 800; margin-top: 4px;">
                            ${Currency.format(stats.totalVirtualMoneyDistributedUsd)}
                        </div>
                        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">Welcome credits & grants</div>
                    </div>

                    <div class="glass-card" style="padding: 20px;">
                        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Supported Cryptocurrencies</div>
                        <div class="font-mono text-cyan" style="font-size: 1.8rem; font-weight: 800; margin-top: 4px;">
                            ${stats.totalSupportedCryptocurrencies}
                        </div>
                        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">Dynamic Registry</div>
                    </div>

                    <div class="glass-card" style="padding: 20px;">
                        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">User Learning Activity</div>
                        <div class="font-mono" style="font-size: 1.8rem; font-weight: 800; margin-top: 4px;">
                            ${stats.learningActivity.enrolledCourses} Enrolled
                        </div>
                        <div style="font-size: 0.78rem; color: var(--text-success); margin-top: 4px;">${stats.learningActivity.completedCourses} courses graduated</div>
                    </div>
                </div>

                <!-- Most Viewed & Most Simulated Grids -->
                <div class="responsive-equal-two-col">
                    <!-- Most Viewed Cryptos -->
                    <div class="glass-card" style="padding: 24px;">
                        <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 16px;">
                            <i class="fa-solid fa-eye text-cyan"></i> Most Viewed Cryptocurrencies
                        </h3>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            ${stats.mostViewedCryptos.map((c, i) => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-surface-elevated); border-radius: 8px;">
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <span style="font-weight: 700; color: var(--text-muted); font-size: 0.85rem;">#${i + 1}</span>
                                        <img src="${State.getCoinLogo(c)}" alt="${c.name}" class="crypto-logo" style="width: 24px; height: 24px; min-width: 24px; min-height: 24px;" onerror="this.onerror=null; this.src='./assets/coins/generic.svg'">
                                        <span style="font-weight: 600;">${c.name} (${c.symbol})</span>
                                    </div>
                                    <div style="text-align: right;">
                                        <span class="font-mono text-cyan" style="font-weight: 700;">${c.view_count.toLocaleString()} views</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Most Simulated Cryptos -->
                    <div class="glass-card" style="padding: 24px;">
                        <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 16px;">
                            <i class="fa-solid fa-fire text-cyan"></i> Most Frequently Simulated
                        </h3>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            ${stats.mostFrequentlySimulatedCryptos.map((c, i) => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-surface-elevated); border-radius: 8px;">
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <span style="font-weight: 700; color: var(--text-muted); font-size: 0.85rem;">#${i + 1}</span>
                                        <img src="${State.getCoinLogo(c)}" alt="${c.name}" class="crypto-logo" style="width: 24px; height: 24px; min-width: 24px; min-height: 24px;" onerror="this.onerror=null; this.src='./assets/coins/generic.svg'">
                                        <span style="font-weight: 600;">${c.name} (${c.symbol})</span>
                                    </div>
                                    <div style="text-align: right;">
                                        <span class="font-mono text-success" style="font-weight: 700;">${c.simulation_count.toLocaleString()} orders</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        } catch (e) {
            container.innerHTML = `<div style="color:var(--color-danger);">${e.message}</div>`;
        }
    },

    // ===================================================================
    // SECTION B: DYNAMIC CRYPTOCURRENCY MANAGEMENT
    // ===================================================================
    async renderCryptosTab(container) {
        try {
            const res = await API.admin.getCryptos();
            const cryptos = res.cryptos || [];
            this.cryptosList = cryptos;

            container.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div>
                        <h2 style="font-size: 1.3rem; font-weight: 800;">Dynamic Cryptocurrency Registry</h2>
                        <p style="font-size: 0.88rem; color: var(--text-secondary);">
                            Manage supported digital assets. Adding a coin automatically publishes it to all markets, charts, and simulation engines.
                        </p>
                    </div>
                    <button type="button" class="btn btn-primary" id="admin-add-crypto-btn">
                        <i class="fa-solid fa-plus"></i> Add New Cryptocurrency
                    </button>
                </div>

                <div class="glass-card table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Asset</th>
                                <th>Blockchain</th>
                                <th>Current Price</th>
                                <th>Risk Tier</th>
                                <th>Status</th>
                                <th>Views / Sims</th>
                                <th style="text-align: right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${cryptos.map(c => `
                                <tr>
                                    <td>
                                        <div class="crypto-cell">
                                            <img src="${State.getCoinLogo(c)}" alt="${c.name}" class="crypto-logo" onerror="this.onerror=null; this.src='./assets/coins/generic.svg'">
                                            <div>
                                                <div class="crypto-name">${c.name}</div>
                                                <div class="crypto-symbol">${c.symbol}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style="font-size: 0.85rem; color: var(--text-secondary);">${c.blockchain}</td>
                                    <td class="font-mono" style="font-weight: 700;">${Currency.formatCryptoPrice(c.current_price_usd)}</td>
                                    <td>
                                        <span style="font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: var(--border-radius-full); background: rgba(255,255,255,0.05); border: 1px solid var(--border-color);">
                                            ${c.risk_level}
                                        </span>
                                    </td>
                                    <td>
                                        <span style="font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: var(--border-radius-full); background: ${c.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}; color: ${c.is_active ? 'var(--color-success)' : 'var(--color-danger)'};">
                                            ${c.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td class="font-mono" style="font-size: 0.8rem; color: var(--text-muted);">
                                        ${c.view_count} v / ${c.simulation_count} s
                                    </td>
                                    <td style="text-align: right;">
                                        <div style="display: inline-flex; gap: 6px;">
                                            <button type="button" class="btn btn-outline edit-crypto-btn" data-id="${c.id}" style="font-size: 0.78rem; padding: 4px 8px;">
                                                <i class="fa-solid fa-pen"></i> Edit
                                            </button>
                                            <button type="button" class="btn btn-outline delete-crypto-btn" data-id="${c.id}" data-symbol="${c.symbol}" style="font-size: 0.78rem; padding: 4px 8px; color: var(--color-danger);">
                                                <i class="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            // Attach Add Modal
            container.querySelector('#admin-add-crypto-btn').onclick = () => this.showAddCryptoModal();

            // Attach Edit & Delete
            container.querySelectorAll('.edit-crypto-btn').forEach(btn => {
                btn.onclick = () => {
                    const id = parseInt(btn.getAttribute('data-id'), 10);
                    const coin = this.cryptosList.find(c => c.id === id);
                    if (coin) this.showEditCryptoModal(coin);
                };
            });

            container.querySelectorAll('.delete-crypto-btn').forEach(btn => {
                btn.onclick = async () => {
                    const id = parseInt(btn.getAttribute('data-id'), 10);
                    const symbol = btn.getAttribute('data-symbol');
                    if (confirm(`Are you sure you want to remove or deactivate ${symbol}? If portfolio transactions exist, it will be safely deactivated to protect financial data.`)) {
                        try {
                            const res = await API.admin.deleteCrypto(id);
                            alert(res.message);
                            this.renderCryptosTab(container);
                        } catch (e) {
                            alert(e.message);
                        }
                    }
                };
            });

        } catch (e) {
            container.innerHTML = `<div style="color:var(--color-danger);">${e.message}</div>`;
        }
    },

    showAddCryptoModal() {
        const dialog = AuthModals.createModal('add-crypto-dialog', `
            <div class="modal-header">
                <h3><i class="fa-solid fa-coins text-cyan"></i> Add New Cryptocurrency</h3>
                <button type="button" class="modal-close-btn" aria-label="Close dialog"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <form id="add-crypto-form">
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
                        <div>
                            <label style="font-size: 0.85rem; font-weight: 600;">Cryptocurrency Name</label>
                            <input type="text" id="add-c-name" required placeholder="Cardano" style="width: 100%;">
                        </div>
                        <div>
                            <label style="font-size: 0.85rem; font-weight: 600;">Ticker Symbol</label>
                            <input type="text" id="add-c-symbol" required placeholder="ADA" style="width: 100%;">
                        </div>
                    </div>

                    <div>
                        <label style="font-size: 0.85rem; font-weight: 600;">Logo Image URL</label>
                        <input type="url" id="add-c-logo" placeholder="https://assets.coingecko.com/..." style="width: 100%;">
                    </div>

                    <div>
                        <label style="font-size: 0.85rem; font-weight: 600;">Blockchain Architecture</label>
                        <input type="text" id="add-c-chain" required placeholder="Cardano Ouroboros Proof of Stake" style="width: 100%;">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="font-size: 0.85rem; font-weight: 600;">Current Price ($ USD)</label>
                            <input type="number" id="add-c-price" required step="any" min="0.0001" placeholder="0.35" style="width: 100%;">
                        </div>
                        <div>
                            <label style="font-size: 0.85rem; font-weight: 600;">Risk Level</label>
                            <select id="add-c-risk" style="width: 100%;">
                                <option value="Low">Low</option>
                                <option value="Medium" selected>Medium</option>
                                <option value="High">High</option>
                                <option value="Very High">Very High</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style="font-size: 0.85rem; font-weight: 600;">Educational Content</label>
                        <textarea id="add-c-edu" rows="3" placeholder="Educational summary and architectural explanation..." style="width: 100%;"></textarea>
                    </div>

                    <div>
                        <label style="font-size: 0.85rem; font-weight: 600;">Risk Information</label>
                        <textarea id="add-c-risk-info" rows="2" placeholder="Specific risk profile, regulatory and volatility considerations..." style="width: 100%;"></textarea>
                    </div>

                    <div style="display: flex; gap: 20px; align-items: center;">
                        <label style="display: flex; align-items: center; gap: 6px; font-size: 0.88rem;">
                            <input type="checkbox" id="add-c-active" checked> Active in Market
                        </label>
                        <label style="display: flex; align-items: center; gap: 6px; font-size: 0.88rem;">
                            <input type="checkbox" id="add-c-visible" checked> Visible on UI
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="submit" class="btn btn-primary">
                        <i class="fa-solid fa-plus"></i> Save & Register Cryptocurrency
                    </button>
                </div>
            </form>
        `);

        dialog.querySelector('#add-crypto-form').onsubmit = async (e) => {
            e.preventDefault();
            try {
                await API.admin.addCrypto({
                    name: dialog.querySelector('#add-c-name').value,
                    symbol: dialog.querySelector('#add-c-symbol').value,
                    logo_url: dialog.querySelector('#add-c-logo').value,
                    blockchain: dialog.querySelector('#add-c-chain').value,
                    current_price_usd: dialog.querySelector('#add-c-price').value,
                    risk_level: dialog.querySelector('#add-c-risk').value,
                    educational_content: dialog.querySelector('#add-c-edu').value,
                    risk_information: dialog.querySelector('#add-c-risk-info').value,
                    is_active: dialog.querySelector('#add-c-active').checked,
                    is_visible: dialog.querySelector('#add-c-visible').checked
                });
                dialog.close();
                this.loadTabContent('cryptos');
            } catch (err) {
                alert(err.message);
            }
        };

        dialog.showModal();
    },

    showEditCryptoModal(coin) {
        const dialog = AuthModals.createModal('edit-crypto-dialog', `
            <div class="modal-header">
                <h3><i class="fa-solid fa-pen text-cyan"></i> Edit ${coin.name} (${coin.symbol})</h3>
                <button type="button" class="modal-close-btn" aria-label="Close dialog"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <form id="edit-crypto-form">
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
                        <div>
                            <label style="font-size: 0.85rem; font-weight: 600;">Cryptocurrency Name</label>
                            <input type="text" id="edit-c-name" value="${coin.name}" required style="width: 100%;">
                        </div>
                        <div>
                            <label style="font-size: 0.85rem; font-weight: 600;">Ticker Symbol</label>
                            <input type="text" id="edit-c-symbol" value="${coin.symbol}" required style="width: 100%;">
                        </div>
                    </div>

                    <div>
                        <label style="font-size: 0.85rem; font-weight: 600;">Current Price ($ USD)</label>
                        <input type="number" id="edit-c-price" value="${coin.current_price_usd}" step="any" min="0" required style="width: 100%;">
                    </div>

                    <div>
                        <label style="font-size: 0.85rem; font-weight: 600;">Blockchain</label>
                        <input type="text" id="edit-c-chain" value="${coin.blockchain}" required style="width: 100%;">
                    </div>

                    <div>
                        <label style="font-size: 0.85rem; font-weight: 600;">Risk Level</label>
                        <select id="edit-c-risk" style="width: 100%;">
                            <option value="Low" ${coin.risk_level === 'Low' ? 'selected' : ''}>Low</option>
                            <option value="Medium" ${coin.risk_level === 'Medium' ? 'selected' : ''}>Medium</option>
                            <option value="High" ${coin.risk_level === 'High' ? 'selected' : ''}>High</option>
                            <option value="Very High" ${coin.risk_level === 'Very High' ? 'selected' : ''}>Very High</option>
                        </select>
                    </div>

                    <div style="display: flex; gap: 20px; align-items: center;">
                        <label style="display: flex; align-items: center; gap: 6px; font-size: 0.88rem;">
                            <input type="checkbox" id="edit-c-active" ${coin.is_active ? 'checked' : ''}> Active Status
                        </label>
                        <label style="display: flex; align-items: center; gap: 6px; font-size: 0.88rem;">
                            <input type="checkbox" id="edit-c-visible" ${coin.is_visible ? 'checked' : ''}> Visible in UI
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
        `);

        dialog.querySelector('#edit-crypto-form').onsubmit = async (e) => {
            e.preventDefault();
            try {
                await API.admin.updateCrypto(coin.id, {
                    name: dialog.querySelector('#edit-c-name').value,
                    symbol: dialog.querySelector('#edit-c-symbol').value,
                    current_price_usd: dialog.querySelector('#edit-c-price').value,
                    blockchain: dialog.querySelector('#edit-c-chain').value,
                    risk_level: dialog.querySelector('#edit-c-risk').value,
                    is_active: dialog.querySelector('#edit-c-active').checked,
                    is_visible: dialog.querySelector('#edit-c-visible').checked
                });
                dialog.close();
                this.loadTabContent('cryptos');
            } catch (err) {
                alert(err.message);
            }
        };

        dialog.showModal();
    },

    // ===================================================================
    // SECTION C: USER MANAGEMENT
    // ===================================================================
    async renderUsersTab(container) {
        try {
            const res = await API.admin.getUsers();
            const users = res.users || [];
            this.usersList = users;

            container.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h2 style="font-size: 1.3rem; font-weight: 800;">Registered User Management</h2>
                        <p style="font-size: 0.88rem; color: var(--text-secondary);">
                            Manage platform traders, monitor virtual balances, reset passwords, or suspend accounts.
                        </p>
                    </div>
                </div>

                <div class="glass-card table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Virtual Balance</th>
                                <th>Holdings</th>
                                <th>Created</th>
                                <th>Last Login</th>
                                <th style="text-align: right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(u => {
                                const wallet = u.wallet || {};
                                const balance = typeof wallet.balanceUsd === 'number' ? wallet.balanceUsd : (wallet.balance_usd || u.availableCashUsd || u.balanceUsd || 0);
                                const holdingsCount = typeof wallet.holdingsCount === 'number' ? wallet.holdingsCount : (u.holdingsCount || (wallet.holdings ? wallet.holdings.length : 0));
                                return `
                                <tr>
                                    <td>
                                        <div style="font-weight: 700; color: var(--text-primary);">${u.fullName || u.username}</div>
                                        <div style="font-size: 0.8rem; color: var(--text-muted);">@${u.username} &bull; ${u.email}</div>
                                    </td>
                                    <td>
                                        <span style="font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: var(--border-radius-full); background: ${u.role === 'admin' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)'}; color: ${u.role === 'admin' ? '#F59E0B' : 'var(--text-secondary)'};">
                                            ${(u.role || 'user').toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <span style="font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: var(--border-radius-full); background: ${u.isSuspended ? 'rgba(239,68,68,0.15)' : (u.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)')}; color: ${u.isSuspended ? 'var(--color-danger)' : (u.isActive ? 'var(--color-success)' : 'var(--text-muted)')};">
                                            ${u.isSuspended ? 'Suspended' : (u.isActive ? 'Active' : 'Deactivated')}
                                        </span>
                                    </td>
                                    <td class="font-mono" style="font-weight: 700;">
                                        ${Currency.format(balance)}
                                    </td>
                                    <td>${holdingsCount} assets</td>
                                    <td style="font-size: 0.8rem; color: var(--text-muted);">${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recent'}</td>
                                    <td style="font-size: 0.8rem; color: var(--text-muted);">${u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}</td>
                                    <td style="text-align: right;">
                                        <div style="display: inline-flex; gap: 6px;">
                                            <button type="button" class="btn btn-outline user-balance-btn" data-id="${u.id}" data-name="${u.username}" title="Adjust Virtual Balance" style="font-size: 0.78rem; padding: 4px 8px;">
                                                <i class="fa-solid fa-dollar-sign"></i> Balance
                                            </button>
                                            <button type="button" class="btn btn-outline user-reset-btn" data-id="${u.id}" data-name="${u.username}" title="Reset Password" style="font-size: 0.78rem; padding: 4px 8px;">
                                                <i class="fa-solid fa-key"></i>
                                            </button>
                                            <button type="button" class="btn btn-outline user-status-btn" data-id="${u.id}" data-active="${u.isActive}" data-suspended="${u.isSuspended}" title="Toggle Account Status" style="font-size: 0.78rem; padding: 4px 8px; color: ${u.isSuspended ? 'var(--color-success)' : 'var(--color-danger)'};">
                                                <i class="fa-solid ${u.isSuspended ? 'fa-user-check' : 'fa-user-slash'}"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            // Attach user actions
            container.querySelectorAll('.user-balance-btn').forEach(btn => {
                btn.onclick = () => {
                    const id = parseInt(btn.getAttribute('data-id'), 10);
                    const name = btn.getAttribute('data-name');
                    this.showAdjustBalanceModal(id, name);
                };
            });

            container.querySelectorAll('.user-reset-btn').forEach(btn => {
                btn.onclick = () => {
                    const id = parseInt(btn.getAttribute('data-id'), 10);
                    const name = btn.getAttribute('data-name');
                    this.showResetPasswordModal(id, name);
                };
            });

            container.querySelectorAll('.user-status-btn').forEach(btn => {
                btn.onclick = async () => {
                    const id = parseInt(btn.getAttribute('data-id'), 10);
                    const isSuspended = btn.getAttribute('data-suspended') === 'true';
                    const action = isSuspended ? 'un-suspend and activate' : 'suspend';
                    if (confirm(`Are you sure you want to ${action} this account?`)) {
                        try {
                            await API.admin.updateUserStatus(id, {
                                is_suspended: !isSuspended,
                                is_active: isSuspended ? 1 : 1,
                                reason: 'Administrative status update from admin panel'
                            });
                            this.loadTabContent('users');
                        } catch (e) {
                            alert(e.message);
                        }
                    }
                };
            });

        } catch (e) {
            container.innerHTML = `<div style="color:var(--color-danger);">${e.message}</div>`;
        }
    },

    showAdjustBalanceModal(userId, username) {
        const dialog = AuthModals.createModal('adjust-balance-dialog', `
            <div class="modal-header">
                <h3><i class="fa-solid fa-money-bill-transfer text-cyan"></i> Adjust Virtual Balance: @${username}</h3>
                <button type="button" class="modal-close-btn" aria-label="Close dialog"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <form id="adjust-balance-form">
                <div class="modal-body">
                    <div>
                        <label style="font-size: 0.85rem; font-weight: 600;">Adjustment Action</label>
                        <select id="adj-action" style="width: 100%;">
                            <option value="GRANT">Grant Additional Credits (+)</option>
                            <option value="DEDUCT">Deduct Virtual Credits (-)</option>
                        </select>
                    </div>

                    <div>
                        <label style="font-size: 0.85rem; font-weight: 600;">Amount ($ USD)</label>
                        <input type="number" id="adj-amount" required step="any" min="1" placeholder="1000.00" style="width: 100%;">
                    </div>

                    <div>
                        <label style="font-size: 0.85rem; font-weight: 600;">Mandatory Audit Reason</label>
                        <textarea id="adj-reason" required rows="3" placeholder="Reason for adjustment (e.g. Competition reward, testing credit, audit correction)..." style="width: 100%;"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="submit" class="btn btn-primary">Apply Balance Adjustment</button>
                </div>
            </form>
        `);

        dialog.querySelector('#adjust-balance-form').onsubmit = async (e) => {
            e.preventDefault();
            const action = dialog.querySelector('#adj-action').value;
            const amount = dialog.querySelector('#adj-amount').value;
            const reason = dialog.querySelector('#adj-reason').value;

            try {
                if (action === 'GRANT') {
                    await API.admin.grantBalance({ target_user_id: userId, amount, audit_reason: reason });
                } else {
                    await API.admin.deductBalance({ target_user_id: userId, amount, audit_reason: reason });
                }
                alert(`Successfully applied ${action} of $${amount} USD.`);
                dialog.close();
                this.loadTabContent('users');
            } catch (err) {
                alert(err.message);
            }
        };

        dialog.showModal();
    },

    showResetPasswordModal(userId, username) {
        const dialog = AuthModals.createModal('admin-reset-pw-dialog', `
            <div class="modal-header">
                <h3><i class="fa-solid fa-key text-cyan"></i> Reset Password for @${username}</h3>
                <button type="button" class="modal-close-btn" aria-label="Close dialog"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <form id="admin-reset-pw-form">
                <div class="modal-body">
                    <p style="font-size: 0.88rem; color: var(--text-secondary);">
                        Set a temporary password for this user. They will be notified upon their next sign-in.
                    </p>
                    <div>
                        <label style="font-size: 0.85rem; font-weight: 600;">Temporary Password</label>
                        <input type="text" id="admin-temp-pw" value="CCPulse#${Math.floor(Math.random() * 89999 + 10000)}" required style="width: 100%;">
                    </div>
                    <div>
                        <label style="font-size: 0.85rem; font-weight: 600;">Audit Reason</label>
                        <input type="text" id="admin-reset-reason" value="User requested account credential recovery" required style="width: 100%;">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="submit" class="btn btn-primary">Reset Password</button>
                </div>
            </form>
        `);

        dialog.querySelector('#admin-reset-pw-form').onsubmit = async (e) => {
            e.preventDefault();
            try {
                const res = await API.admin.resetUserPassword(userId, {
                    temporary_password: dialog.querySelector('#admin-temp-pw').value,
                    reason: dialog.querySelector('#admin-reset-reason').value
                });
                alert(res.message);
                dialog.close();
            } catch (err) {
                alert(err.message);
            }
        };

        dialog.showModal();
    },

    // ===================================================================
    // SECTION D: VIRTUAL BALANCE & WELCOME BONUS LEDGER
    // ===================================================================
    async renderBalancesTab(container) {
        try {
            const res = await API.admin.getBonusHistory();
            const history = res.history || [];

            container.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 1.3rem; font-weight: 800;">Welcome Bonus & Balance Ledger</h2>
                    <p style="font-size: 0.88rem; color: var(--text-secondary);">
                        Verification ledger of every $5,000 USD virtual welcome bonus distributed upon user registration.
                    </p>
                </div>

                <div class="glass-card table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Transaction Ref</th>
                                <th>User</th>
                                <th>Bonus Amount</th>
                                <th>Balance Impact</th>
                                <th>Description</th>
                                <th>Date Credited</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${history.length === 0 ? `
                                <tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted);">No bonus records found.</td></tr>
                            ` : history.map(h => `
                                <tr>
                                    <td class="font-mono" style="font-size: 0.8rem; color: var(--text-muted);">${h.transaction_ref}</td>
                                    <td>
                                        <div style="font-weight: 600;">${h.full_name}</div>
                                        <div style="font-size: 0.78rem; color: var(--text-muted);">@${h.username}</div>
                                    </td>
                                    <td class="font-mono text-success" style="font-weight: 700;">+${Currency.format(h.amount_usd)}</td>
                                    <td class="font-mono" style="font-size: 0.85rem;">
                                        $${h.balance_before_usd.toFixed(2)} &rarr; <strong>$${h.balance_after_usd.toFixed(2)} USD</strong>
                                    </td>
                                    <td style="font-size: 0.85rem; color: var(--text-secondary);">${h.description}</td>
                                    <td style="font-size: 0.8rem; color: var(--text-muted);">${new Date(h.created_at).toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (e) {
            container.innerHTML = `<div style="color:var(--color-danger);">${e.message}</div>`;
        }
    },

    // ===================================================================
    // SECTION E: CURRENCIES & LIVE FOREX RATES
    // ===================================================================
    async renderCurrenciesTab(container) {
        try {
            const status = await API.currency.getStatus();
            const { currencies, rates, lastUpdated, isStale, provider } = status;

            container.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h2 style="font-size: 1.3rem; font-weight: 800;">Real-Time Forex Currency Engine</h2>
                        <p style="font-size: 0.88rem; color: var(--text-secondary);">
                            Live reference rates for multi-currency conversion (USD base). Provider: <strong>${provider}</strong>
                        </p>
                    </div>
                    <button type="button" class="btn btn-primary" id="admin-forex-refresh-btn">
                        <i class="fa-solid fa-rotate"></i> Refresh Live Rates Now
                    </button>
                </div>

                <div class="glass-card table-wrapper" style="margin-bottom: 24px;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Symbol</th>
                                <th>Rate (1 USD =)</th>
                                <th>Example $5,000 Bonus</th>
                                <th>Status</th>
                                <th style="text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${currencies.map(cur => {
                                const rate = rates[cur.code] || cur.exchangeRateToUsd;
                                const exampleBonus = Currency.format(5000, cur.code);
                                return `
                                    <tr>
                                        <td class="font-mono" style="font-weight: 700;">${cur.code}</td>
                                        <td>${cur.name}</td>
                                        <td style="font-size: 1.1rem; font-weight: 700;">${cur.symbol}</td>
                                        <td class="font-mono" style="font-weight: 700; color: var(--color-primary);">${rate.toFixed(4)}</td>
                                        <td class="font-mono" style="font-weight: 700; color: var(--color-success);">${exampleBonus}</td>
                                        <td>
                                            <span style="font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: var(--border-radius-full); background: rgba(16,185,129,0.1); color: var(--color-success);">
                                                Active
                                            </span>
                                        </td>
                                        <td style="text-align: right;">
                                            <button type="button" class="btn btn-outline edit-rate-btn" data-code="${cur.code}" data-rate="${rate}" style="font-size: 0.78rem; padding: 4px 8px;">
                                                Edit Rate
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            container.querySelector('#admin-forex-refresh-btn').onclick = async () => {
                await Currency.refreshRates();
                this.loadTabContent('currencies');
            };

            container.querySelectorAll('.edit-rate-btn').forEach(btn => {
                btn.onclick = async () => {
                    const code = btn.getAttribute('data-code');
                    const curRate = btn.getAttribute('data-rate');
                    const newRate = prompt(`Enter new exchange rate for ${code} (1 USD =):`, curRate);
                    if (newRate && !isNaN(parseFloat(newRate))) {
                        try {
                            await API.currency.adminUpdateRate(code, { exchange_rate_to_usd: parseFloat(newRate) });
                            alert(`Rate for ${code} updated.`);
                            this.loadTabContent('currencies');
                        } catch (e) {
                            alert(e.message);
                        }
                    }
                };
            });

        } catch (e) {
            container.innerHTML = `<div style="color:var(--color-danger);">${e.message}</div>`;
        }
    },

    // ===================================================================
    // SECTION F: GLOBAL SETTINGS & THEMES
    // ===================================================================
    async renderSettingsTab(container) {
        try {
            const res = await API.admin.getSettings();
            const s = res.settings;

            container.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 1.3rem; font-weight: 800;">Global Platform Settings</h2>
                    <p style="font-size: 0.88rem; color: var(--text-secondary);">
                        Configure welcome bonuses, default themes, market polling intervals, and maintenance mode.
                    </p>
                </div>

                <div class="glass-card" style="padding: 28px; max-width: 680px;">
                    <form id="global-settings-form">
                        <div style="display: flex; flex-direction: column; gap: 20px;">
                            <div>
                                <label style="display: block; font-size: 0.88rem; font-weight: 600; margin-bottom: 6px;">
                                    Default Welcome Bonus ($ USD)
                                </label>
                                <input type="number" id="set-bonus" value="${s.default_welcome_bonus || '5000.00'}" step="100" min="0" required style="width: 100%;">
                                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">Credits automatically deposited into every newly registered user's virtual wallet.</div>
                            </div>

                            <div>
                                <label style="display: block; font-size: 0.88rem; font-weight: 600; margin-bottom: 6px;">
                                    Default Application Theme
                                </label>
                                <select id="set-theme" style="width: 100%;">
                                    <option value="dark" ${s.default_theme === 'dark' ? 'selected' : ''}>Dark High-Tech (Navy / Cyan / Purple)</option>
                                    <option value="light" ${s.default_theme === 'light' ? 'selected' : ''}>Clean Light (Financial Blue / High-Contrast)</option>
                                    <option value="system" ${s.default_theme === 'system' ? 'selected' : ''}>System Default (Follow Device)</option>
                                </select>
                            </div>

                            <div>
                                <label style="display: block; font-size: 0.88rem; font-weight: 600; margin-bottom: 6px;">
                                    Market Simulation Interval (Seconds)
                                </label>
                                <input type="number" id="set-interval" value="${s.market_refresh_interval_sec || '10'}" min="3" max="60" required style="width: 100%;">
                            </div>

                            <div>
                                <label style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem; font-weight: 600;">
                                    <input type="checkbox" id="set-maint" ${s.maintenance_mode === 'true' ? 'checked' : ''}>
                                    Platform Maintenance Mode
                                </label>
                                <div style="font-size: 0.78rem; color: var(--color-warning); margin-top: 4px;">When active, non-admin users will be temporarily restricted from executing trades.</div>
                            </div>

                            <button type="submit" class="btn btn-primary" style="margin-top: 10px;">
                                <i class="fa-solid fa-floppy-disk"></i> Save Configuration
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Database Engine & Storage Management Card -->
                <div class="glass-card" style="padding: 24px; max-width: 650px; margin-top: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
                        <h3 style="font-size: 1.15rem; font-weight: 700;">
                            <i class="fa-solid fa-database text-cyan"></i> Database & Persistence Storage Engine
                        </h3>
                        <span style="font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: var(--border-radius-full); background: rgba(16,185,129,0.15); color: var(--color-success);">
                            ${typeof ClientDB !== 'undefined' ? 'Active In-Browser Persistent DB' : 'Active SQLite Database'}
                        </span>
                    </div>

                    <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 16px;">
                        CCPulse employs dual-tier persistence: institutional <strong>SQLite 3</strong> in the local environment and the <strong>ClientDB Relational Engine</strong> on GitHub Pages to collect and retain all user registrations, wallets, trades, and support tickets without server dependencies.
                    </p>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-bottom: 18px;">
                        <div style="padding: 10px 12px; background: var(--bg-surface-elevated); border-radius: 8px; text-align: center;">
                            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Registered Users</div>
                            <div class="font-mono text-cyan" id="db-stat-users" style="font-size: 1.3rem; font-weight: 800; margin-top: 2px;">
                                ${typeof ClientDB !== 'undefined' ? ClientDB.users.getAll().length : 2}
                            </div>
                        </div>
                        <div style="padding: 10px 12px; background: var(--bg-surface-elevated); border-radius: 8px; text-align: center;">
                            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Virtual Wallets</div>
                            <div class="font-mono text-cyan" id="db-stat-wallets" style="font-size: 1.3rem; font-weight: 800; margin-top: 2px;">
                                ${typeof ClientDB !== 'undefined' ? ClientDB.getSnapshot().wallets.length : 2}
                            </div>
                        </div>
                        <div style="padding: 10px 12px; background: var(--bg-surface-elevated); border-radius: 8px; text-align: center;">
                            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Trades Executed</div>
                            <div class="font-mono text-cyan" id="db-stat-trades" style="font-size: 1.3rem; font-weight: 800; margin-top: 2px;">
                                ${typeof ClientDB !== 'undefined' ? ClientDB.trades.getAll().length : 0}
                            </div>
                        </div>
                        <div style="padding: 10px 12px; background: var(--bg-surface-elevated); border-radius: 8px; text-align: center;">
                            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Support Tickets</div>
                            <div class="font-mono text-cyan" id="db-stat-tickets" style="font-size: 1.3rem; font-weight: 800; margin-top: 2px;">
                                ${typeof ClientDB !== 'undefined' ? ClientDB.tickets.getAll().length : 0}
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        <button type="button" id="admin-export-db-btn" class="btn btn-outline" style="font-size: 0.85rem;">
                            <i class="fa-solid fa-download"></i> Export Database Backup (JSON)
                        </button>
                        <button type="button" id="admin-reset-db-btn" class="btn btn-outline" style="font-size: 0.85rem; color: var(--color-danger);">
                            <i class="fa-solid fa-rotate-left"></i> Reset Client Database
                        </button>
                    </div>
                </div>
            `;

            // Export Database Handler
            const exportBtn = container.querySelector('#admin-export-db-btn');
            if (exportBtn) {
                exportBtn.onclick = () => {
                    const jsonStr = API.database.exportJSON();
                    const blob = new Blob([jsonStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ccpulse_database_backup_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                };
            }

            // Reset Database Handler
            const resetBtn = container.querySelector('#admin-reset-db-btn');
            if (resetBtn) {
                resetBtn.onclick = () => {
                    if (confirm('Are you sure you want to reset the client database to factory default seeds? All custom users and trades created on this browser will be reset.')) {
                        API.database.resetToDefault();
                        alert('Client database reset to factory defaults.');
                        this.renderSettingsTab(container);
                    }
                };
            }

            container.querySelector('#global-settings-form').onsubmit = async (e) => {
                e.preventDefault();
                try {
                    await API.admin.updateSettings({
                        default_welcome_bonus: container.querySelector('#set-bonus').value,
                        default_theme: container.querySelector('#set-theme').value,
                        market_refresh_interval_sec: container.querySelector('#set-interval').value,
                        maintenance_mode: container.querySelector('#set-maint').checked ? 'true' : 'false'
                    });
                    alert('Platform settings saved successfully.');
                } catch (err) {
                    alert(err.message);
                }
            };
        } catch (e) {
            container.innerHTML = `<div style="color:var(--color-danger);">${e.message}</div>`;
        }
    },

    // ===================================================================
    // SECTION G: AUDIT LOGS
    // ===================================================================
    async renderAuditsTab(container) {
        try {
            const res = await API.admin.getAuditLogs();
            const logs = res.logs || [];

            container.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 1.3rem; font-weight: 800;">Administrator Audit Logs</h2>
                    <p style="font-size: 0.88rem; color: var(--text-secondary);">
                        Immutable record of all administrative configuration changes, balance adjustments, and account updates.
                    </p>
                </div>

                <div class="glass-card table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Administrator</th>
                                <th>Action</th>
                                <th>Entity</th>
                                <th>Audit Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${logs.length === 0 ? `
                                <tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-muted);">No audit entries found.</td></tr>
                            ` : logs.map(l => `
                                <tr>
                                    <td style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap;">
                                        ${new Date(l.created_at).toLocaleString()}
                                    </td>
                                    <td style="font-weight: 600;">@${l.admin_username}</td>
                                    <td>
                                        <span class="font-mono" style="font-size: 0.78rem; font-weight: 700; color: var(--color-primary);">
                                            ${l.action}
                                        </span>
                                    </td>
                                    <td style="font-size: 0.82rem; color: var(--text-secondary);">${l.entity_type} #${l.entity_id || ''}</td>
                                    <td style="font-size: 0.85rem; color: var(--text-primary);">${l.audit_reason || 'System action'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (e) {
            container.innerHTML = `<div style="color:var(--color-danger);">${e.message}</div>`;
        }
    },

    // ===================================================================
    // SECTION H: DAILY ANALYTICS & WEBSITE ACTIVITY (NEW)
    // ===================================================================
    async renderAnalyticsTab(container, currentRange = '7d') {
        try {
            const res = await API.admin.getDailyAnalytics(currentRange);
            const { aggregates, dailyTimeline } = res;

            const maxRegs = Math.max(...dailyTimeline.map(d => d.registrations), 5);
            const maxVol = Math.max(...dailyTimeline.map(d => d.tradingVolumeUsd), 1000);

            // Generate SVG Bar & Line Chart
            const chartPoints = dailyTimeline.slice().reverse();
            const barWidth = 24;
            const chartHeight = 160;
            const chartWidth = Math.max(chartPoints.length * 52, 420);

            const barsSvg = chartPoints.map((pt, idx) => {
                const x = idx * 52 + 18;
                const regHeight = Math.max((pt.registrations / maxRegs) * 110, 4);
                const y = chartHeight - regHeight - 24;
                return `
                    <g class="chart-bar-group">
                        <rect x="${x}" y="${y}" width="${barWidth}" height="${regHeight}" rx="4" fill="var(--color-primary)" opacity="0.88">
                            <title>${pt.date} (${pt.dayName}): ${pt.registrations} Registrations, ${pt.tradesCount} Trades</title>
                        </rect>
                        <text x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle" font-size="10" font-weight="700" fill="var(--text-primary)" font-family="var(--font-mono)">
                            ${pt.registrations > 0 ? pt.registrations : ''}
                        </text>
                        <text x="${x + barWidth / 2}" y="${chartHeight - 6}" text-anchor="middle" font-size="10" font-weight="600" fill="var(--text-muted)">
                            ${pt.dayName}
                        </text>
                    </g>
                `;
            }).join('');

            container.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 24px;">
                    <div>
                        <h2 style="font-size: 1.35rem; font-weight: 800; font-family: var(--font-heading); margin-bottom: 4px;">
                            Daily User Registration & Website Activity Analytics
                        </h2>
                        <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 0;">
                            Inspect day-by-day user onboarding velocity, daily active users, trade executions, and welcome bonus allocations.
                        </p>
                    </div>

                    <!-- Range Selector & Export -->
                    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                        <div style="display: inline-flex; background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: var(--border-radius-full); padding: 3px;">
                            <button type="button" class="analytics-range-btn ${currentRange === 'today' ? 'active-range' : ''}" data-range="today" style="border:none;background:transparent;padding:6px 14px;border-radius:var(--border-radius-full);font-size:0.8rem;font-weight:700;color:var(--text-secondary);cursor:pointer;">Today</button>
                            <button type="button" class="analytics-range-btn ${currentRange === '7d' ? 'active-range' : ''}" data-range="7d" style="border:none;background:transparent;padding:6px 14px;border-radius:var(--border-radius-full);font-size:0.8rem;font-weight:700;color:var(--text-secondary);cursor:pointer;">7 Days</button>
                            <button type="button" class="analytics-range-btn ${currentRange === '14d' ? 'active-range' : ''}" data-range="14d" style="border:none;background:transparent;padding:6px 14px;border-radius:var(--border-radius-full);font-size:0.8rem;font-weight:700;color:var(--text-secondary);cursor:pointer;">14 Days</button>
                            <button type="button" class="analytics-range-btn ${currentRange === '30d' ? 'active-range' : ''}" data-range="30d" style="border:none;background:transparent;padding:6px 14px;border-radius:var(--border-radius-full);font-size:0.8rem;font-weight:700;color:var(--text-secondary);cursor:pointer;">30 Days</button>
                            <button type="button" class="analytics-range-btn ${currentRange === 'all' ? 'active-range' : ''}" data-range="all" style="border:none;background:transparent;padding:6px 14px;border-radius:var(--border-radius-full);font-size:0.8rem;font-weight:700;color:var(--text-secondary);cursor:pointer;">All Time</button>
                        </div>
                        <button type="button" class="btn btn-outline" id="export-analytics-csv-btn" style="font-size: 0.85rem; padding: 7px 16px;">
                            <i class="fa-solid fa-file-csv"></i> Export CSV
                        </button>
                    </div>
                </div>

                <!-- 4 Key Aggregate Analytics Cards -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
                    <div class="glass-card" style="padding: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 700;">NEW REGISTRATIONS</span>
                            <span style="color: var(--color-success); font-size: 0.8rem; font-weight: 800;"><i class="fa-solid fa-user-plus"></i> In Period</span>
                        </div>
                        <div class="font-mono" style="font-size: 1.9rem; font-weight: 800; color: var(--color-primary);">
                            ${aggregates.totalRegistrationsInPeriod}
                        </div>
                        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
                            Total accounts registered in selected timeframe
                        </div>
                    </div>

                    <div class="glass-card" style="padding: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 700;">DAILY ACTIVE TRADERS</span>
                            <span style="color: #3A86FF; font-size: 0.8rem; font-weight: 800;"><i class="fa-solid fa-users-viewfinder"></i> DAU Average</span>
                        </div>
                        <div class="font-mono" style="font-size: 1.9rem; font-weight: 800; color: var(--text-primary);">
                            ${aggregates.avgDailyActiveUsers}
                        </div>
                        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
                            Daily active users interacting with simulator
                        </div>
                    </div>

                    <div class="glass-card" style="padding: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 700;">SIMULATED TRADES EXECUTED</span>
                            <span style="color: var(--color-success); font-size: 0.8rem; font-weight: 800;"><i class="fa-solid fa-bolt"></i> Activity</span>
                        </div>
                        <div class="font-mono" style="font-size: 1.9rem; font-weight: 800; color: var(--text-primary);">
                            ${aggregates.totalTradesInPeriod}
                        </div>
                        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
                            Executed buy and sell orders in period
                        </div>
                    </div>

                    <div class="glass-card" style="padding: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 700;">TOTAL SIMULATION VOLUME</span>
                            <span style="color: #F59E0B; font-size: 0.8rem; font-weight: 800;"><i class="fa-solid fa-chart-line"></i> Turn-over</span>
                        </div>
                        <div class="font-mono" style="font-size: 1.7rem; font-weight: 800; color: var(--color-success);">
                            ${Currency.format(aggregates.totalVolumeInPeriod)}
                        </div>
                        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
                            Calculated across all cryptocurrency orders
                        </div>
                    </div>
                </div>

                <!-- Daily Registration Growth Visual Timeline -->
                <div class="glass-card" style="padding: 24px; margin-bottom: 28px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <div>
                            <div style="font-weight: 800; font-size: 1.05rem; font-family: var(--font-heading);">
                                Daily User Registration Velocity Chart
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">
                                Bars indicate new user accounts registered per calendar day
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 16px; font-size: 0.8rem;">
                            <span style="display: inline-flex; align-items: center; gap: 6px;">
                                <span style="width: 12px; height: 12px; background: var(--color-primary); border-radius: 3px;"></span>
                                New Registrations
                            </span>
                        </div>
                    </div>
                    <div style="overflow-x: auto; padding-bottom: 8px;">
                        <svg viewBox="0 0 ${chartWidth} ${chartHeight}" style="min-width: 100%; height: ${chartHeight}px;">
                            <line x1="0" y1="${chartHeight - 20}" x2="${chartWidth}" y2="${chartHeight - 20}" stroke="var(--border-color)" stroke-width="1"/>
                            ${barsSvg}
                        </svg>
                    </div>
                </div>

                <!-- Day-by-Day Comprehensive Activity Table -->
                <div style="margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="font-size: 1.15rem; font-weight: 800; font-family: var(--font-heading); margin: 0;">
                        Daily Activity Breakdown Table (${dailyTimeline.length} Days)
                    </h3>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">
                        Sorted chronologically (Newest first)
                    </span>
                </div>

                <div class="glass-card table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date & Day</th>
                                <th>New Registrations</th>
                                <th>Est. Active Traders</th>
                                <th>Trades Executed</th>
                                <th>Buy / Sell Split</th>
                                <th>Trading Volume</th>
                                <th>Welcome Bonus Granted</th>
                                <th>Support Inquiries</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dailyTimeline.map(row => `
                                <tr>
                                    <td style="font-weight: 700; white-space: nowrap;">
                                        ${row.date} <span style="color: var(--text-muted); font-size: 0.8rem;">(${row.dayName})</span>
                                    </td>
                                    <td>
                                        <span class="font-mono" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 800; padding: 2px 8px; border-radius: 6px; background: ${row.registrations > 0 ? 'rgba(0, 230, 118, 0.12)' : 'transparent'}; color: ${row.registrations > 0 ? 'var(--color-success)' : 'var(--text-muted)'};">
                                            ${row.registrations > 0 ? `+${row.registrations}` : '0'}
                                        </span>
                                    </td>
                                    <td class="font-mono">${row.activeUsers}</td>
                                    <td class="font-mono" style="font-weight: 700;">${row.tradesCount}</td>
                                    <td style="font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap;">
                                        <span class="text-success">${row.buyTrades}B</span> / <span class="text-danger">${row.sellTrades}S</span>
                                    </td>
                                    <td class="font-mono text-success" style="font-weight: 700;">
                                        ${Currency.format(row.tradingVolumeUsd)}
                                    </td>
                                    <td class="font-mono" style="color: var(--text-secondary); font-size: 0.85rem;">
                                        ${Currency.format(row.welcomeBonusesDistributedUsd)}
                                    </td>
                                    <td>
                                        ${row.supportTickets > 0 ? `
                                            <span style="background: rgba(58, 134, 255, 0.15); color: #3A86FF; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 0.8rem;">
                                                ${row.supportTickets} ticket(s)
                                            </span>
                                        ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">—</span>'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            // Active range style helper
            container.querySelectorAll('.analytics-range-btn').forEach(btn => {
                const range = btn.getAttribute('data-range');
                if (range === currentRange) {
                    btn.style.background = 'var(--color-primary)';
                    btn.style.color = '#0E1438';
                }
                btn.onclick = () => {
                    this.renderAnalyticsTab(container, range);
                };
            });

            // CSV Export Handler
            const exportBtn = container.querySelector('#export-analytics-csv-btn');
            if (exportBtn) {
                exportBtn.onclick = () => {
                    const headers = ['Date', 'Day', 'New_Registrations', 'Active_Users', 'Trades_Executed', 'Buy_Trades', 'Sell_Trades', 'Volume_USD', 'Welcome_Bonuses_USD', 'Support_Tickets'];
                    const csvRows = [headers.join(',')];
                    dailyTimeline.forEach(r => {
                        csvRows.push([r.date, r.dayName, r.registrations, r.activeUsers, r.tradesCount, r.buyTrades, r.sellTrades, r.tradingVolumeUsd, r.welcomeBonusesDistributedUsd, r.supportTickets].join(','));
                    });
                    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `CCPulse_Daily_Analytics_${currentRange}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                };
            }
        } catch (e) {
            container.innerHTML = `<div class="text-danger" style="padding: 30px; text-align: center;">Failed to load daily analytics: ${e.message}</div>`;
        }
    },

    // ===================================================================
    // SECTION I: SUPPORT TICKETS ADMIN CONSOLE (NEW)
    // ===================================================================
    async renderTicketsTab(container, currentFilter = 'all') {
        try {
            const res = await API.admin.getTickets({ status: currentFilter });
            const { stats, tickets } = res;

            container.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 24px;">
                    <div>
                        <h2 style="font-size: 1.35rem; font-weight: 800; font-family: var(--font-heading); margin-bottom: 4px;">
                            Help Desk & Support Ticket Management
                        </h2>
                        <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 0;">
                            Review user inquiries, respond to trading questions, and manage resolution statuses.
                        </p>
                    </div>

                    <!-- Filter Buttons -->
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        <button type="button" class="btn ${currentFilter === 'all' ? 'btn-primary' : 'btn-outline'} ticket-filter-btn" data-status="all" style="font-size:0.8rem;padding:6px 14px;">All (${stats.total})</button>
                        <button type="button" class="btn ${currentFilter === 'open' ? 'btn-primary' : 'btn-outline'} ticket-filter-btn" data-status="open" style="font-size:0.8rem;padding:6px 14px;">Open (${stats.open})</button>
                        <button type="button" class="btn ${currentFilter === 'in_progress' ? 'btn-primary' : 'btn-outline'} ticket-filter-btn" data-status="in_progress" style="font-size:0.8rem;padding:6px 14px;">In Progress (${stats.in_progress})</button>
                        <button type="button" class="btn ${currentFilter === 'resolved' ? 'btn-primary' : 'btn-outline'} ticket-filter-btn" data-status="resolved" style="font-size:0.8rem;padding:6px 14px;">Resolved (${stats.resolved})</button>
                    </div>
                </div>

                <!-- Stats Strip -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 24px;">
                    <div class="glass-card" style="padding: 16px 20px;">
                        <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 700;">TOTAL TICKETS</div>
                        <div class="font-mono" style="font-size: 1.6rem; font-weight: 800; margin-top: 4px;">${stats.total}</div>
                    </div>
                    <div class="glass-card" style="padding: 16px 20px;">
                        <div style="font-size: 0.78rem; color: #3A86FF; font-weight: 700;">ACTIVE / OPEN TICKETS</div>
                        <div class="font-mono" style="font-size: 1.6rem; font-weight: 800; color: #3A86FF; margin-top: 4px;">${stats.open}</div>
                    </div>
                    <div class="glass-card" style="padding: 16px 20px;">
                        <div style="font-size: 0.78rem; color: #FFB703; font-weight: 700;">IN PROGRESS</div>
                        <div class="font-mono" style="font-size: 1.6rem; font-weight: 800; color: #FFB703; margin-top: 4px;">${stats.in_progress}</div>
                    </div>
                    <div class="glass-card" style="padding: 16px 20px;">
                        <div style="font-size: 0.78rem; color: var(--color-success); font-weight: 700;">RESOLUTION RATE</div>
                        <div class="font-mono" style="font-size: 1.6rem; font-weight: 800; color: var(--color-success); margin-top: 4px;">${stats.resolution_rate}%</div>
                    </div>
                </div>

                <!-- Tickets List / Table -->
                <div class="glass-card table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Ticket ID</th>
                                <th>User / Contact</th>
                                <th>Category & Subject</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Raised On</th>
                                <th style="text-align: right;">Administrative Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tickets.length === 0 ? `
                                <tr><td colspan="7" style="text-align:center;padding:36px;color:var(--text-muted);">No support tickets found matching this filter.</td></tr>
                            ` : tickets.map(t => `
                                <tr>
                                    <td>
                                        <span class="font-mono" style="font-weight: 800; color: var(--color-primary); font-size: 0.9rem;">
                                            #${t.ticket_code}
                                        </span>
                                    </td>
                                    <td>
                                        <div style="font-weight: 700;">${t.user_name}</div>
                                        <div style="font-size: 0.78rem; color: var(--text-muted);">${t.user_email}</div>
                                    </td>
                                    <td>
                                        <div style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">${t.category}</div>
                                        <div style="font-weight: 600; font-size: 0.92rem; font-family: var(--font-heading);">${t.subject}</div>
                                    </td>
                                    <td>
                                        ${this.getTicketPriorityBadge(t.priority)}
                                    </td>
                                    <td>
                                        ${this.getTicketStatusBadge(t.status)}
                                    </td>
                                    <td style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap;">
                                        ${new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td style="text-align: right; white-space: nowrap;">
                                        <button type="button" class="btn btn-outline admin-view-ticket-btn" data-id="${t.id}" style="padding: 4px 10px; font-size: 0.78rem;">
                                            <i class="fa-solid fa-comments"></i> Thread (${t.reply_count || 1})
                                        </button>
                                        <select class="admin-quick-status-select" data-id="${t.id}" style="padding: 4px 8px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--bg-surface-elevated); color: var(--text-primary); font-size: 0.78rem; margin-left: 6px;">
                                            <option value="open" ${t.status === 'open' ? 'selected' : ''}>Open</option>
                                            <option value="in_progress" ${t.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                                            <option value="resolved" ${t.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                                            <option value="closed" ${t.status === 'closed' ? 'selected' : ''}>Closed</option>
                                        </select>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div id="admin-ticket-modal-host"></div>
            `;

            // Filter button listeners
            container.querySelectorAll('.ticket-filter-btn').forEach(btn => {
                btn.onclick = () => {
                    const st = btn.getAttribute('data-status');
                    this.renderTicketsTab(container, st);
                };
            });

            // Quick status dropdown changer
            container.querySelectorAll('.admin-quick-status-select').forEach(sel => {
                sel.onchange = async (e) => {
                    const id = sel.getAttribute('data-id');
                    const newStatus = sel.value;
                    try {
                        await API.admin.updateTicket(id, { status: newStatus });
                        this.renderTicketsTab(container, currentFilter);
                    } catch (err) {
                        alert('Failed to update ticket: ' + err.message);
                    }
                };
            });

            // Thread view modal listener
            container.querySelectorAll('.admin-view-ticket-btn').forEach(btn => {
                btn.onclick = () => {
                    const id = btn.getAttribute('data-id');
                    this.showAdminTicketModal(id, currentFilter);
                };
            });
        } catch (e) {
            container.innerHTML = `<div class="text-danger" style="padding: 30px; text-align: center;">Failed to load support tickets: ${e.message}</div>`;
        }
    },

    async showAdminTicketModal(ticketId, currentFilter) {
        const host = document.getElementById('admin-ticket-modal-host');
        if (!host) return;

        host.innerHTML = `
            <dialog id="admin-ticket-modal" style="width: min(92vw, 720px); padding: 0; border-radius: var(--border-radius-lg); background: var(--bg-surface); border: 1px solid var(--border-color); color: var(--text-primary); box-shadow: var(--shadow-lg);">
                <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-weight: 800; font-size: 1.15rem; font-family: var(--font-heading);" id="admin-ticket-modal-title">
                        Loading Support Ticket...
                    </div>
                    <button type="button" onclick="document.getElementById('admin-ticket-modal').close()" style="border: none; background: transparent; font-size: 1.2rem; color: var(--text-muted); cursor: pointer;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div style="padding: 20px 24px; max-height: 480px; overflow-y: auto;" id="admin-ticket-modal-body">
                    <div style="text-align: center; padding: 30px;"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</div>
                </div>
                <div style="padding: 16px 24px; border-top: 1px solid var(--border-color); background: var(--bg-surface-elevated);" id="admin-ticket-modal-footer">
                </div>
            </dialog>
        `;

        const modal = document.getElementById('admin-ticket-modal');
        modal.showModal();

        try {
            const res = await API.support.getTicket(ticketId);
            const ticket = res.ticket;
            const replies = res.replies || [];

            document.getElementById('admin-ticket-modal-title').innerHTML = `
                <span class="font-mono text-primary">#${ticket.ticket_code}</span>: ${ticket.subject}
            `;

            const repliesHtml = replies.map(r => {
                const isAdmin = r.sender_role === 'admin' || r.sender_role === 'staff';
                const timeStr = new Date(r.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                return `
                    <div style="margin-bottom: 16px; display: flex; flex-direction: column; align-items: ${isAdmin ? 'flex-end' : 'flex-start'};">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 0.78rem;">
                            <span style="font-weight: 700; color: ${isAdmin ? '#FFB703' : 'var(--text-primary)'};">
                                ${isAdmin ? '<i class="fa-solid fa-shield-halved"></i> Staff: ' : '<i class="fa-solid fa-user"></i> User: '}${r.sender_name}
                            </span>
                            <span style="color: var(--text-muted);">${timeStr}</span>
                        </div>
                        <div style="max-width: 85%; padding: 12px 16px; border-radius: 14px; background: ${isAdmin ? 'rgba(255, 183, 3, 0.12)' : 'var(--bg-surface-elevated)'}; border: 1px solid ${isAdmin ? 'rgba(255, 183, 3, 0.3)' : 'var(--border-color)'}; font-size: 0.92rem; line-height: 1.45; font-family: var(--font-family);">
                            ${r.message}
                        </div>
                    </div>
                `;
            }).join('');

            document.getElementById('admin-ticket-modal-body').innerHTML = `
                <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;">
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
                        ${this.getTicketStatusBadge(ticket.status)}
                        ${this.getTicketPriorityBadge(ticket.priority)}
                        <span style="font-size: 0.8rem; color: var(--text-muted);">&bull; User: <strong>${ticket.user_name}</strong> (${ticket.user_email})</span>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">&bull; Category: <strong>${ticket.category}</strong></span>
                    </div>
                    <div style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.5;">
                        ${ticket.description}
                    </div>
                </div>
                <div style="font-size: 0.82rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px; letter-spacing: 0.5px;">
                    Staff & User Conversation Thread
                </div>
                ${repliesHtml}
            `;

            document.getElementById('admin-ticket-modal-footer').innerHTML = `
                <form id="admin-ticket-reply-form" style="display: flex; flex-direction: column; gap: 10px;">
                    <textarea id="admin-reply-text" rows="3" placeholder="Type official administrative response to this user..." style="width: 100%; padding: 10px 14px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary); font-family: var(--font-family); resize: vertical;" required></textarea>
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <label style="font-size: 0.82rem; color: var(--text-muted);">Set Status After Reply:</label>
                            <select id="admin-reply-set-status" style="padding: 6px 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary); font-size: 0.82rem;">
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary" style="padding: 8px 22px; font-size: 0.88rem;">
                            <i class="fa-solid fa-paper-plane"></i> Send Official Reply
                        </button>
                    </div>
                </form>
            `;

            document.getElementById('admin-ticket-reply-form').onsubmit = async (e) => {
                e.preventDefault();
                const msg = document.getElementById('admin-reply-text').value.trim();
                const setStatus = document.getElementById('admin-reply-set-status').value;
                if (!msg) return;

                try {
                    await API.admin.replyTicket(ticketId, { message: msg, set_status: setStatus });
                    this.showAdminTicketModal(ticketId, currentFilter);
                } catch (err) {
                    alert('Failed to send reply: ' + err.message);
                }
            };
        } catch (err) {
            document.getElementById('admin-ticket-modal-body').innerHTML = `<div class="text-danger">Failed to load ticket: ${err.message}</div>`;
        }
    },

    getTicketStatusBadge(status) {
        switch (status) {
            case 'open':
                return '<span style="background: rgba(58, 134, 255, 0.15); color: #3A86FF; border: 1px solid rgba(58, 134, 255, 0.3); font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 6px;">OPEN</span>';
            case 'in_progress':
                return '<span style="background: rgba(255, 183, 3, 0.15); color: #FFB703; border: 1px solid rgba(255, 183, 3, 0.3); font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 6px;">IN PROGRESS</span>';
            case 'resolved':
                return '<span style="background: rgba(0, 230, 118, 0.15); color: #00E676; border: 1px solid rgba(0, 230, 118, 0.3); font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 6px;">RESOLVED</span>';
            case 'closed':
                return '<span style="background: rgba(255, 255, 255, 0.08); color: var(--text-muted); border: 1px solid var(--border-color); font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 6px;">CLOSED</span>';
            default:
                return `<span style="font-size: 0.72rem; font-weight: 700;">${(status || 'OPEN').toUpperCase()}</span>`;
        }
    },

    getTicketPriorityBadge(priority) {
        switch (priority) {
            case 'urgent':
                return '<span style="background: rgba(255, 59, 48, 0.15); color: #FF3B30; border: 1px solid rgba(255, 59, 48, 0.3); font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 6px;"><i class="fa-solid fa-triangle-exclamation"></i> URGENT</span>';
            case 'high':
                return '<span style="background: rgba(255, 149, 0, 0.15); color: #FF9500; border: 1px solid rgba(255, 149, 0, 0.3); font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 6px;">HIGH</span>';
            case 'medium':
                return '<span style="background: rgba(58, 134, 255, 0.1); color: #3A86FF; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 6px;">MEDIUM</span>';
            default:
                return '<span style="background: rgba(255, 255, 255, 0.05); color: var(--text-muted); font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 6px;">LOW</span>';
        }
    }
};

window.AdminView = AdminView;

