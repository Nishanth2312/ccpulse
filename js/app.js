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
        const currentHash = window.location.hash.slice(1).split('/')[0] || 'dashboard';

        let navItems = [];

        if (isAdmin) {
            // Administrator Navigation (Section 8)
            navItems = [
                { id: 'dashboard', label: 'Dashboard', icon: 'fa-house' },
                { id: 'markets', label: 'Markets', icon: 'fa-chart-line' },
                { id: 'simulator', label: 'Simulator', icon: 'fa-bolt' },
                { id: 'portfolio', label: 'My Portfolio', icon: 'fa-wallet' },
                { id: 'admin', label: 'Admin Control', icon: 'fa-shield-halved', isAdmin: true }
            ];
        } else if (isAuth) {
            // Authenticated User Navigation (Section 8)
            navItems = [
                { id: 'dashboard', label: 'Dashboard', icon: 'fa-house' },
                { id: 'markets', label: 'Markets', icon: 'fa-chart-line' },
                { id: 'simulator', label: 'Trading Simulator', icon: 'fa-bolt' },
                { id: 'portfolio', label: 'My Portfolio', icon: 'fa-wallet' },
                { id: 'learning', label: 'Academy', icon: 'fa-graduation-cap' },
                { id: 'simulation-lab', label: 'Simulation Lab', icon: 'fa-flask-vial' },
                { id: 'safety-center', label: 'Safety Center', icon: 'fa-shield-halved' }
            ];
        } else {
            // Public Navigation (Section 8)
            navItems = [
                { id: 'dashboard', label: 'Dashboard', icon: 'fa-house' },
                { id: 'markets', label: 'Markets', icon: 'fa-chart-line' },
                { id: 'simulator', label: 'Simulator (Guest)', icon: 'fa-bolt' },
                { id: 'learning', label: 'Learning Academy', icon: 'fa-graduation-cap' },
                { id: 'simulation-lab', label: 'Simulation Lab', icon: 'fa-flask-vial' },
                { id: 'safety-center', label: 'Safety Center', icon: 'fa-shield-halved' }
            ];
        }

        const navHtml = navItems.map(item => `
            <a href="#${item.id}" class="nav-link ${currentHash === item.id ? 'active' : ''} ${item.isAdmin ? 'admin-link' : ''}">
                <i class="fa-solid ${item.icon}"></i> ${item.label}
            </a>
        `).join('');

        if (desktopNav) desktopNav.innerHTML = navHtml;

        const mobileHtml = navItems.map(item => `
            <a href="#${item.id}" class="mobile-nav-link ${currentHash === item.id ? 'active' : ''}">
                <i class="fa-solid ${item.icon}"></i> ${item.label}
            </a>
        `).join('');

        if (mobileNav) mobileNav.innerHTML = mobileHtml;
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
                    <div class="user-avatar-small">${user.username.charAt(0).toUpperCase()}</div>
                    <span class="user-balance-pill">${balanceFormatted}</span>
                    <button type="button" id="logout-btn" class="icon-action-btn" title="Logout" style="width:28px;height:28px;border:none;background:transparent;">
                        <i class="fa-solid fa-arrow-right-from-bracket"></i>
                    </button>
                </div>
            `;

            if (drawerUser) {
                drawerUser.innerHTML = `
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div class="user-avatar-small" style="width:40px;height:40px;font-size:1.1rem;">
                            ${user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight:700;">${user.full_name}</div>
                            <div style="font-size:0.8rem;color:var(--text-muted);">@${user.username} &bull; ${user.role.toUpperCase()}</div>
                            <div class="font-mono text-success" style="font-weight:700;font-size:0.9rem;margin-top:2px;">
                                ${balanceFormatted}
                            </div>
                        </div>
                    </div>
                `;
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
                <button type="button" class="btn btn-guest" id="header-guest-btn">
                    <i class="fa-solid fa-user-secret"></i> Guest
                </button>
                <button type="button" class="btn btn-outline" onclick="AuthModals.showLogin()">
                    Sign In
                </button>
                <button type="button" class="btn btn-primary" onclick="AuthModals.showRegister()">
                    Register
                </button>
            `;

            if (drawerUser) {
                drawerUser.innerHTML = `
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        <div style="font-weight:700;font-size:0.95rem;">Exploring as Guest</div>
                        <div style="font-size:0.8rem;color:var(--text-muted);">$5,000 temporary trading simulation</div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:4px;">
                            <button type="button" class="btn btn-outline" onclick="AuthModals.showLogin(); App.closeDrawer();" style="font-size:0.8rem;padding:6px;">Sign In</button>
                            <button type="button" class="btn btn-primary" onclick="AuthModals.showRegister(); App.closeDrawer();" style="font-size:0.8rem;padding:6px;">Register</button>
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

