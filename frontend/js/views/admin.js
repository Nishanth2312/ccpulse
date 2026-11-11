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

        const tabTitles = {
            overview: 'System Overview & Telemetry',
            analytics: 'Daily Analytics & User Growth',
            cryptos: 'Cryptocurrency Asset Registry',
            currencies: 'Currencies & Live Forex Matrix',
            users: 'User Governance Directory',
            balances: 'Virtual Balances & Adjustments',
            tickets: 'Support Helpdesk Tickets',
            settings: 'Global Platform Settings',
            bonus: 'Welcome Bonus & Airdrop Central',
            swap: 'DEX Token Swap & Execution Policies',
            audits: 'Immutable Security Audit Trail',
            database: 'Client Database Engine & Backups'
        };

        container.innerHTML = `
            <div class="cf-admin-container">
                <!-- Mobile Backdrop for off-canvas drawer -->
                <div class="cf-admin-backdrop" id="cf-admin-backdrop"></div>

                <!-- Dedicated Left-Hand Sidebar Menu (Cloudflare Style) -->
                <aside class="cf-admin-sidebar" id="cf-admin-sidebar">
                    <div class="cf-admin-sidebar-inner">
                        <!-- Cloudflare Brand Header -->
                        <div class="cf-brand">
                            <div class="cf-brand-icon">
                                <i class="fa-solid fa-cloud-bolt"></i>
                            </div>
                            <div class="cf-brand-text">
                                <div class="cf-brand-title">CCPulse</div>
                                <span class="cf-brand-badge">Cloud Admin</span>
                            </div>
                            <button type="button" class="btn btn-sm btn-outline" id="cf-sidebar-close-btn" style="display: none; margin-left: auto; padding: 2px 8px;" aria-label="Close menu">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <!-- Active Domain / Environment Pill -->
                        <div class="cf-domain-pill">
                            <i class="fa-solid fa-circle-check text-green"></i>
                            <span>ccpulse.enterprise</span>
                        </div>

                        <!-- Fast Search Filter for Menus -->
                        <div class="cf-search-box">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <input type="text" id="cf-menu-search" placeholder="Search menus & options..." autocomplete="off">
                        </div>

                        <!-- Navigation Sections -->
                        <!-- Group 1: Telemetry & Analytics -->
                        <div class="cf-nav-section" data-group="analytics">
                            <div class="cf-nav-heading">Telemetry & Analytics</div>
                            <button type="button" class="cf-nav-item ${this.currentTab === 'overview' ? 'active' : ''}" data-tab="overview">
                                <div class="cf-nav-item-content">
                                    <i class="fa-solid fa-gauge-high cf-nav-item-icon"></i>
                                    <span>System Overview</span>
                                </div>
                            </button>
                            <button type="button" class="cf-nav-item ${this.currentTab === 'analytics' ? 'active' : ''}" data-tab="analytics">
                                <div class="cf-nav-item-content">
                                    <i class="fa-solid fa-chart-line cf-nav-item-icon"></i>
                                    <span>Daily Telemetry</span>
                                </div>
                            </button>
                        </div>

                        <!-- Group 2: Asset Engine -->
                        <div class="cf-nav-section" data-group="assets">
                            <div class="cf-nav-heading">Asset Engine</div>
                            <button type="button" class="cf-nav-item ${this.currentTab === 'cryptos' ? 'active' : ''}" data-tab="cryptos">
                                <div class="cf-nav-item-content">
                                    <i class="fa-solid fa-coins cf-nav-item-icon"></i>
                                    <span>Crypto Registry</span>
                                </div>
                            </button>
                            <button type="button" class="cf-nav-item ${this.currentTab === 'currencies' ? 'active' : ''}" data-tab="currencies">
                                <div class="cf-nav-item-content">
                                    <i class="fa-solid fa-globe cf-nav-item-icon"></i>
                                    <span>Currencies & FX</span>
                                </div>
                            </button>
                        </div>

                        <!-- Group 3: User Governance -->
                        <div class="cf-nav-section" data-group="accounts">
                            <div class="cf-nav-heading">User Governance</div>
                            <button type="button" class="cf-nav-item ${this.currentTab === 'users' ? 'active' : ''}" data-tab="users">
                                <div class="cf-nav-item-content">
                                    <i class="fa-solid fa-users-gear cf-nav-item-icon"></i>
                                    <span>User Directory</span>
                                </div>
                            </button>
                            <button type="button" class="cf-nav-item ${this.currentTab === 'balances' ? 'active' : ''}" data-tab="balances">
                                <div class="cf-nav-item-content">
                                    <i class="fa-solid fa-money-bill-transfer cf-nav-item-icon"></i>
                                    <span>Virtual Balances</span>
                                </div>
                            </button>
                        </div>

                        <!-- Group 4: Support Desk -->
                        <div class="cf-nav-section" data-group="support">
                            <div class="cf-nav-heading">Helpdesk & Support</div>
                            <button type="button" class="cf-nav-item ${this.currentTab === 'tickets' ? 'active' : ''}" data-tab="tickets">
                                <div class="cf-nav-item-content">
                                    <i class="fa-solid fa-headset cf-nav-item-icon"></i>
                                    <span>Support Tickets</span>
                                </div>
                                <span class="cf-nav-badge warning" id="cf-badge-tickets">Tickets</span>
                            </button>
                        </div>

                        <!-- Group 5: Platform Policies & Main Options -->
                        <div class="cf-nav-section" data-group="policies">
                            <div class="cf-nav-heading">Platform Policies & Options</div>
                            <button type="button" class="cf-nav-item ${this.currentTab === 'settings' ? 'active' : ''}" data-tab="settings">
                                <div class="cf-nav-item-content">
                                    <i class="fa-solid fa-sliders cf-nav-item-icon"></i>
                                    <span>Global Settings</span>
                                </div>
                            </button>
                            <button type="button" class="cf-nav-item ${this.currentTab === 'bonus' ? 'active' : ''}" data-tab="bonus">
                                <div class="cf-nav-item-content">
                                    <i class="fa-solid fa-gift cf-nav-item-icon"></i>
                                    <span>Welcome Bonus & Airdrop</span>
                                </div>
                                <span class="cf-nav-badge success">$10k+BTC</span>
                            </button>
                            <button type="button" class="cf-nav-item ${this.currentTab === 'swap' ? 'active' : ''}" data-tab="swap">
                                <div class="cf-nav-item-content">
                                    <i class="fa-solid fa-shuffle cf-nav-item-icon"></i>
                                    <span>DEX Swap & Fees</span>
                                </div>
                            </button>
                        </div>

                        <!-- Group 6: Security & Database -->
                        <div class="cf-nav-section" data-group="security">
                            <div class="cf-nav-heading">Security & Database</div>
                            <button type="button" class="cf-nav-item ${this.currentTab === 'audits' ? 'active' : ''}" data-tab="audits">
                                <div class="cf-nav-item-content">
                                    <i class="fa-solid fa-shield-halved cf-nav-item-icon"></i>
                                    <span>Audit Trail</span>
                                </div>
                            </button>
                            <button type="button" class="cf-nav-item ${this.currentTab === 'database' ? 'active' : ''}" data-tab="database">
                                <div class="cf-nav-item-content">
                                    <i class="fa-solid fa-database cf-nav-item-icon"></i>
                                    <span>Client Database</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <!-- Sidebar Footer -->
                    <div class="cf-sidebar-footer">
                        <div class="cf-admin-profile">
                            <div class="cf-avatar"><i class="fa-solid fa-user-shield"></i></div>
                            <div class="cf-profile-info">
                                <div class="cf-profile-name">${State.currentUser.full_name || 'Chief Administrator'}</div>
                                <div class="cf-profile-role">Super Admin • L3</div>
                            </div>
                        </div>
                        <button type="button" id="cf-sidebar-collapse-btn" class="cf-collapse-btn">
                            <i class="fa-solid fa-chevron-left"></i> <span>Collapse</span>
                        </button>
                    </div>
                </aside>

                <!-- Main Content Area -->
                <main class="cf-admin-main">
                    <!-- Top Action Bar -->
                    <div class="cf-admin-topbar">
                        <div class="cf-topbar-left">
                            <button type="button" id="cf-mobile-toggle-btn" class="cf-mobile-toggle-btn">
                                <i class="fa-solid fa-bars"></i> Admin Menu
                            </button>
                            <div class="cf-breadcrumbs">
                                <i class="fa-solid fa-gauge-high"></i>
                                <span>Admin Console</span>
                                <i class="fa-solid fa-chevron-right"></i>
                                <span id="cf-current-crumb" class="cf-crumb-active">${tabTitles[this.currentTab] || 'Overview'}</span>
                            </div>
                        </div>
                        <div class="cf-topbar-right">
                            <span class="cf-status-pill">
                                <i class="fa-solid fa-circle-dot text-green"></i> Dual Persistence Active
                            </span>
                            <button type="button" class="btn btn-outline" id="admin-refresh-data-btn" style="padding: 6px 12px; font-size: 0.85rem;">
                                <i class="fa-solid fa-rotate"></i> Refresh
                            </button>
                        </div>
                    </div>

                    <!-- Feedback Toast Mount -->
                    <div id="cf-toast-mount"></div>

                    <!-- Tab Content Viewport -->
                    <div id="admin-tab-content"></div>
                </main>
            </div>
        `;

        const sidebar = container.querySelector('#cf-admin-sidebar');
        const backdrop = container.querySelector('#cf-admin-backdrop');
        const mobileToggle = container.querySelector('#cf-mobile-toggle-btn');
        const closeBtn = container.querySelector('#cf-sidebar-close-btn');
        const collapseBtn = container.querySelector('#cf-sidebar-collapse-btn');
        const menuSearch = container.querySelector('#cf-menu-search');

        // Mobile drawer open/close
        const toggleDrawer = (open) => {
            if (!sidebar || !backdrop) return;
            if (open) {
                sidebar.classList.add('mobile-open');
                backdrop.classList.add('active');
                if (closeBtn) closeBtn.style.display = 'inline-flex';
            } else {
                sidebar.classList.remove('mobile-open');
                backdrop.classList.remove('active');
                if (closeBtn) closeBtn.style.display = 'none';
            }
        };

        if (mobileToggle) mobileToggle.onclick = () => toggleDrawer(true);
        if (backdrop) backdrop.onclick = () => toggleDrawer(false);
        if (closeBtn) closeBtn.onclick = () => toggleDrawer(false);

        // Desktop collapse toggle
        if (collapseBtn && sidebar) {
            collapseBtn.onclick = () => {
                const isCollapsed = sidebar.classList.toggle('collapsed');
                collapseBtn.innerHTML = isCollapsed
                    ? '<i class="fa-solid fa-chevron-right"></i>'
                    : '<i class="fa-solid fa-chevron-left"></i> <span>Collapse</span>';
            };
        }

        // Fast menu search
        if (menuSearch) {
            menuSearch.oninput = (e) => {
                const q = e.target.value.toLowerCase().trim();
                container.querySelectorAll('.cf-nav-item').forEach(item => {
                    const text = item.textContent.toLowerCase();
                    item.style.display = (!q || text.includes(q)) ? 'flex' : 'none';
                });
            };
        }

        // Attach Nav Item Buttons
        container.querySelectorAll('.cf-nav-item').forEach(btn => {
            btn.onclick = () => {
                const tab = btn.getAttribute('data-tab');
                this.currentTab = tab;
                container.querySelectorAll('.cf-nav-item').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                toggleDrawer(false); // close drawer on mobile after clicking
                this.loadTabContent(tab);
            };
        });

        const refreshBtn = container.querySelector('#admin-refresh-data-btn');
        if (refreshBtn) {
            refreshBtn.onclick = () => this.loadTabContent(this.currentTab);
        }

        // Live badge update for support tickets
        this.updateBadgeCounts(container);

        await this.loadTabContent(this.currentTab);
    },

    showAdminToast(message, type = 'success') {
        const mount = document.getElementById('cf-toast-mount');
        if (!mount) return;
        const icon = type === 'success' ? 'fa-circle-check text-green' : 'fa-triangle-exclamation text-danger';
        const border = type === 'success' ? 'var(--color-success)' : 'var(--color-danger)';
        mount.innerHTML = `
            <div class="cf-toast-banner" style="border-left-color: ${border};">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fa-solid ${icon}" style="font-size: 1.15rem;"></i>
                    <span style="font-weight: 600;">${message}</span>
                </div>
                <button type="button" onclick="this.parentElement.remove()" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1rem; padding: 4px;">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;
        setTimeout(() => {
            const b = mount.querySelector('.cf-toast-banner');
            if (b) b.remove();
        }, 7000);
    },

    async updateBadgeCounts(container) {
        try {
            const ticketRes = await API.admin.getTickets({ status: 'open' });
            const count = ticketRes.tickets ? ticketRes.tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length : 0;
            const badge = container.querySelector('#cf-badge-tickets');
            if (badge) {
                badge.textContent = `${count} Open`;
                badge.className = count > 0 ? 'cf-nav-badge warning' : 'cf-nav-badge';
            }
        } catch (e) {}
    },

    async loadTabContent(tab) {
        const contentContainer = document.getElementById('admin-tab-content');
        if (!contentContainer) return;

        const tabTitles = {
            overview: 'System Overview & Telemetry',
            analytics: 'Daily Analytics & User Growth',
            cryptos: 'Cryptocurrency Asset Registry',
            currencies: 'Currencies & Live Forex Matrix',
            users: 'User Governance Directory',
            balances: 'Virtual Balances & Adjustments',
            tickets: 'Support Helpdesk Tickets',
            settings: 'Global Platform Settings',
            bonus: 'Welcome Bonus & Airdrop Central',
            swap: 'DEX Token Swap & Execution Policies',
            audits: 'Immutable Security Audit Trail',
            database: 'Client Database Engine & Backups'
        };

        const crumbEl = document.getElementById('cf-current-crumb');
        if (crumbEl) {
            crumbEl.textContent = tabTitles[tab] || 'Control Module';
        }

        contentContainer.innerHTML = '<div style="text-align:center;padding:50px;color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 12px; color: #F6821F;"></i><br>Loading administration module...</div>';

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
            case 'bonus':
                await this.renderBonusTab(contentContainer);
                break;
            case 'swap':
                await this.renderSwapTab(contentContainer);
                break;
            case 'database':
                await this.renderDatabaseTab(contentContainer);
                break;
            case 'audits':
                await this.renderAuditsTab(contentContainer);
                break;
            default:
                await this.renderOverviewTab(contentContainer);
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

    formatTimeAgo(dateInput) {
        if (!dateInput) return 'Never';
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return 'Never';
        const now = Date.now();
        const diffSec = Math.max(0, Math.floor((now - date.getTime()) / 1000));
        if (diffSec < 45) return 'Just now';
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
        if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
                        <h2 style="font-size: 1.3rem; font-weight: 800;">Registered User Governance Directory</h2>
                        <p style="font-size: 0.88rem; color: var(--text-secondary);">
                            Manage platform traders, monitor virtual balances, increase credits, freeze/block spammed accounts, and audit timing.
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
                                <th>Last Usage & Timing</th>
                                <th style="text-align: right; min-width: 240px;">Admin Governance Controls</th>
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
                                        <div style="font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                                            ${u.fullName || u.username}
                                            ${u.isSpam ? `<span style="font-size: 0.65rem; background: rgba(239, 68, 68, 0.2); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.35); padding: 1px 6px; border-radius: 4px; font-weight: 800;"><i class="fa-solid fa-triangle-exclamation"></i> SPAM</span>` : ''}
                                        </div>
                                        <div style="font-size: 0.78rem; color: var(--text-muted);">@${u.username} &bull; ${u.email}</div>
                                    </td>
                                    <td>
                                        <span style="font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: var(--border-radius-full); background: ${u.role === 'admin' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)'}; color: ${u.role === 'admin' ? '#F59E0B' : 'var(--text-secondary)'};">
                                            ${(u.role || 'user').toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <div style="display: flex; flex-direction: column; gap: 4px;">
                                            ${u.isSuspended ? `
                                                <span style="font-size: 0.72rem; font-weight: 700; padding: 2px 7px; border-radius: 12px; background: rgba(239,68,68,0.18); color: #EF4444; display: inline-flex; align-items: center; gap: 4px; width: fit-content;">
                                                    <i class="fa-solid fa-ban"></i> Blocked
                                                </span>
                                            ` : ''}
                                            ${u.isFrozen ? `
                                                <span style="font-size: 0.72rem; font-weight: 700; padding: 2px 7px; border-radius: 12px; background: rgba(59,130,246,0.18); color: #3B82F6; display: inline-flex; align-items: center; gap: 4px; width: fit-content;">
                                                    <i class="fa-solid fa-snowflake"></i> Frozen
                                                </span>
                                            ` : ''}
                                            ${u.isSpam ? `
                                                <span style="font-size: 0.72rem; font-weight: 700; padding: 2px 7px; border-radius: 12px; background: rgba(245,158,11,0.18); color: #F59E0B; display: inline-flex; align-items: center; gap: 4px; width: fit-content;">
                                                    <i class="fa-solid fa-triangle-exclamation"></i> Spammed
                                                </span>
                                            ` : ''}
                                            ${!u.isSuspended && !u.isFrozen && !u.isSpam ? `
                                                <span style="font-size: 0.72rem; font-weight: 700; padding: 2px 7px; border-radius: 12px; background: rgba(16,185,129,0.15); color: #10B981; display: inline-flex; align-items: center; gap: 4px; width: fit-content;">
                                                    <i class="fa-solid fa-circle-check"></i> Active
                                                </span>
                                            ` : ''}
                                        </div>
                                    </td>
                                    <td>
                                        <div class="font-mono" style="font-weight: 700; color: var(--color-success); font-size: 0.95rem;">
                                            ${Currency.format(balance)}
                                        </div>
                                        <button type="button" class="btn btn-outline quick-increase-btn" data-id="${u.id}" data-name="${u.username}" style="font-size: 0.7rem; padding: 2px 6px; margin-top: 4px; border-radius: 8px; color: #10B981; border-color: rgba(16,185,129,0.4);" title="Quick Add Virtual Funds">
                                            <i class="fa-solid fa-plus"></i> Increase
                                        </button>
                                    </td>
                                    <td>${holdingsCount} assets</td>
                                    <td style="font-size: 0.8rem; color: var(--text-muted);">${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recent'}</td>
                                    <td>
                                        <div style="font-size: 0.78rem; line-height: 1.4;">
                                            <div style="color: var(--text-primary); font-weight: 600;">
                                                <i class="fa-regular fa-clock" style="color: var(--color-primary); font-size: 0.75rem;"></i> Active: <span class="font-mono">${this.formatTimeAgo(u.lastActiveAt || u.lastLoginAt || u.createdAt)}</span>
                                            </div>
                                            <div style="color: var(--text-muted); font-size: 0.74rem;">
                                                <i class="fa-solid fa-arrow-right-arrow-left" style="font-size: 0.7rem;"></i> ${u.lastTradeAt ? ('Trade: ' + this.formatTimeAgo(u.lastTradeAt)) : 'No trades yet'}
                                            </div>
                                        </div>
                                    </td>
                                    <td style="text-align: right;">
                                        <div style="display: inline-flex; gap: 5px; flex-wrap: wrap; justify-content: flex-end;">
                                            <!-- Increase / Adjust Balance -->
                                            <button type="button" class="btn btn-outline user-balance-btn" data-id="${u.id}" data-name="${u.username}" title="Adjust Virtual Balance" style="font-size: 0.74rem; padding: 3px 7px; color: #10B981; border-color: rgba(16,185,129,0.35);">
                                                <i class="fa-solid fa-dollar-sign"></i> Balance
                                            </button>
                                            <!-- Freeze / Unfreeze -->
                                            <button type="button" class="btn btn-outline user-freeze-btn" data-id="${u.id}" data-name="${u.username}" data-frozen="${Boolean(u.isFrozen)}" title="${u.isFrozen ? 'Unfreeze Account (Allow Trades)' : 'Freeze Account (Block Trades/Swaps)'}" style="font-size: 0.74rem; padding: 3px 7px; color: ${u.isFrozen ? '#3B82F6' : '#94A3B8'}; border-color: ${u.isFrozen ? '#3B82F6' : 'var(--border-color)'};">
                                                <i class="fa-solid ${u.isFrozen ? 'fa-snowflake' : 'fa-lock'}"></i> ${u.isFrozen ? 'Unfreeze' : 'Freeze'}
                                            </button>
                                            <!-- Block / Unblock -->
                                            <button type="button" class="btn btn-outline user-block-btn" data-id="${u.id}" data-name="${u.username}" data-suspended="${Boolean(u.isSuspended)}" title="${u.isSuspended ? 'Unblock Account' : 'Block & Suspend Account'}" style="font-size: 0.74rem; padding: 3px 7px; color: ${u.isSuspended ? '#10B981' : '#EF4444'}; border-color: ${u.isSuspended ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'};">
                                                <i class="fa-solid ${u.isSuspended ? 'fa-user-check' : 'fa-ban'}"></i> ${u.isSuspended ? 'Unblock' : 'Block'}
                                            </button>
                                            <!-- Mark Spam / Unmark Spam -->
                                            <button type="button" class="btn btn-outline user-spam-btn" data-id="${u.id}" data-name="${u.username}" data-spam="${Boolean(u.isSpam)}" title="${u.isSpam ? 'Remove Spam Flag' : 'Flag as Spammed Account'}" style="font-size: 0.74rem; padding: 3px 7px; color: ${u.isSpam ? '#F59E0B' : '#64748B'}; border-color: ${u.isSpam ? 'rgba(245,158,11,0.4)' : 'var(--border-color)'};">
                                                <i class="fa-solid fa-triangle-exclamation"></i> ${u.isSpam ? 'Unspam' : 'Spam'}
                                            </button>
                                            <!-- Reset Password -->
                                            <button type="button" class="btn btn-outline user-reset-btn" data-id="${u.id}" data-name="${u.username}" title="Reset Password" style="font-size: 0.74rem; padding: 3px 7px;">
                                                <i class="fa-solid fa-key"></i>
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

            // Quick Increase Balance (+) Button
            container.querySelectorAll('.quick-increase-btn').forEach(btn => {
                btn.onclick = async () => {
                    const id = parseInt(btn.getAttribute('data-id'), 10);
                    const name = btn.getAttribute('data-name');
                    const promptAmount = prompt(`Enter virtual USD balance to ADD for @${name}:`, '1000');
                    if (!promptAmount) return;
                    const amount = parseFloat(promptAmount);
                    if (isNaN(amount) || amount <= 0) {
                        alert('Please enter a valid positive dollar amount.');
                        return;
                    }
                    try {
                        await API.admin.adjustUserBalance(id, amount, 'Administrative quick balance increase');
                        if (window.Toast) {
                            Toast.success(`Successfully increased @${name}'s virtual balance by $${amount.toLocaleString()} USD`, 'Balance Increased', `TX-BAL-${id}`);
                        }
                        this.loadTabContent('users');
                    } catch (e) {
                        if (window.Toast) Toast.error(e.message, 'Adjustment Failed');
                        else alert(e.message);
                    }
                };
            });

            // Adjust Balance Modal
            container.querySelectorAll('.user-balance-btn').forEach(btn => {
                btn.onclick = () => {
                    const id = parseInt(btn.getAttribute('data-id'), 10);
                    const name = btn.getAttribute('data-name');
                    this.showAdjustBalanceModal(id, name);
                };
            });

            // Freeze / Unfreeze
            container.querySelectorAll('.user-freeze-btn').forEach(btn => {
                btn.onclick = async () => {
                    const id = parseInt(btn.getAttribute('data-id'), 10);
                    const name = btn.getAttribute('data-name');
                    const isFrozen = btn.getAttribute('data-frozen') === 'true';
                    const targetFrozen = !isFrozen;
                    const actionLabel = targetFrozen ? 'FREEZE' : 'UNFREEZE';

                    if (confirm(`Are you sure you want to ${actionLabel} account @${name}? ${targetFrozen ? 'This locks all simulated trading & swaps for this user.' : 'This unlocks trading access.'}`)) {
                        try {
                            await API.admin.freezeUser(id, targetFrozen, 'Admin security policy');
                            if (window.Toast) {
                                Toast.warning(`User @${name} is now ${targetFrozen ? 'FROZEN (Trading locked)' : 'UNFROZEN (Trading unlocked)'}.`, targetFrozen ? 'Account Frozen' : 'Account Unfrozen', `SEC-FRZ-${id}`);
                            }
                            this.loadTabContent('users');
                        } catch (e) {
                            if (window.Toast) Toast.error(e.message, 'Freeze Action Failed');
                            else alert(e.message);
                        }
                    }
                };
            });

            // Block / Unblock
            container.querySelectorAll('.user-block-btn').forEach(btn => {
                btn.onclick = async () => {
                    const id = parseInt(btn.getAttribute('data-id'), 10);
                    const name = btn.getAttribute('data-name');
                    const isSuspended = btn.getAttribute('data-suspended') === 'true';
                    const targetSuspended = !isSuspended;
                    const actionLabel = targetSuspended ? 'BLOCK and SUSPEND' : 'UNBLOCK and ACTIVATE';

                    if (confirm(`Are you sure you want to ${actionLabel} user @${name}?`)) {
                        try {
                            await API.admin.blockUser(id, targetSuspended, 'Administrative suspension policy');
                            if (window.Toast) {
                                Toast.error(`User @${name} is now ${targetSuspended ? 'BLOCKED & SUSPENDED' : 'UNBLOCKED'}.`, targetSuspended ? 'Account Blocked' : 'Account Unblocked', `SEC-BLK-${id}`);
                            }
                            this.loadTabContent('users');
                        } catch (e) {
                            if (window.Toast) Toast.error(e.message, 'Block Action Failed');
                            else alert(e.message);
                        }
                    }
                };
            });

            // Mark Spam / Unmark Spam
            container.querySelectorAll('.user-spam-btn').forEach(btn => {
                btn.onclick = async () => {
                    const id = parseInt(btn.getAttribute('data-id'), 10);
                    const name = btn.getAttribute('data-name');
                    const isSpam = btn.getAttribute('data-spam') === 'true';
                    const targetSpam = !isSpam;

                    try {
                        await API.admin.markSpamUser(id, targetSpam, 'Flagged as spammed account');
                        if (window.Toast) {
                            Toast.info(`User @${name} is now ${targetSpam ? 'FLAGGED AS SPAM' : 'UNMARKED AS SPAM'}.`, 'Spam Status Updated', `SEC-SPAM-${id}`);
                        }
                        this.loadTabContent('users');
                    } catch (e) {
                        if (window.Toast) Toast.error(e.message, 'Spam Flag Failed');
                        else alert(e.message);
                    }
                };
            });

            // Reset Password
            container.querySelectorAll('.user-reset-btn').forEach(btn => {
                btn.onclick = () => {
                    const id = parseInt(btn.getAttribute('data-id'), 10);
                    const name = btn.getAttribute('data-name');
                    this.showResetPasswordModal(id, name);
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
                const msg = `Successfully applied ${action} of $${parseFloat(amount).toLocaleString()} USD for @${username}.`;
                if (window.Toast) {
                    Toast.success(msg, 'Balance Adjusted', `TX-ADJ-${userId}`);
                } else {
                    alert(msg);
                }
                dialog.close();
                this.loadTabContent('users');
            } catch (err) {
                if (window.Toast) {
                    Toast.error(err.message, 'Adjustment Failed');
                } else {
                    alert(err.message);
                }
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
                if (window.Toast) {
                    Toast.success(res.message || `Password reset for @${username}`, 'Password Reset', `SEC-PW-${userId}`);
                } else {
                    alert(res.message);
                }
                dialog.close();
            } catch (err) {
                if (window.Toast) {
                    Toast.error(err.message, 'Reset Failed');
                } else {
                    alert(err.message);
                }
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
            const { currencies, rates = {}, lastUpdated, isStale, provider = 'Live Forex Engine' } = status || {};

            const defaultCurrencies = [
                { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRateToUsd: 1.0, is_active: 1 },
                { code: 'INR', name: 'Indian Rupee', symbol: '₹', exchangeRateToUsd: rates.INR || 93.59, is_active: 1 },
                { code: 'EUR', name: 'Euro', symbol: '€', exchangeRateToUsd: rates.EUR || 0.895, is_active: 1 },
                { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRateToUsd: rates.GBP || 0.749, is_active: 1 },
                { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', exchangeRateToUsd: rates.AED || 3.672, is_active: 1 },
                { code: 'JPY', name: 'Japanese Yen', symbol: '¥', exchangeRateToUsd: rates.JPY || 158.71, is_active: 1 }
            ];
            const currenciesList = (currencies && currencies.length) ? currencies : defaultCurrencies;

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
                            ${currenciesList.map(cur => {
                                const rate = rates[cur.code] || cur.exchangeRateToUsd || 1.0;
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
    // SECTION F: GLOBAL SETTINGS & MAIN OPTIONS
    // ===================================================================
    async renderSettingsTab(container) {
        try {
            const res = await API.admin.getSettings();
            const s = res.settings || {};

            container.innerHTML = `
                <div style="margin-bottom: 24px;">
                    <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(246, 130, 31, 0.12); border: 1px solid rgba(246, 130, 31, 0.3); color: #F6821F; padding: 4px 12px; border-radius: var(--border-radius-full); font-size: 0.76rem; font-weight: 700; margin-bottom: 8px;">
                        <i class="fa-solid fa-sliders"></i> Global Platform Policies
                    </div>
                    <h2 style="font-size: 1.5rem; font-weight: 800; margin: 0 0 6px 0;">Platform Settings & Core Controls</h2>
                    <p style="font-size: 0.9rem; color: var(--text-secondary); margin: 0;">
                        Configure welcome bonuses, default theme, market simulation rates, DEX swap fees, and platform maintenance mode.
                    </p>
                </div>

                <div class="glass-card" style="padding: 28px; max-width: 720px;">
                    <form id="global-settings-form">
                        <div style="display: flex; flex-direction: column; gap: 20px;">
                            <div>
                                <label style="display: block; font-size: 0.88rem; font-weight: 700; margin-bottom: 6px;">
                                    Default Welcome Cash Bonus ($ USD)
                                </label>
                                <input type="number" id="set-bonus" value="${s.default_welcome_bonus || '10000.00'}" step="100" min="0" required style="width: 100%; font-size: 1rem; font-weight: 700;">
                                <div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap;">
                                    <button type="button" class="btn btn-sm btn-outline set-bonus-preset" data-val="5000">$5,000</button>
                                    <button type="button" class="btn btn-sm btn-outline set-bonus-preset" data-val="10000">$10,000</button>
                                    <button type="button" class="btn btn-sm btn-outline set-bonus-preset" data-val="15000">$15,000</button>
                                    <button type="button" class="btn btn-sm btn-outline set-bonus-preset" data-val="25000">$25,000</button>
                                    <button type="button" class="btn btn-sm btn-outline set-bonus-preset" data-val="50000">$50,000</button>
                                    <button type="button" class="btn btn-sm btn-outline set-bonus-preset" data-val="100000">$100,000</button>
                                </div>
                                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 6px;">
                                    Virtual credits automatically deposited into every newly registered user's virtual wallet upon registration.
                                </div>
                            </div>

                            <div>
                                <label style="display: block; font-size: 0.88rem; font-weight: 700; margin-bottom: 6px;">
                                    Default Welcome Bitcoin Gift (BTC)
                                </label>
                                <input type="number" id="set-btc" value="${s.default_btc_bonus || '1.0'}" step="0.1" min="0" required style="width: 100%; font-size: 1rem; font-weight: 700;">
                                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
                                    Complimentary Bitcoin credited to holdings upon registration for instantaneous simulation trading.
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
                                <div>
                                    <label style="display: block; font-size: 0.88rem; font-weight: 700; margin-bottom: 6px;">
                                        Default Application Theme
                                    </label>
                                    <select id="set-theme" style="width: 100%;">
                                        <option value="dark" ${s.default_theme === 'dark' ? 'selected' : ''}>Dark High-Tech (Navy / Cyan / Purple)</option>
                                        <option value="light" ${s.default_theme === 'light' ? 'selected' : ''}>Clean Light (Financial Blue / High-Contrast)</option>
                                        <option value="system" ${s.default_theme === 'system' ? 'selected' : ''}>System Default (Follow Device)</option>
                                    </select>
                                </div>

                                <div>
                                    <label style="display: block; font-size: 0.88rem; font-weight: 700; margin-bottom: 6px;">
                                        Market Simulation Interval
                                    </label>
                                    <select id="set-interval" style="width: 100%;">
                                        <option value="5" ${s.market_refresh_interval_sec === '5' ? 'selected' : ''}>5 Seconds (High Frequency)</option>
                                        <option value="10" ${s.market_refresh_interval_sec === '10' ? 'selected' : ''}>10 Seconds (Standard Active)</option>
                                        <option value="30" ${s.market_refresh_interval_sec === '30' || !s.market_refresh_interval_sec ? 'selected' : ''}>30 Seconds (Cron Candle Bar Sync)</option>
                                        <option value="60" ${s.market_refresh_interval_sec === '60' ? 'selected' : ''}>60 Seconds (Low Bandwidth)</option>
                                    </select>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
                                <div>
                                    <label style="display: block; font-size: 0.88rem; font-weight: 700; margin-bottom: 6px;">
                                        DEX Swap Handling Fee (%)
                                    </label>
                                    <input type="number" id="set-swap-fee" value="${s.swap_fee_percent || '0.15'}" step="0.01" min="0" max="5.0" style="width: 100%;">
                                </div>

                                <div>
                                    <label style="display: block; font-size: 0.88rem; font-weight: 700; margin-bottom: 6px;">
                                        Default Base Currency
                                    </label>
                                    <select id="set-currency" style="width: 100%;">
                                        <option value="USD" ${s.default_currency === 'USD' || !s.default_currency ? 'selected' : ''}>USD ($ - United States Dollar)</option>
                                        <option value="INR" ${s.default_currency === 'INR' ? 'selected' : ''}>INR (₹ - Indian Rupee)</option>
                                        <option value="EUR" ${s.default_currency === 'EUR' ? 'selected' : ''}>EUR (€ - Euro)</option>
                                        <option value="GBP" ${s.default_currency === 'GBP' ? 'selected' : ''}>GBP (£ - British Pound)</option>
                                        <option value="AED" ${s.default_currency === 'AED' ? 'selected' : ''}>AED (د.إ - UAE Dirham)</option>
                                        <option value="JPY" ${s.default_currency === 'JPY' ? 'selected' : ''}>JPY (¥ - Japanese Yen)</option>
                                    </select>
                                </div>
                            </div>

                            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
                                <label style="display: flex; align-items: center; gap: 10px; font-size: 0.95rem; font-weight: 700; cursor: pointer;">
                                    <input type="checkbox" id="set-maint" ${s.maintenance_mode === 'true' ? 'checked' : ''} style="width: 18px; height: 18px;">
                                    Platform Maintenance Mode
                                </label>
                                <div style="font-size: 0.78rem; color: var(--color-warning); margin-top: 6px;">
                                    When activated, standard users are placed in read-only mode and trading simulations are paused.
                                </div>
                            </div>

                            <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 10px;">
                                <button type="submit" class="btn btn-primary" id="save-settings-btn" style="font-size: 0.95rem;">
                                    <i class="fa-solid fa-floppy-disk"></i> Save Global Configuration
                                </button>
                                <button type="button" class="btn btn-outline" id="jump-bonus-btn" style="font-size: 0.88rem;">
                                    <i class="fa-solid fa-gift"></i> Manage Registration Airdrops & Presets →
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            `;

            container.querySelectorAll('.set-bonus-preset').forEach(btn => {
                btn.onclick = () => {
                    container.querySelector('#set-bonus').value = btn.getAttribute('data-val');
                };
            });

            const jumpBonusBtn = container.querySelector('#jump-bonus-btn');
            if (jumpBonusBtn) {
                jumpBonusBtn.onclick = () => {
                    this.currentTab = 'bonus';
                    const activeNav = document.querySelector('.cf-nav-item[data-tab="bonus"]');
                    if (activeNav) {
                        document.querySelectorAll('.cf-nav-item').forEach(b => b.classList.remove('active'));
                        activeNav.classList.add('active');
                    }
                    this.loadTabContent('bonus');
                };
            }

            container.querySelector('#global-settings-form').onsubmit = async (e) => {
                e.preventDefault();
                const saveBtn = container.querySelector('#save-settings-btn');
                const origHtml = saveBtn.innerHTML;
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving configuration...';

                try {
                    const bonusVal = container.querySelector('#set-bonus').value;
                    const btcVal = container.querySelector('#set-btc').value;
                    const themeVal = container.querySelector('#set-theme').value;
                    const intervalVal = container.querySelector('#set-interval').value;
                    const maintVal = container.querySelector('#set-maint').checked ? 'true' : 'false';
                    const swapFeeVal = container.querySelector('#set-swap-fee').value;
                    const currVal = container.querySelector('#set-currency').value;

                    await API.admin.updateSettings({
                        default_welcome_bonus: bonusVal,
                        default_btc_bonus: btcVal,
                        default_theme: themeVal,
                        market_refresh_interval_sec: intervalVal,
                        maintenance_mode: maintVal,
                        swap_fee_percent: swapFeeVal,
                        default_currency: currVal
                    });

                    this.showAdminToast(`Platform settings updated successfully! Welcome bonus is now $${parseFloat(bonusVal).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD + ${btcVal} BTC for all new registrations.`, 'success');

                    if (typeof Theme !== 'undefined') {
                        if (typeof Theme.setTheme === 'function') {
                            Theme.setTheme(themeVal);
                        } else if (typeof Theme.apply === 'function') {
                            Theme.apply(themeVal);
                        }
                    }
                } catch (err) {
                    this.showAdminToast(`Error updating settings: ${err.message}`, 'danger');
                } finally {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = origHtml;
                }
            };
        } catch (e) {
            container.innerHTML = `<div style="color:var(--color-danger);">${e.message}</div>`;
        }
    },

    // ===================================================================
    // SECTION F2: WELCOME BONUS & COMMUNITY AIRDROP CENTRAL
    // ===================================================================
    async renderBonusTab(container) {
        try {
            const res = await API.admin.getSettings();
            const s = res.settings || {};
            const overviewRes = await API.admin.getOverview();
            const stats = overviewRes.stats || overviewRes.overview || {};

            const activeBonusUsd = parseFloat(s.default_welcome_bonus || '10000.00');
            const activeBonusBtc = parseFloat(s.default_btc_bonus || '1.0');
            const totalUsers = stats.totalRegisteredUsers || 2;
            const totalDistributed = stats.totalVirtualMoneyDistributedUsd || (totalUsers * activeBonusUsd);

            container.innerHTML = `
                <div style="margin-bottom: 24px;">
                    <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(0, 230, 118, 0.12); border: 1px solid rgba(0, 230, 118, 0.3); color: var(--color-success); padding: 4px 12px; border-radius: var(--border-radius-full); font-size: 0.76rem; font-weight: 700; margin-bottom: 8px;">
                        <i class="fa-solid fa-gift"></i> Active Registration Incentive System
                    </div>
                    <h2 style="font-size: 1.5rem; font-weight: 800; margin: 0 0 6px 0;">Welcome Bonus & Community Airdrop Central</h2>
                    <p style="font-size: 0.9rem; color: var(--text-secondary); margin: 0;">
                        Configure welcome cash and Bitcoin incentives credited to new accounts, or execute instant retroactive airdrops across all registered traders.
                    </p>
                </div>

                <!-- KPI Metric Tiles -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 24px;">
                    <div class="glass-card" style="padding: 18px 20px;">
                        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Welcome Cash Bonus</div>
                        <div class="font-mono text-cyan" style="font-size: 1.7rem; font-weight: 800; margin-top: 4px;">
                            $${activeBonusUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div style="font-size: 0.75rem; color: var(--color-success); margin-top: 4px;">
                            <i class="fa-solid fa-circle-check"></i> Automatically credited per registration
                        </div>
                    </div>

                    <div class="glass-card" style="padding: 18px 20px;">
                        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Welcome Bitcoin Gift</div>
                        <div class="font-mono" style="font-size: 1.7rem; font-weight: 800; margin-top: 4px; color: #F59E0B;">
                            ${activeBonusBtc.toFixed(4)} BTC
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">
                            ≈ $${(activeBonusBtc * 73932.53).toLocaleString('en-US', { maximumFractionDigits: 0 })} USD initial holding
                        </div>
                    </div>

                    <div class="glass-card" style="padding: 18px 20px;">
                        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Total Bonus Disbursed</div>
                        <div class="font-mono" style="font-size: 1.7rem; font-weight: 800; margin-top: 4px; color: var(--text-primary);">
                            $${totalDistributed.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">
                            Across ${totalUsers} registered trader accounts
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
                    <!-- Policy Adjustment Form -->
                    <div class="glass-card" style="padding: 24px;">
                        <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 8px;">
                            <i class="fa-solid fa-sliders text-cyan"></i> Registration Welcome Policy
                        </h3>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 18px;">
                            Changes apply immediately to all subsequent new user registrations.
                        </p>

                        <form id="bonus-policy-form">
                            <div style="display: flex; flex-direction: column; gap: 16px;">
                                <div>
                                    <label style="display: block; font-size: 0.86rem; font-weight: 700; margin-bottom: 6px;">
                                        Virtual USD Cash Bonus ($)
                                    </label>
                                    <input type="number" id="bonus-usd-input" value="${activeBonusUsd}" step="500" min="0" required style="width: 100%; font-size: 1rem; font-weight: 700;">
                                    <div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap;">
                                        <button type="button" class="btn btn-sm btn-outline preset-bonus-btn" data-val="5000">$5,000</button>
                                        <button type="button" class="btn btn-sm btn-outline preset-bonus-btn" data-val="10000">$10,000</button>
                                        <button type="button" class="btn btn-sm btn-outline preset-bonus-btn" data-val="15000">$15,000</button>
                                        <button type="button" class="btn btn-sm btn-outline preset-bonus-btn" data-val="25000">$25,000</button>
                                        <button type="button" class="btn btn-sm btn-outline preset-bonus-btn" data-val="50000">$50,000</button>
                                        <button type="button" class="btn btn-sm btn-outline preset-bonus-btn" data-val="100000">$100,000</button>
                                    </div>
                                </div>

                                <div>
                                    <label style="display: block; font-size: 0.86rem; font-weight: 700; margin-bottom: 6px;">
                                        Bitcoin Gift Holding (BTC)
                                    </label>
                                    <input type="number" id="bonus-btc-input" value="${activeBonusBtc}" step="0.1" min="0" required style="width: 100%; font-size: 1rem; font-weight: 700;">
                                    <div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap;">
                                        <button type="button" class="btn btn-sm btn-outline preset-btc-btn" data-val="0.25">0.25 BTC</button>
                                        <button type="button" class="btn btn-sm btn-outline preset-btc-btn" data-val="0.5">0.5 BTC</button>
                                        <button type="button" class="btn btn-sm btn-outline preset-btc-btn" data-val="1.0">1.0 BTC</button>
                                        <button type="button" class="btn btn-sm btn-outline preset-btc-btn" data-val="2.0">2.0 BTC</button>
                                        <button type="button" class="btn btn-sm btn-outline preset-btc-btn" data-val="5.0">5.0 BTC</button>
                                    </div>
                                </div>

                                <button type="submit" class="btn btn-primary" id="save-bonus-policy-btn" style="margin-top: 8px;">
                                    <i class="fa-solid fa-floppy-disk"></i> Apply & Save Welcome Policy
                                </button>
                            </div>
                        </form>
                    </div>

                    <!-- Retroactive Community Airdrop Card -->
                    <div class="glass-card" style="padding: 24px;">
                        <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 8px;">
                            <i class="fa-solid fa-paper-plane text-green"></i> Retroactive Community Airdrop
                        </h3>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 18px;">
                            Grant an instant top-up bonus to <strong>all ${totalUsers} existing registered accounts</strong> simultaneously.
                        </p>

                        <form id="airdrop-form">
                            <div style="display: flex; flex-direction: column; gap: 16px;">
                                <div>
                                    <label style="display: block; font-size: 0.86rem; font-weight: 700; margin-bottom: 6px;">
                                        Airdrop Additional Cash per Account ($ USD)
                                    </label>
                                    <input type="number" id="airdrop-usd-input" value="5000" step="500" min="0" required style="width: 100%;">
                                </div>

                                <div>
                                    <label style="display: block; font-size: 0.86rem; font-weight: 700; margin-bottom: 6px;">
                                        Airdrop Additional Bitcoin (BTC)
                                    </label>
                                    <input type="number" id="airdrop-btc-input" value="0.25" step="0.05" min="0" required style="width: 100%;">
                                </div>

                                <button type="submit" class="btn btn-outline" id="execute-airdrop-btn" style="margin-top: 8px; border-color: rgba(0, 230, 118, 0.5); color: var(--color-success);">
                                    <i class="fa-solid fa-parachute-box"></i> Execute Airdrop to All Traders
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;

            // Preset button listeners
            container.querySelectorAll('.preset-bonus-btn').forEach(btn => {
                btn.onclick = () => {
                    const val = btn.getAttribute('data-val');
                    container.querySelector('#bonus-usd-input').value = val;
                };
            });
            container.querySelectorAll('.preset-btc-btn').forEach(btn => {
                btn.onclick = () => {
                    const val = btn.getAttribute('data-val');
                    container.querySelector('#bonus-btc-input').value = val;
                };
            });

            // Save Policy Form
            const form = container.querySelector('#bonus-policy-form');
            form.onsubmit = async (e) => {
                e.preventDefault();
                const saveBtn = container.querySelector('#save-bonus-policy-btn');
                const origHtml = saveBtn.innerHTML;
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

                try {
                    const usdVal = container.querySelector('#bonus-usd-input').value;
                    const btcVal = container.querySelector('#bonus-btc-input').value;
                    await API.admin.updateSettings({
                        default_welcome_bonus: usdVal,
                        default_btc_bonus: btcVal
                    });
                    this.showAdminToast(`Welcome bonus policy updated successfully! New registrants will receive $${parseFloat(usdVal).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD and ${btcVal} BTC.`, 'success');
                    await this.renderBonusTab(container);
                } catch (err) {
                    this.showAdminToast(`Error updating welcome bonus: ${err.message}`, 'danger');
                } finally {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = origHtml;
                }
            };

            // Airdrop Form
            const airdropForm = container.querySelector('#airdrop-form');
            airdropForm.onsubmit = async (e) => {
                e.preventDefault();
                const usd = parseFloat(container.querySelector('#airdrop-usd-input').value) || 0;
                const btc = parseFloat(container.querySelector('#airdrop-btc-input').value) || 0;
                if (!confirm(`Are you sure you want to airdrop +$${usd.toLocaleString('en-US')} USD and +${btc} BTC to ALL registered users?`)) {
                    return;
                }
                const dropBtn = container.querySelector('#execute-airdrop-btn');
                dropBtn.disabled = true;
                dropBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Distributing airdrop...';
                try {
                    const resDrop = await API.admin.airdropBonus(usd, btc);
                    this.showAdminToast(`Airdrop successfully completed! Credited +$${usd} USD and +${btc} BTC across ${resDrop.creditedWallets || totalUsers} user wallets.`, 'success');
                    await this.renderBonusTab(container);
                } catch (err) {
                    this.showAdminToast(`Airdrop error: ${err.message}`, 'danger');
                } finally {
                    dropBtn.disabled = false;
                    dropBtn.innerHTML = '<i class="fa-solid fa-parachute-box"></i> Execute Airdrop to All Traders';
                }
            };
        } catch (err) {
            container.innerHTML = `<div style="color:var(--color-danger);">${err.message}</div>`;
        }
    },

    // ===================================================================
    // SECTION F3: DEX SWAP & EXECUTION POLICIES
    // ===================================================================
    async renderSwapTab(container) {
        try {
            const res = await API.admin.getSettings();
            const s = res.settings || {};

            container.innerHTML = `
                <div style="margin-bottom: 24px;">
                    <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.3); color: #3B82F6; padding: 4px 12px; border-radius: var(--border-radius-full); font-size: 0.76rem; font-weight: 700; margin-bottom: 8px;">
                        <i class="fa-solid fa-shuffle"></i> Decentralized Simulated Exchange Engine
                    </div>
                    <h2 style="font-size: 1.5rem; font-weight: 800; margin: 0 0 6px 0;">DEX Token Swap & Execution Policies</h2>
                    <p style="font-size: 0.9rem; color: var(--text-secondary); margin: 0;">
                        Control transaction handling fees, slippage tolerance, gas estimation models, and liquidity parameters.
                    </p>
                </div>

                <div class="glass-card" style="padding: 24px; max-width: 680px;">
                    <form id="swap-policy-form">
                        <div style="display: flex; flex-direction: column; gap: 18px;">
                            <div>
                                <label style="display: block; font-size: 0.88rem; font-weight: 700; margin-bottom: 6px;">
                                    DEX Swap Handling Fee (%)
                                </label>
                                <input type="number" id="swap-fee-input" value="${s.swap_fee_percent || '0.15'}" step="0.01" min="0" max="5.0" required style="width: 100%;">
                                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
                                    Standard institutional DEX swap fee applied to all token conversions (e.g. BTC ⇄ BDX).
                                </div>
                            </div>

                            <div>
                                <label style="display: block; font-size: 0.88rem; font-weight: 700; margin-bottom: 6px;">
                                    Max Single Swap Limit ($ USD)
                                </label>
                                <input type="number" id="swap-limit-input" value="${s.max_swap_limit_usd || '500000'}" step="10000" min="1000" required style="width: 100%;">
                            </div>

                            <div>
                                <label style="display: block; font-size: 0.88rem; font-weight: 700; margin-bottom: 6px;">
                                    Simulated Slippage Tolerance (%)
                                </label>
                                <select id="swap-slippage-select" style="width: 100%;">
                                    <option value="0.1">0.10% (Ultra-Low / Institutional)</option>
                                    <option value="0.5" selected>0.50% (Standard Market Default)</option>
                                    <option value="1.0">1.00% (High Volatility Sizing)</option>
                                    <option value="2.5">2.50% (Extreme De-peg / Illiquid Altcoins)</option>
                                </select>
                            </div>

                            <button type="submit" class="btn btn-primary" id="save-swap-btn" style="margin-top: 10px;">
                                <i class="fa-solid fa-floppy-disk"></i> Save DEX Swap Rules
                            </button>
                        </div>
                    </form>
                </div>
            `;

            container.querySelector('#swap-policy-form').onsubmit = async (e) => {
                e.preventDefault();
                const btn = container.querySelector('#save-swap-btn');
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
                try {
                    await API.admin.updateSettings({
                        swap_fee_percent: container.querySelector('#swap-fee-input').value,
                        max_swap_limit_usd: container.querySelector('#swap-limit-input').value
                    });
                    this.showAdminToast('DEX token swap policies saved and applied across simulator engine.', 'success');
                } catch (err) {
                    this.showAdminToast(`Error saving swap policies: ${err.message}`, 'danger');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save DEX Swap Rules';
                }
            };
        } catch (err) {
            container.innerHTML = `<div style="color:var(--color-danger);">${err.message}</div>`;
        }
    },

    // ===================================================================
    // SECTION F4: CLIENT DATABASE ENGINE & BACKUP MANAGER
    // ===================================================================
    async renderDatabaseTab(container) {
        try {
            const hasClientDB = typeof ClientDB !== 'undefined';
            const usersCount = hasClientDB ? ClientDB.users.getAll().length : 2;
            const snapshot = hasClientDB ? ClientDB.getSnapshot() : { wallets: [], trades: [], tickets: [], wallet_transactions: [], audit_logs: [] };
            const walletsCount = snapshot.wallets?.length || 2;
            const tradesCount = snapshot.trades?.length || 0;
            const ticketsCount = snapshot.tickets?.length || 0;
            const txCount = snapshot.wallet_transactions?.length || 0;
            const auditsCount = snapshot.audit_logs?.length || 0;

            container.innerHTML = `
                <div style="margin-bottom: 24px;">
                    <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); color: var(--color-success); padding: 4px 12px; border-radius: var(--border-radius-full); font-size: 0.76rem; font-weight: 700; margin-bottom: 8px;">
                        <i class="fa-solid fa-database"></i> Dual-Tier Persistence Architecture
                    </div>
                    <h2 style="font-size: 1.5rem; font-weight: 800; margin: 0 0 6px 0;">Client Database Engine & Backup Manager</h2>
                    <p style="font-size: 0.9rem; color: var(--text-secondary); margin: 0;">
                        CCPulse stores all registered traders, portfolios, orders, and support tickets in SQLite (backend) and in-browser ClientDB (GitHub Pages) with full offline resilience.
                    </p>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px;">
                    <div class="glass-card" style="padding: 14px; text-align: center;">
                        <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Users Table</div>
                        <div class="font-mono text-cyan" style="font-size: 1.5rem; font-weight: 800; margin-top: 4px;">${usersCount}</div>
                    </div>
                    <div class="glass-card" style="padding: 14px; text-align: center;">
                        <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Wallets Table</div>
                        <div class="font-mono text-cyan" style="font-size: 1.5rem; font-weight: 800; margin-top: 4px;">${walletsCount}</div>
                    </div>
                    <div class="glass-card" style="padding: 14px; text-align: center;">
                        <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Transactions</div>
                        <div class="font-mono text-cyan" style="font-size: 1.5rem; font-weight: 800; margin-top: 4px;">${txCount}</div>
                    </div>
                    <div class="glass-card" style="padding: 14px; text-align: center;">
                        <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Trades Executed</div>
                        <div class="font-mono text-cyan" style="font-size: 1.5rem; font-weight: 800; margin-top: 4px;">${tradesCount}</div>
                    </div>
                    <div class="glass-card" style="padding: 14px; text-align: center;">
                        <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Support Tickets</div>
                        <div class="font-mono text-cyan" style="font-size: 1.5rem; font-weight: 800; margin-top: 4px;">${ticketsCount}</div>
                    </div>
                    <div class="glass-card" style="padding: 14px; text-align: center;">
                        <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Audit Trail</div>
                        <div class="font-mono text-cyan" style="font-size: 1.5rem; font-weight: 800; margin-top: 4px;">${auditsCount}</div>
                    </div>
                </div>

                <div class="glass-card" style="padding: 24px; max-width: 680px; margin-bottom: 24px;">
                    <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 12px;">Database Controls</h3>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        <button type="button" id="export-json-btn" class="btn btn-primary" style="font-size: 0.88rem;">
                            <i class="fa-solid fa-download"></i> Export Database JSON Backup
                        </button>
                        <button type="button" id="reset-db-btn" class="btn btn-outline" style="font-size: 0.88rem; color: var(--color-danger); border-color: rgba(255, 59, 48, 0.4);">
                            <i class="fa-solid fa-rotate-left"></i> Factory Reset Database
                        </button>
                    </div>
                </div>
            `;

            const exportBtn = container.querySelector('#export-json-btn');
            if (exportBtn) {
                exportBtn.onclick = () => {
                    const jsonStr = API.database.exportJSON();
                    const blob = new Blob([jsonStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ccpulse_db_backup_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    this.showAdminToast('Database backup downloaded successfully.', 'success');
                };
            }

            const resetBtn = container.querySelector('#reset-db-btn');
            if (resetBtn) {
                resetBtn.onclick = () => {
                    if (confirm('Are you sure you want to reset the client database to factory default seeds? All custom users, trades, and tickets on this browser will be wiped.')) {
                        API.database.resetToDefault();
                        this.showAdminToast('Client database reset to factory defaults.', 'success');
                        this.renderDatabaseTab(container);
                    }
                };
            }
        } catch (err) {
            container.innerHTML = `<div style="color:var(--color-danger);">${err.message}</div>`;
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

