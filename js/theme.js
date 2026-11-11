/**
 * CCPulse Theme Management System
 * Compliant with Modern Web Guidance for dark mode, light mode, and system default.
 */
const Theme = {
    modes: ['dark', 'light', 'system'],

    getCurrent() {
        return State.theme || 'dark';
    },

    setTheme(theme) {
        this.apply(theme);
    },

    getResolvedTheme(theme = null) {
        const mode = theme || this.getCurrent();
        if (mode === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return mode;
    },

    apply(theme) {
        State.setTheme(theme);
        const resolved = this.getResolvedTheme(theme);

        const html = document.documentElement;
        html.setAttribute('data-theme', resolved);

        const meta = document.querySelector('meta[name="color-scheme"]');
        if (meta) {
            meta.content = theme === 'system' ? 'light dark' : theme;
        }

        // Update Theme Toggle Icon in Header
        const icon = document.getElementById('theme-icon');
        if (icon) {
            if (theme === 'dark') {
                icon.className = 'fa-solid fa-moon';
            } else if (theme === 'light') {
                icon.className = 'fa-solid fa-sun';
            } else {
                icon.className = 'fa-solid fa-circle-half-stroke';
            }
        }

        // Persist to user preferences if logged in
        if (State.currentUser && !State.isGuest) {
            API.auth.updatePreferences({ theme }).catch(() => {});
        }
    },

    toggle() {
        const current = this.getCurrent();
        let next;
        if (current === 'dark') next = 'light';
        else if (current === 'light') next = 'system';
        else next = 'dark';

        this.apply(next);
    },

    init() {
        this.apply(this.getCurrent());

        // Header Toggle Button
        const toggleBtn = document.getElementById('theme-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }

        // Listen for OS system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (this.getCurrent() === 'system') {
                this.apply('system');
            }
        });
    }
};

window.Theme = Theme;

