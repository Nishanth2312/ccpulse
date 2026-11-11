/**
 * CCPulse Main Application Entry Point & Single Page Router
 * Strictly complies with public, authenticated, and administrative navigation structures.
 */
const App = {
    async init() {
        // Initialize Theme, Currency, and Modals
        Theme.init();
        await Currency.init();
        AuthModals.init();

        // Check current session / verify token
        if (State.token) {
            try {
                const me = await API.auth.me();
                if (me.user) {
                    State.currentUser = me.user;
                    State.wallet = me.wallet;
                    State.isGuest = false;
                    State.unreadNotificationsCount = me.unreadNotifications || 0;
                    if (me.preferences) {
                        if (me.preferences.preferred_currency) State.setCurrency(me.preferences.preferred_currency);
                        if (me.preferences.theme) Theme.apply(me.preferences.theme);
                    }
                } else {
                    State.setGuest();
                }
            } catch (e) {
                State.setGuest();
            }
        } else {
            State.setGuest();
        }

        // Setup Header Navigation & UI
        this.renderNav();
        this.renderAuthActions();
        this.setupMobileDrawer();
        this.setupNotifications();

        // Subscribe to state changes
        State.subscribe((state, changeKey) => {
            this.renderNav();
            this.renderAuthActions();

            // When currency or wallet updates, re-render the current view
            if (changeKey === 'currency' || changeKey === 'wallet' || changeKey === 'auth' || changeKey === 'logout') {
                this.route();
            }
        });

        // Setup Hash Change Listener
        window.addEventListener('hashchange', () => this.route());

        // Initial Route
        this.route();
    },

    renderNav() {
        const desktopNav = document.getElementById('desktop-nav-links');
        const mobileNav = document.getElementById('mobile-nav-links');
        const isAuth = State.currentUser && !State.isGuest;
        const isAdmin = isAuth && State.currentUser.role === 'admin';
        const currentHash = window.location.hash.slice(1).split('?')[0].split('/')[0] || 'cryptocurrencies';

        const isCryptosActive = ['cryptocurrencies', 'markets', 'dashboard'].includes(currentHash) || currentHash.startsWith('crypto');
        const isExchangesActive = ['exchanges', 'swap', 'simulator', 'simulation-lab'].includes(currentHash);
        const isTradeActive = isExchangesActive;
        const isLearnActive = ['learn', 'learning', 'safety-center', 'support', 'help'].includes(currentHash);
        const isPortfolioActive = currentHash === 'portfolio';

        // Desktop Navigation: Dedicated CoinGecko-Style Structure
        // Cryptocurrencies | Exchanges | Learn | Portfolio | (Admin)
        const desktopHtml = `
            <!-- Cryptocurrencies Menu with Hover Dropdown -->
            <div class="nav-item nav-dropdown" id="nav-dropdown-cryptos">
                <a href="#cryptocurrencies" class="nav-link nav-dropdown-trigger ${isCryptosActive ? 'active' : ''}" aria-haspopup="true" aria-expanded="false">
                    <i class="fa-solid fa-coins"></i>
                    <span>Cryptocurrencies</span>
                    <i class="fa-solid fa-chevron-down nav-arrow"></i>
                </a>
                <div class="nav-dropdown-menu" role="menu">
                    <a href="#cryptocurrencies" class="dropdown-item ${currentHash === 'cryptocurrencies' || currentHash === 'markets' ? 'active' : ''}" role="menuitem">
                        <div class="dropdown-icon" style="background: rgba(22, 199, 132, 0.15); color: #16C784;"><i class="fa-solid fa-ranking-star"></i></div>
                        <div class="dropdown-text">
                            <span class="dropdown-title">By Market Cap</span>
                            <span class="dropdown-sub">Live ranking, prices, 1h/24h/7d metrics & 7d sparkline charts</span>
                        </div>
                    </a>
                    <a href="#cryptocurrencies?tab=trending" class="dropdown-item" role="menuitem">
                        <div class="dropdown-icon" style="background: rgba(245, 158, 11, 0.15); color: #F59E0B;"><i class="fa-solid fa-fire"></i></div>
                        <div class="dropdown-text">
                            <span class="dropdown-title">Highlights & Trending</span>
                            <span class="dropdown-sub">Most active and trending cryptocurrencies in last 24h</span>
                        </div>
                    </a>
                    <a href="#cryptocurrencies?filter=PRIVACY" class="dropdown-item" role="menuitem">
                        <div class="dropdown-icon" style="background: rgba(139, 92, 246, 0.15); color: #8B5CF6;"><i class="fa-solid fa-shield-cat"></i></div>
                        <div class="dropdown-text">
                            <span class="dropdown-title">Privacy Blockchains</span>
                            <span class="dropdown-sub">Beldex (BDX), Monero (XMR) & confidential transaction assets</span>
                        </div>
                    </a>
                    <a href="#cryptocurrencies?tab=gainers" class="dropdown-item" role="menuitem">
                        <div class="dropdown-icon" style="background: rgba(16, 185, 129, 0.15); color: #10B981;"><i class="fa-solid fa-rocket"></i></div>
                        <div class="dropdown-text">
                            <span class="dropdown-title">Top Gainers & Movers</span>
                            <span class="dropdown-sub">Highest 24h volatility and percentage growth leaders</span>
                        </div>
                    </a>
                </div>
            </div>

            <!-- Exchanges Menu with Hover Dropdown -->
            <div class="nav-item nav-dropdown" id="nav-dropdown-exchanges">
                <a href="#exchanges" class="nav-link nav-dropdown-trigger ${isExchangesActive ? 'active' : ''}" aria-haspopup="true" aria-expanded="false">
                    <i class="fa-solid fa-repeat"></i>
                    <span>Exchanges</span>
                    <i class="fa-solid fa-chevron-down nav-arrow"></i>
                </a>
                <div class="nav-dropdown-menu" role="menu">
                    <a href="#swap" class="dropdown-item ${currentHash === 'swap' || currentHash === 'exchanges' ? 'active' : ''}" role="menuitem">
                        <div class="dropdown-icon" style="background: rgba(22, 199, 132, 0.15); color: #16C784;"><i class="fa-solid fa-repeat"></i></div>
                        <div class="dropdown-text">
                            <span class="dropdown-title">Instant DEX Token Swap</span>
                            <span class="dropdown-sub">Convert coin to coin with network gas & handling fees</span>
                        </div>
                    </a>
                    <a href="#simulator" class="dropdown-item ${currentHash === 'simulator' ? 'active' : ''}" role="menuitem">
                        <div class="dropdown-icon trade-icon"><i class="fa-solid fa-chart-candlestick"></i></div>
                        <div class="dropdown-text">
                            <span class="dropdown-title">Spot Trading Simulator</span>
                            <span class="dropdown-sub">Real-time order books, buy/sell limit & market execution</span>
                        </div>
                    </a>
                    <a href="#simulation-lab" class="dropdown-item ${currentHash === 'simulation-lab' ? 'active' : ''}" role="menuitem">
                        <div class="dropdown-icon lab-icon"><i class="fa-solid fa-flask-vial"></i></div>
                        <div class="dropdown-text">
                            <span class="dropdown-title">Simulation Stress Lab</span>
                            <span class="dropdown-sub">Test portfolios against market crashes & volatility</span>
                        </div>
                    </a>
                </div>
            </div>

            <!-- Learn Menu with Hover Dropdown -->
            <div class="nav-item nav-dropdown" id="nav-dropdown-learn">
                <a href="#learn" class="nav-link nav-dropdown-trigger ${isLearnActive ? 'active' : ''}" aria-haspopup="true" aria-expanded="false">
                    <i class="fa-solid fa-graduation-cap"></i>
                    <span>Learn</span>
                    <i class="fa-solid fa-chevron-down nav-arrow"></i>
                </a>
                <div class="nav-dropdown-menu" role="menu">
                    <a href="#learn" class="dropdown-item ${currentHash === 'learn' || currentHash === 'learning' ? 'active' : ''}" role="menuitem">
                        <div class="dropdown-icon academy-icon"><i class="fa-solid fa-book-open-reader"></i></div>
                        <div class="dropdown-text">
                            <span class="dropdown-title">Crypto Academy</span>
                            <span class="dropdown-sub">Step-by-step interactive courses, guides & analysis</span>
                        </div>
                    </a>
                    <a href="#safety-center" class="dropdown-item ${currentHash === 'safety-center' ? 'active' : ''}" role="menuitem">
                        <div class="dropdown-icon safety-icon"><i class="fa-solid fa-shield-halved"></i></div>
                        <div class="dropdown-text">
                            <span class="dropdown-title">Safety & Risk Center</span>
                            <span class="dropdown-sub">Scam prevention, private key safety, risk score analysis</span>
                        </div>
                    </a>
                    <a href="#support" class="dropdown-item ${currentHash === 'support' ? 'active' : ''}" role="menuitem">
                        <div class="dropdown-icon" style="background: rgba(22, 199, 132, 0.12); color: #16C784;"><i class="fa-solid fa-headset"></i></div>
                        <div class="dropdown-text">
                            <span class="dropdown-title">Help & Support Desk</span>
                            <span class="dropdown-sub">Raise tickets, report bugs, ask simulator questions</span>
                        </div>
                    </a>
                    <div class="dropdown-compliance-badge">
                        <i class="fa-solid fa-shield-check text-success"></i>
                        <span>100% Risk-Free Simulation &bull; CoinGecko Data Integration</span>
                    </div>
                </div>
            </div>

            <!-- Portfolio Menu Link (Logged-in users & guest simulator) -->
            <div class="nav-item">
                <a href="#portfolio" class="nav-link ${isPortfolioActive ? 'active' : ''}">
                    <i class="fa-solid fa-wallet"></i>
                    <span>Portfolio</span>
                </a>
            </div>

            ${isAdmin ? `
            <div class="nav-item">
                <a href="#admin" class="nav-link admin-link ${currentHash === 'admin' ? 'active' : ''}">
                    <i class="fa-solid fa-shield-crown"></i>
                    <span>Admin Control</span>
                </a>
            </div>
            ` : ''}
        `;

        if (desktopNav) desktopNav.innerHTML = desktopHtml;

        // Mobile Drawer: Categorized, touch-friendly, high contrast
        const mobileHtml = `
            <div class="drawer-nav-group">
                <div class="drawer-section-label">CoinGecko Market Hub</div>
                <a href="#cryptocurrencies" class="mobile-nav-link ${isCryptosActive ? 'active' : ''}">
                    <div class="mobile-nav-icon"><i class="fa-solid fa-coins"></i></div>
                    <div class="mobile-nav-meta">
                        <span class="mobile-nav-title">Cryptocurrencies</span>
                        <span class="mobile-nav-desc">Prices, rankings, 1h/24h/7d & sparklines</span>
                    </div>
                </a>
                <a href="#exchanges" class="mobile-nav-link ${isExchangesActive ? 'active' : ''}">
                    <div class="mobile-nav-icon" style="background: rgba(22, 199, 132, 0.15); color: #16C784;"><i class="fa-solid fa-repeat"></i></div>
                    <div class="mobile-nav-meta">
                        <span class="mobile-nav-title">Exchanges & Swaps</span>
                        <span class="mobile-nav-desc">Instant token swap & spot simulator</span>
                    </div>
                </a>
            </div>

            <div class="drawer-nav-group">
                <div class="drawer-section-label">Portfolio & Education</div>
                <a href="#portfolio" class="mobile-nav-link ${isPortfolioActive ? 'active' : ''}">
                    <div class="mobile-nav-icon portfolio-icon"><i class="fa-solid fa-wallet"></i></div>
                    <div class="mobile-nav-meta">
                        <span class="mobile-nav-title">Portfolio</span>
                        <span class="mobile-nav-desc">Virtual holdings, 30s cron charts & P&L</span>
                    </div>
                </a>
                <a href="#learn" class="mobile-nav-link ${isLearnActive ? 'active' : ''}">
                    <div class="mobile-nav-icon academy-icon"><i class="fa-solid fa-graduation-cap"></i></div>
                    <div class="mobile-nav-meta">
                        <span class="mobile-nav-title">Learn & Academy</span>
                        <span class="mobile-nav-desc">Crypto guides, safety & support</span>
                    </div>
                </a>
            </div>

            ${isAdmin ? `
            <div class="drawer-nav-group">
                <div class="drawer-section-label">System Administration</div>
                <a href="#admin" class="mobile-nav-link admin-link ${currentHash === 'admin' ? 'active' : ''}">
                    <div class="mobile-nav-icon admin-icon"><i class="fa-solid fa-shield-crown"></i></div>
                    <div class="mobile-nav-meta">
                        <span class="mobile-nav-title">Admin Control Panel</span>
                        <span class="mobile-nav-desc">Cloudflare navigation, bonus & audit</span>
                    </div>
                </a>
            </div>
            ` : ''}

            <!-- Store Compliance & Disclosures Card in Drawer -->
            <div class="drawer-compliance-card">
                <div class="compliance-header">
                    <i class="fa-solid fa-shield-halved text-success"></i>
                    <strong>Play Store & iOS App Store Compliant</strong>
                </div>
                <p>100% Risk-Free Simulated Education. No real currency or cryptocurrency transactions.</p>
            </div>
        `;

        if (mobileNav) mobileNav.innerHTML = mobileHtml;

        // Update Mobile Bottom Tab Bar active state
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            const navId = item.getAttribute('data-nav');
            if (navId === currentHash || (navId === 'simulator' && isTradeActive) || (navId === 'exchanges' && isExchangesActive) || (navId === 'cryptocurrencies' && isCryptosActive)) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },

    renderAuthActions() {
        const container = document.getElementById('auth-actions-container');
        const drawerUser = document.getElementById('drawer-user-section');
        const notifMenu = document.getElementById('notifications-menu-container');
        if (!container) return;

        const isAuth = State.currentUser && !State.isGuest;

        if (isAuth) {
            const user = State.currentUser;
            const walletCash = State.wallet ? State.wallet.availableCashUsd : 5000;
            const balanceFormatted = Currency.format(walletCash);

            if (notifMenu) notifMenu.classList.remove('hidden');

            container.innerHTML = `
                <div class="user-profile-menu" id="user-header-menu">
                    <div class="user-avatar-small" title="${user.full_name} (${user.role})">
                        ${user.username.charAt(0).toUpperCase()}
                    </div>
                    <div class="user-meta-pill" title="Current Wallet Balance">
                        <span class="user-name-label">${user.username}</span>
                        <span class="user-balance-label font-mono">${balanceFormatted}</span>
                    </div>
                    <button type="button" id="logout-btn" class="icon-action-btn logout-btn" title="Logout" aria-label="Logout">
                        <i class="fa-solid fa-arrow-right-from-bracket"></i>
                    </button>
                </div>
            `;

            if (drawerUser) {
                drawerUser.innerHTML = `
                    <div class="drawer-user-card">
                        <div class="user-avatar-small" style="width:44px;height:44px;font-size:1.2rem;">
                            ${user.username.charAt(0).toUpperCase()}
                        </div>
                        <div class="drawer-user-info-text">
                            <div class="drawer-user-name">${user.full_name}</div>
                            <div class="drawer-user-role">@${user.username} &bull; <span class="role-badge ${user.role}">${user.role.toUpperCase()}</span></div>
                            <div class="drawer-user-balance font-mono text-success">${balanceFormatted}</div>
                        </div>
                        <button type="button" class="btn btn-outline" id="drawer-logout-btn" title="Sign Out" style="padding:6px 12px;font-size:0.8rem;margin-left:auto;">
                            <i class="fa-solid fa-arrow-right-from-bracket"></i>
                        </button>
                    </div>
                `;
                document.getElementById('drawer-logout-btn')?.addEventListener('click', () => {
                    State.logout();
                    App.closeDrawer();
                    window.location.hash = '#dashboard';
                });
            }

            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.onclick = () => {
                    State.logout();
                    window.location.hash = '#dashboard';
                };
            }
        } else {
            if (notifMenu) notifMenu.classList.add('hidden');

            container.innerHTML = `
                <button type="button" class="btn-guest-pill" id="header-guest-btn" title="Quick Simulation Mode ($10,000 + 1 BTC Balance)">
                    <i class="fa-solid fa-user-secret"></i>
                    <span>Guest</span>
                </button>
                <button type="button" class="btn btn-outline btn-signin-nav" onclick="AuthModals.showLogin()">
                    Sign In
                </button>
                <button type="button" class="btn btn-primary btn-register-nav" onclick="AuthModals.showRegister()">
                    Register
                </button>
            `;

            if (drawerUser) {
                drawerUser.innerHTML = `
                    <div class="drawer-guest-card">
                        <div class="guest-card-top">
                            <span class="guest-badge"><i class="fa-solid fa-user-secret"></i> Guest Simulation</span>
                            <span class="guest-balance-hint font-mono">$10,000 + 1 BTC</span>
                        </div>
                        <p class="guest-card-desc">Practice real-time trading risk-free. Create an account to save your portfolio and trade history across devices.</p>
                        <div class="guest-card-actions">
                            <button type="button" class="btn btn-outline" onclick="AuthModals.showLogin(); App.closeDrawer();">Sign In</button>
                            <button type="button" class="btn btn-primary" onclick="AuthModals.showRegister(); App.closeDrawer();">Register & Claim $10k + 1 BTC</button>
                        </div>
                    </div>
                `;
            }

            const guestBtn = document.getElementById('header-guest-btn');
            if (guestBtn) {
                guestBtn.onclick = () => {
                    State.setGuest();
                    window.location.hash = '#simulator';
                };
            }
        }
    },

    setupMobileDrawer() {
        const toggleBtn = document.getElementById('mobile-menu-toggle');
        const closeBtn = document.getElementById('close-drawer-btn');
        const drawer = document.getElementById('mobile-drawer');
        const overlay = document.getElementById('mobile-drawer-overlay');

        const openDrawer = () => {
            drawer.classList.add('open');
            overlay.classList.remove('hidden');
        };

        this.closeDrawer = () => {
            drawer.classList.remove('open');
            overlay.classList.add('hidden');
        };

        if (toggleBtn) toggleBtn.onclick = openDrawer;
        if (closeBtn) closeBtn.onclick = this.closeDrawer;
        if (overlay) overlay.onclick = this.closeDrawer;

        // Auto-close drawer on link navigation
        document.getElementById('mobile-nav-links')?.addEventListener('click', (e) => {
            if (e.target.closest('a')) {
                this.closeDrawer();
            }
        });
    },

    setupNotifications() {
        const btn = document.getElementById('notifications-btn');
        if (btn) {
            btn.onclick = () => NotificationsView.showModal();
        }
    },

    async route() {
        const hash = window.location.hash.slice(1) || 'cryptocurrencies';
        const parts = hash.split('?');
        const routePath = parts[0];
        const queryParams = new URLSearchParams(parts[1] || '');

        const container = document.getElementById('view-container');
        if (!container) return;

        if (this.closeDrawer) this.closeDrawer();
        window.scrollTo({ top: 0, behavior: 'smooth' });

        this.renderNav();

        if (typeof PortfolioView !== 'undefined' && PortfolioView.stopCron) {
            PortfolioView.stopCron();
        }

        if (routePath === 'cryptocurrencies' || routePath === 'markets' || routePath === 'dashboard' || routePath === '') {
            await MarketsView.render(container, queryParams);
        } else if (routePath.startsWith('crypto/')) {
            const symbol = routePath.split('/')[1];
            await CryptoDetailView.render(container, symbol);
        } else if (routePath === 'exchanges') {
            await SwapView.render(container, { fromCoin: queryParams.get('from'), toCoin: queryParams.get('to') });
        } else if (routePath === 'swap') {
            await SwapView.render(container, { fromCoin: queryParams.get('from'), toCoin: queryParams.get('to') });
        } else if (routePath === 'simulator') {
            const preselectedCoin = queryParams.get('coin');
            await SimulatorView.render(container, preselectedCoin);
        } else if (routePath === 'portfolio') {
            await PortfolioView.render(container);
        } else if (routePath === 'learn' || routePath === 'learning') {
            await LearningView.render(container);
        } else if (routePath.startsWith('learn/') || routePath.startsWith('learning/')) {
            const courseSlug = routePath.split('/')[1];
            await LearningView.render(container, courseSlug);
        } else if (routePath === 'simulation-lab') {
            await SimulationLabView.render(container);
        } else if (routePath === 'safety-center') {
            await SafetyCenterView.render(container);
        } else if (routePath === 'support' || routePath === 'help') {
            await SupportView.render(container, queryParams.get('tab') || 'raise');
        } else if (routePath === 'admin') {
            await AdminView.render(container, queryParams.get('tab') || 'overview');
        } else {
            // Default fallback to CoinGecko Cryptocurrencies list
            await MarketsView.render(container, queryParams);
        }
    }
};

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.App = App;

