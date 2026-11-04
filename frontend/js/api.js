/**
 * CCPulse Unified API Client
 */
const API = {
    baseUrl: '/api',

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (State.token) {
            headers['Authorization'] = `Bearer ${State.token}`;
        }

        try {
            const res = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const errMsg = data.error || `HTTP ${res.status}: ${res.statusText}`;
                throw new Error(errMsg);
            }

            return data;
        } catch (err) {
            console.error(`API Error [${endpoint}]:`, err.message);
            throw err;
        }
    },

    // Auth
    auth: {
        login: (credentials) => API.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
        register: (formData) => API.request('/auth/register', { method: 'POST', body: JSON.stringify(formData) }),
        me: () => API.request('/auth/me'),
        guest: () => API.request('/auth/guest', { method: 'POST' }),
        forgotPassword: (email) => API.request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
        resetPassword: (payload) => API.request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
        updatePreferences: (prefs) => API.request('/auth/preferences', { method: 'POST', body: JSON.stringify(prefs) })
    },

    // Cryptocurrencies
    cryptos: {
        list: () => API.request('/cryptos'),
        get: (symbolOrSlug) => API.request(`/cryptos/${symbolOrSlug}`),
        getChart: (id, timeframe = '1D') => API.request(`/cryptos/${id}/chart?timeframe=${timeframe}`),
        getOrderBook: (id) => API.request(`/cryptos/${id}/orderbook`),
        getWatchlist: () => API.request('/cryptos/watchlist/user'),
        toggleWatchlist: (crypto_id) => API.request('/cryptos/watchlist/toggle', { method: 'POST', body: JSON.stringify({ crypto_id }) })
    },

    // Simulator
    simulator: {
        trade: (tradeData) => API.request('/simulator/trade', { method: 'POST', body: JSON.stringify(tradeData) }),
        getPortfolio: () => API.request('/simulator/portfolio'),
        getTrades: () => API.request('/simulator/trades')
    },

    // Currency
    currency: {
        getStatus: () => API.request('/currency/status'),
        convert: (amount, currency) => API.request(`/currency/convert?amount=${amount}&currency=${currency}`),
        refreshRates: () => API.request('/currency/refresh', { method: 'POST' }),
        adminUpdateRate: (code, data) => API.request(`/currency/${code}`, { method: 'PUT', body: JSON.stringify(data) })
    },

    // Admin
    admin: {
        getOverview: () => API.request('/admin/overview'),
        getCryptos: () => API.request('/admin/cryptos'),
        addCrypto: (data) => API.request('/admin/cryptos', { method: 'POST', body: JSON.stringify(data) }),
        updateCrypto: (id, data) => API.request(`/admin/cryptos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        deleteCrypto: (id) => API.request(`/admin/cryptos/${id}`, { method: 'DELETE' }),
        getUsers: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return API.request(`/admin/users?${query}`);
        },
        updateUserStatus: (id, statusData) => API.request(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify(statusData) }),
        resetUserPassword: (id, data) => API.request(`/admin/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify(data) }),
        getUserActivity: (id) => API.request(`/admin/users/${id}/activity`),
        grantBalance: (data) => API.request('/admin/balances/grant', { method: 'POST', body: JSON.stringify(data) }),
        deductBalance: (data) => API.request('/admin/balances/deduct', { method: 'POST', body: JSON.stringify(data) }),
        getBonusHistory: () => API.request('/admin/bonus-history'),
        getAuditLogs: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return API.request(`/admin/audit-logs?${query}`);
        },
        getSettings: () => API.request('/admin/settings'),
        updateSettings: (settings) => API.request('/admin/settings', { method: 'PUT', body: JSON.stringify(settings) })
    },

    // Learning
    learning: {
        getCourses: () => API.request('/learning/courses'),
        getCourse: (slug) => API.request(`/learning/courses/${slug}`),
        updateProgress: (data) => API.request('/learning/progress', { method: 'POST', body: JSON.stringify(data) })
    },

    // Notifications
    notifications: {
        list: () => API.request('/notifications'),
        markRead: (id) => API.request(`/notifications/${id}/read`, { method: 'PUT' }),
        markAllRead: () => API.request('/notifications/mark-all-read', { method: 'POST' })
    },

    // Simulation Lab
    simulationLab: {
        getScenarios: () => API.request('/simulation-lab/scenarios'),
        simulate: (scenarioId) => API.request('/simulation-lab/simulate', { method: 'POST', body: JSON.stringify({ scenario_id: scenarioId }) })
    }
};

window.API = API;

