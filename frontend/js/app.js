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
        const currentHash = window.location.hash.slice(1).split('?')[0].split('/')[0] || 'dashboard';

        const isTradeActive = ['simulator', 'portfolio', 'simulation-lab'].includes(currentHash);
        const isLearnActive = ['learning', 'safety-center'].includes(currentHash);

        // Desktop Navigation: Clean, spacious with hover dropdown menus
        const desktopHtml = `
            <div class="nav-item">
                <a href="#dashboard" class="nav-link ${currentHash === 'dashboard' ? 'active' : ''}">
                    <i class="fa-solid fa-house"></i>
                    <span>Dashboard</span>
                </a>
            </div>

            <div class="nav-item">
                <a href="#markets" class="nav-link ${currentHash === 'markets' ? 'active' : ''}">
                    <i class="fa-solid fa-chart-line"></i>
                    <span>Markets</span>
                </a>
            </div>

            <!-- Trade & Simulation Hover Dropdown -->
            <div class="nav-item nav-dropdown" id="nav-dropdown-trade">
                <a href="#simulator" class="nav-link nav-dropdown-trigger ${isTradeActive ? 'active' : ''}" aria-haspopup="true" aria-expanded="false">
                    <i class="fa-solid fa-bolt"></i>
                    <span>Trade</span>
                    <i class="fa-solid fa-chevron-down nav-arrow"></i>
                </a>
                <div class="nav-dropdown-menu" role="menu">
                    <a href="#simulator" class="dropdown-item ${currentHash === 'simulator' ? 'active' : ''}" role="menuitem">
                        <div class="dropdown-icon trade-icon"><i class="fa-solid fa-chart-candlestick"></i></div>
                        <div class="dropdown-text">
                            <span class="dropdown-title">Virtual Simulator</span>
                            <span class="dropdown-sub">Real-time order books, buy/sell limit & market execution</span>
                        </div>
                    </a>
                    <a href="#portfolio" class="dropdown-item ${currentHash === 'portfolio' ? 'active' : ''}" role="menuitem">
                        <div class="dropdown-icon portfolio-icon"><i class="fa-solid fa-wallet"></i></div>
                        <div class="dropdown-text">
                            <span class="dropdown-title">My Portfolio</span>
                            <span class="dropdown-sub">Asset allocation, virtual equity & live P&L</span>
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

            <!-- Learn & Safety Hover Dropdown -->
            <div class="nav-item nav-dropdown" id="nav-dropdown-learn">
                <a href="#learning" class="nav-link nav-dropdown-trigger ${isLearnActive ? 'active' : ''}" aria-haspopup="true" aria-expanded="false">
                    <i class="fa-solid fa-graduation-cap"></i>
                    <span>Academy & Safety</span>
                    <i class="fa-solid fa-chevron-down nav-arrow"></i>
                </a>
                <div class="nav-dropdown-menu" role="menu">
                    <a href="#learning" class="dropdown-item ${currentHash === 'learning' ? 'active' : ''}" role="menuitem">
                        <div class="dropdown-icon academy-icon"><i class="fa-solid fa-book-open-reader"></i></div>
                        <div class="dropdown-text">
                            <span class="dropdown-title">Learning Academy</span>
                            <span class="dropdown-sub">Step-by-step interactive cryptocurrency & blockchain modules</span>
                        </div>
                    </a>
                    <a href="#safety-center" class="dropdown-item ${currentHash === 'safety-center' ? 'active' : ''}" role="menuitem">
                        <div class="dropdown-icon safety-icon"><i class="fa-solid fa-shield-halved"></i></div>
                        <div class="dropdown-text">
                            <span class="dropdown-title">Safety & Risk Center</span>
                            <span class="dropdown-sub">Scam prevention, private key safety, risk score analysis</span>
                        </div>
                    </a>
                    <div class="dropdown-compliance-badge">
                        <i class="fa-solid fa-shield-check text-success"></i>
                        <span>Play Store & iOS App Store Compliant &bull; 100% Risk-Free Sim</span>
                    </div>
                </div>
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
                <div class="drawer-section-label">Core Navigation</div>
                <a href="#dashboard" class="mobile-nav-link ${currentHash === 'dashboard' ? 'active' : ''}">
                    <div class="mobile-nav-icon"><i class="fa-solid fa-house"></i></div>
                    <div class="mobile-nav-meta">
                        <span class="mobile-nav-title">Dashboard</span>
                        <span class="mobile-nav-desc">Market summary & live showcase</span>
                    </div>
                </a>
                <a href="#markets" class="mobile-nav-link ${currentHash === 'markets' ? 'active' : ''}">
                    <div class="mobile-nav-icon"><i class="fa-solid fa-chart-line"></i></div>
                    <div class="mobile-nav-meta">
                        <span class="mobile-nav-title">Cryptocurrency Markets</span>
                        <span class="mobile-nav-desc">Live rates, market cap & filters</span>
                    </div>
                </a>
            </div>

            <div class="drawer-nav-group">
                <div class="drawer-section-label">Simulated Trading</div>
                <a href="#simulator" class="mobile-nav-link ${currentHash === 'simulator' ? 'active' : ''}">
                    <div class="mobile-nav-icon trade-icon"><i class="fa-solid fa-bolt"></i></div>
                    <div class="mobile-nav-meta">
                        <span class="mobile-nav-title">Virtual Simulator</span>
                        <span class="mobile-nav-desc">Order books, buy/sell simulation</span>
                    </div>
                </a>
                <a href="#portfolio" class="mobile-nav-link ${currentHash === 'portfolio' ? 'active' : ''}">
                    <div class="mobile-nav-icon portfolio-icon"><i class="fa-solid fa-wallet"></i></div>
                    <div class="mobile-nav-meta">
                        <span class="mobile-nav-title">Virtual Portfolio</span>
                        <span class="mobile-nav-desc">Holdings, performance & P&L</span>
                    </div>
                </a>
                <a href="#simulation-lab" class="mobile-nav-link ${currentHash === 'simulation-lab' ? 'active' : ''}">
                    <div class="mobile-nav-icon lab-icon"><i class="fa-solid fa-flask-vial"></i></div>
                    <div class="mobile-nav-meta">
                        <span class="mobile-nav-title">Simulation Stress Lab</span>
                        <span class="mobile-nav-desc">Scenario generator & stress test</span>
                    </div>
                </a>
            </div>

            <div class="drawer-nav-group">
                <div class="drawer-section-label">Education & Safety</div>
                <a href="#learning" class="mobile-nav-link ${currentHash === 'learning' ? 'active' : ''}">
                    <div class="mobile-nav-icon academy-icon"><i class="fa-solid fa-graduation-cap"></i></div>
                    <div class="mobile-nav-meta">
                        <span class="mobile-nav-title">Learning Academy</span>
                        <span class="mobile-nav-desc">Interactive blockchain courses</span>
                    </div>
                </a>
                <a href="#safety-center" class="mobile-nav-link ${currentHash === 'safety-center' ? 'active' : ''}">
                    <div class="mobile-nav-icon safety-icon"><i class="fa-solid fa-shield-halved"></i></div>
                    <div class="mobile-nav-meta">
                        <span class="mobile-nav-title">Safety & Risk Center</span>
                        <span class="mobile-nav-desc">Scam defense & security scores</span>
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
                        <span class="mobile-nav-desc">Coin manager, audit & metrics</span>
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
            if (navId === currentHash || (navId === 'simulator' && isTradeActive)) {
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
                <button type="button" class="btn-guest-pill" id="header-guest-btn" title="Quick Simulation Mode ($5,000 Balance)">
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
                            <span class="guest-balance-hint font-mono">$5,000.00 Balance</span>
                        </div>
                        <p class="guest-card-desc">Practice real-time trading risk-free. Create an account to save your portfolio and trade history across devices.</p>
                        <div class="guest-card-actions">
                            <button type="button" class="btn btn-outline" onclick="AuthModals.showLogin(); App.closeDrawer();">Sign In</button>
                            <button type="button" class="btn btn-primary" onclick="AuthModals.showRegister(); App.closeDrawer();">Register & Claim $5,000</button>
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
        const hash = window.location.hash.slice(1) || 'dashboard';
        const parts = hash.split('?');
        const routePath = parts[0];
        const queryParams = new URLSearchParams(parts[1] || '');

        const container = document.getElementById('view-container');
        if (!container) return;

        if (this.closeDrawer) this.closeDrawer();
        window.scrollTo({ top: 0, behavior: 'smooth' });

        this.renderNav();

        if (routePath === 'dashboard' || routePath === '') {
            await DashboardView.render(container);
        } else if (routePath === 'markets') {
            await MarketsView.render(container);
        } else if (routePath.startsWith('crypto/')) {
            const symbol = routePath.split('/')[1];
            await CryptoDetailView.render(container, symbol);
        } else if (routePath === 'simulator') {
            const preselectedCoin = queryParams.get('coin');
            await SimulatorView.render(container, preselectedCoin);
        } else if (routePath === 'portfolio') {
            await PortfolioView.render(container);
        } else if (routePath === 'learning') {
            await LearningView.render(container);
        } else if (routePath.startsWith('learning/')) {
            const courseSlug = routePath.split('/')[1];
            await LearningView.render(container, courseSlug);
        } else if (routePath === 'simulation-lab') {
            await SimulationLabView.render(container);
        } else if (routePath === 'safety-center') {
            await SafetyCenterView.render(container);
        } else if (routePath === 'admin') {
            await AdminView.render(container, queryParams.get('tab') || 'overview');
        } else {
            // Default fallback to dashboard
            await DashboardView.render(container);
        }
    }
};

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.App = App;

