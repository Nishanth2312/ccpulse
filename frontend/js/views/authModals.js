/**
 * CCPulse Authentication & Welcome Bonus Modals
 * Compliant with Modern Web Guidance using native <dialog>
 */
const AuthModals = {
    host: null,

    init() {
        this.host = document.getElementById('modals-host');
    },

    createModal(id, contentHtml) {
        let dialog = document.getElementById(id);
        if (!dialog) {
            dialog = document.createElement('dialog');
            dialog.id = id;
            dialog.setAttribute('closedby', 'any');
            this.host.appendChild(dialog);

            // Light dismiss fallback per Modern Web Guidance
            dialog.addEventListener('click', (e) => {
                const rect = dialog.getBoundingClientRect();
                const isInDialog = (
                    rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
                    rect.left <= e.clientX && e.clientX <= rect.left + rect.width
                );
                if (!isInDialog) {
                    dialog.close();
                }
            });
        }

        dialog.innerHTML = contentHtml;

        const closeBtn = dialog.querySelector('.modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => dialog.close());
        }

        return dialog;
    },

    showLogin() {
        const dialog = this.createModal('login-dialog', `
            <div class="modal-header">
                <h3><i class="fa-solid fa-right-to-bracket text-cyan"></i> Sign in to CCPulse</h3>
                <button type="button" class="modal-close-btn" aria-label="Close dialog"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <form id="login-form">
                <div class="modal-body">
                    <div id="login-error-msg" class="form-error hidden" style="color: var(--color-danger); font-size: 0.88rem; background: rgba(239, 68, 68, 0.1); padding: 8px 12px; border-radius: 6px;"></div>

                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <label for="login-email" style="font-size: 0.88rem; font-weight: 600;">Email or Username</label>
                        <input type="text" id="login-email" required placeholder="trader@ccpulse.com" autocomplete="username">
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <label for="login-password" style="font-size: 0.88rem; font-weight: 600;">Password</label>
                            <a href="#" id="forgot-password-link" style="font-size: 0.8rem; color: var(--color-primary);">Forgot password?</a>
                        </div>
                        <input type="password" id="login-password" required placeholder="••••••••" autocomplete="current-password">
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="login-remember" checked>
                        <label for="login-remember" style="font-size: 0.85rem; color: var(--text-secondary);">Remember this device</label>
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 8px;">
                        <i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In
                    </button>

                    <div style="position: relative; text-align: center; margin: 10px 0;">
                        <hr style="border: none; border-top: 1px solid var(--border-color);">
                        <span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: var(--bg-surface); padding: 0 10px; font-size: 0.78rem; color: var(--text-muted);">OR</span>
                    </div>

                    <button type="button" id="login-continue-guest-btn" class="btn btn-guest" style="width: 100%;">
                        <i class="fa-solid fa-user-secret"></i> Continue as Guest
                    </button>
                </div>
                <div class="modal-footer" style="justify-content: center;">
                    <span style="font-size: 0.88rem; color: var(--text-secondary);">
                        Don't have an account? <a href="#" id="switch-to-register" style="color: var(--color-primary); font-weight: 600;">Create Account</a>
                    </span>
                </div>
            </form>
        `);

        // Event Listeners
        const form = dialog.querySelector('#login-form');
        const errorBox = dialog.querySelector('#login-error-msg');

        form.onsubmit = async (e) => {
            e.preventDefault();
            errorBox.classList.add('hidden');
            const email = dialog.querySelector('#login-email').value;
            const password = dialog.querySelector('#login-password').value;
            const remember_me = dialog.querySelector('#login-remember').checked;

            try {
                const res = await API.auth.login({ email, password, remember_me });
                State.setAuth(res.user, res.token, res.wallet);
                dialog.close();
                window.location.hash = res.user.role === 'admin' ? '#admin' : '#portfolio';
            } catch (err) {
                errorBox.textContent = err.message;
                errorBox.classList.remove('hidden');
            }
        };

        dialog.querySelector('#switch-to-register').onclick = (e) => {
            e.preventDefault();
            dialog.close();
            this.showRegister();
        };

        dialog.querySelector('#login-continue-guest-btn').onclick = () => {
            State.setGuest();
            dialog.close();
        };

        dialog.querySelector('#forgot-password-link').onclick = (e) => {
            e.preventDefault();
            dialog.close();
            this.showForgotPassword();
        };

        dialog.showModal();
    },

    showRegister() {
        const dialog = this.createModal('register-dialog', `
            <div class="modal-header">
                <h3><i class="fa-solid fa-user-plus text-cyan"></i> Create CCPulse Account</h3>
                <button type="button" class="modal-close-btn" aria-label="Close dialog"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <form id="register-form">
                <div class="modal-body">
                    <!-- Bonus Callout -->
                    <div style="background: rgba(16, 185, 129, 0.1); border: 1px dashed var(--color-success); border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 12px;">
                        <i class="fa-solid fa-gift" style="font-size: 1.5rem; color: var(--color-success);"></i>
                        <div>
                            <div style="font-weight: 700; font-size: 0.95rem; color: var(--color-success);">$10,000 USD + 1.0 Bitcoin Welcome Bonus</div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">Receive $10,000 virtual cash and 1 full Bitcoin credited upon registration!</div>
                        </div>
                    </div>

                    <div id="register-error-msg" class="form-error hidden" style="color: var(--color-danger); font-size: 0.88rem; background: rgba(239, 68, 68, 0.1); padding: 8px 12px; border-radius: 6px;"></div>

                    <div class="responsive-form-row">
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <label for="reg-fullname" style="font-size: 0.85rem; font-weight: 600;">Full Name</label>
                            <input type="text" id="reg-fullname" required placeholder="Alex Rivera" autocomplete="name">
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <label for="reg-username" style="font-size: 0.85rem; font-weight: 600;">Username</label>
                            <input type="text" id="reg-username" required placeholder="cryptomaster" autocomplete="username">
                        </div>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <label for="reg-email" style="font-size: 0.85rem; font-weight: 600;">Email Address</label>
                        <input type="email" id="reg-email" required placeholder="alex@example.com" autocomplete="email">
                    </div>

                    <div class="responsive-form-row">
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <label for="reg-password" style="font-size: 0.85rem; font-weight: 600;">Password</label>
                            <input type="password" id="reg-password" required placeholder="Min 8 chars" autocomplete="new-password">
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <label for="reg-confirm-password" style="font-size: 0.85rem; font-weight: 600;">Confirm Password</label>
                            <input type="password" id="reg-confirm-password" required placeholder="Repeat password" autocomplete="new-password">
                        </div>
                    </div>

                    <div style="display: flex; align-items: flex-start; gap: 8px; margin-top: 4px;">
                        <input type="checkbox" id="reg-terms" required style="margin-top: 3px;">
                        <label for="reg-terms" style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4;">
                            I accept the terms & conditions and acknowledge that CCPulse is an educational simulation platform without real money risk.
                        </label>
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 8px;">
                        <i class="fa-solid fa-gift"></i> Create Account & Claim $10,000 + 1 BTC Bonus
                    </button>
                </div>
                <div class="modal-footer" style="justify-content: center;">
                    <span style="font-size: 0.88rem; color: var(--text-secondary);">
                        Already have an account? <a href="#" id="switch-to-login" style="color: var(--color-primary); font-weight: 600;">Sign In</a>
                    </span>
                </div>
            </form>
        `);

        const form = dialog.querySelector('#register-form');
        const errorBox = dialog.querySelector('#register-error-msg');

        form.onsubmit = async (e) => {
            e.preventDefault();
            errorBox.classList.add('hidden');

            const full_name = dialog.querySelector('#reg-fullname').value;
            const username = dialog.querySelector('#reg-username').value;
            const email = dialog.querySelector('#reg-email').value;
            const password = dialog.querySelector('#reg-password').value;
            const confirm_password = dialog.querySelector('#reg-confirm-password').value;
            const terms_accepted = dialog.querySelector('#reg-terms').checked;

            try {
                const res = await API.auth.register({
                    full_name,
                    username,
                    email,
                    password,
                    confirm_password,
                    terms_accepted
                });

                State.setAuth(res.user, res.token, res.wallet);
                dialog.close();

                // Immediately display celebratory Welcome Bonus Modal!
                this.showWelcomeBonusCelebration(res.welcomeBonusAmount || 5000);
            } catch (err) {
                errorBox.textContent = err.message;
                errorBox.classList.remove('hidden');
            }
        };

        dialog.querySelector('#switch-to-login').onclick = (e) => {
            e.preventDefault();
            dialog.close();
            this.showLogin();
        };

        dialog.showModal();
    },

    showWelcomeBonusCelebration(amountUsd = 5000) {
        const converted = Currency.format(amountUsd);
        const dialog = this.createModal('welcome-bonus-dialog', `
            <div class="welcome-bonus-card" style="margin-bottom: 0; border: none; padding: 32px 24px;">
                <div class="welcome-icon"><i class="fa-solid fa-award"></i></div>
                <h2 style="font-size: 1.6rem; font-weight: 800; margin-bottom: 8px; color: var(--text-primary);">
                    Welcome to CCPulse!
                </h2>
                <div class="welcome-bonus-amount">${converted}</div>
                <div style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 16px;">
                    Base Equivalent: $${Number(amountUsd).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                </div>
                <p style="font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary); max-width: 440px; margin: 0 auto 24px;">
                    Your $10,000 virtual trading cash and 1.0 Bitcoin bonus are ready in your wallet! Start learning, explore the markets, and practice trading without risking real money.
                </p>
                <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                    <button type="button" id="welcome-trade-btn" class="btn btn-primary">
                        <i class="fa-solid fa-chart-line"></i> Start Trading Simulator
                    </button>
                    <button type="button" id="welcome-learn-btn" class="btn btn-outline">
                        <i class="fa-solid fa-graduation-cap"></i> Explore Academy
                    </button>
                </div>
            </div>
        `);

        dialog.querySelector('#welcome-trade-btn').onclick = () => {
            dialog.close();
            window.location.hash = '#simulator';
        };

        dialog.querySelector('#welcome-learn-btn').onclick = () => {
            dialog.close();
            window.location.hash = '#learning';
        };

        dialog.showModal();
    },

    showForgotPassword() {
        const dialog = this.createModal('forgot-dialog', `
            <div class="modal-header">
                <h3><i class="fa-solid fa-key text-cyan"></i> Password Recovery</h3>
                <button type="button" class="modal-close-btn" aria-label="Close dialog"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <form id="forgot-form">
                <div class="modal-body">
                    <p style="font-size: 0.9rem; color: var(--text-secondary);">
                        Enter the email address registered with your account to receive a secure password reset link.
                    </p>
                    <div id="forgot-status-msg" class="hidden" style="padding: 10px; border-radius: 6px; font-size: 0.88rem;"></div>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <label for="forgot-email" style="font-size: 0.88rem; font-weight: 600;">Email Address</label>
                        <input type="email" id="forgot-email" required placeholder="alex@example.com">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 8px;">
                        Send Password Reset Link
                    </button>
                </div>
            </form>
        `);

        const form = dialog.querySelector('#forgot-form');
        const statusBox = dialog.querySelector('#forgot-status-msg');

        form.onsubmit = async (e) => {
            e.preventDefault();
            const email = dialog.querySelector('#forgot-email').value;
            try {
                const res = await API.auth.forgotPassword(email);
                statusBox.style.background = 'rgba(16, 185, 129, 0.1)';
                statusBox.style.color = 'var(--color-success)';
                statusBox.textContent = res.message;
                statusBox.classList.remove('hidden');
            } catch (err) {
                statusBox.style.background = 'rgba(239, 68, 68, 0.1)';
                statusBox.style.color = 'var(--color-danger)';
                statusBox.textContent = err.message;
                statusBox.classList.remove('hidden');
            }
        };

        dialog.showModal();
    }
};

window.AuthModals = AuthModals;

