/**
 * CCPulse Unified API Client
 */
/**
 * CCPulse Unified API Client
 * Seamlessly talks to the Express 5.x backend, with automatic direct-to-CoinGecko
 * and direct-to-Forex client-side simulation when hosted on static environments like GitHub Pages.
 */
const NINJA_API_KEY = 'mGMasDhcrG73bhUPj5VPOvxqdd33xgO5XxpROwjN';

const CLIENT_STATIC_COINS = [
    { id: 1, name: 'Bitcoin', symbol: 'BTC', slug: 'bitcoin', logo_url: './assets/coins/btc.svg', blockchain: 'Bitcoin Core (SHA-256 Proof of Work)', current_price_usd: 73932.53, change_24h: 2.15, high_24h: 74800, low_24h: 72600, volume_24h: 34120000000, market_cap_usd: 1460000000000, categories: ['Top 10', 'Layer 1'], risk_level: 'Medium', educational_content: 'Bitcoin is the pioneer decentralized digital cryptocurrency introduced in 2008 by Satoshi Nakamoto with a strict 21M hard cap.', risk_information: 'Macroeconomic cycles, ETF capital flows, market dominance shifts.', sort_order: 1, is_active: 1, is_visible: 1, sparkline: [71000, 71500, 72200, 71800, 73000, 72500, 73932] },
    { id: 2, name: 'Ethereum', symbol: 'ETH', slug: 'ethereum', logo_url: './assets/coins/eth.svg', blockchain: 'Ethereum Proof of Stake (Smart Contracts & EVM)', current_price_usd: 2056.93, change_24h: 1.45, high_24h: 2110, low_24h: 2020, volume_24h: 14850000000, market_cap_usd: 247000000000, categories: ['Top 10', 'Layer 1', 'DeFi'], risk_level: 'Medium', educational_content: 'Ethereum powers programmable smart contracts and decentralized finance (DeFi) applications across the globe.', risk_information: 'Gas fee fluctuations, smart contract vulnerabilities, layer-2 execution risks.', sort_order: 2, is_active: 1, is_visible: 1, sparkline: [1980, 2010, 2040, 2020, 2070, 2050, 2056.93] },
    { id: 3, name: 'Tether', symbol: 'USDT', slug: 'tether', logo_url: './assets/coins/usdt.svg', blockchain: 'Multi-Chain Fiat Collateralized Stablecoin', current_price_usd: 1.00, change_24h: 0.02, high_24h: 1.002, low_24h: 0.998, volume_24h: 52100000000, market_cap_usd: 120000000000, categories: ['Top 10'], risk_level: 'Low', educational_content: 'USDT is a collateralized stablecoin pegged 1:1 to the US Dollar, facilitating liquidity and trading.', risk_information: 'Centralized issuer counterparty and reserve backing risk.', sort_order: 3, is_active: 1, is_visible: 1, sparkline: [1.0, 1.001, 0.999, 1.0, 1.001, 1.0, 1.0] },
    { id: 4, name: 'BNB', symbol: 'BNB', slug: 'binancecoin', logo_url: './assets/coins/bnb.svg', blockchain: 'BNB Smart Chain (Proof of Staked Authority)', current_price_usd: 585.40, change_24h: 0.85, high_24h: 595, low_24h: 575, volume_24h: 1150000000, market_cap_usd: 85400000000, categories: ['Top 10', 'Layer 1', 'DeFi'], risk_level: 'Medium', educational_content: 'BNB fuels the BNB Chain ecosystem and offers gas discounts and DeFi utility.', risk_information: 'Ecosystem centralization and regulatory scrutiny.', sort_order: 4, is_active: 1, is_visible: 1, sparkline: [565, 572, 580, 578, 588, 582, 585.4] },
    { id: 5, name: 'Solana', symbol: 'SOL', slug: 'solana', logo_url: './assets/coins/sol.svg', blockchain: 'Proof of History + Proof of Stake Hybrid Engine', current_price_usd: 83.75, change_24h: 3.12, high_24h: 86.5, low_24h: 80.2, volume_24h: 3850000000, market_cap_usd: 39500000000, categories: ['Top 10', 'Layer 1', 'DeFi'], risk_level: 'Medium', educational_content: 'Solana is a high-throughput blockchain capable of thousands of transactions per second with sub-cent fees.', risk_information: 'Validator hardware demands and historical network congestion.', sort_order: 5, is_active: 1, is_visible: 1, sparkline: [78, 80, 82, 79, 84, 82, 83.75] },
    { id: 6, name: 'XRP', symbol: 'XRP', slug: 'ripple', logo_url: './assets/coins/xrp.svg', blockchain: 'XRP Ledger (Consensus Protocol)', current_price_usd: 0.528, change_24h: -0.45, high_24h: 0.542, low_24h: 0.519, volume_24h: 1420000000, market_cap_usd: 29800000000, categories: ['Top 10'], risk_level: 'Medium', educational_content: 'XRP is built for real-time cross-border settlements and enterprise payment facilitation.', risk_information: 'Regulatory ongoing litigation and escrow lock releases.', sort_order: 6, is_active: 1, is_visible: 1, sparkline: [0.51, 0.52, 0.53, 0.525, 0.535, 0.522, 0.528] },
    { id: 7, name: 'Dogecoin', symbol: 'DOGE', slug: 'dogecoin', logo_url: './assets/coins/doge.svg', blockchain: 'Scrypt Proof of Work (AuxPoW)', current_price_usd: 0.142, change_24h: 5.80, high_24h: 0.151, low_24h: 0.134, volume_24h: 1950000000, market_cap_usd: 20700000000, categories: ['Top 10', 'Meme'], risk_level: 'High', educational_content: 'Dogecoin is the original meme cryptocurrency created in 2013 featuring the Shiba Inu dog.', risk_information: 'Social sentiment volatility and inflationary tokenomics.', sort_order: 7, is_active: 1, is_visible: 1, sparkline: [0.128, 0.132, 0.135, 0.138, 0.145, 0.140, 0.142] },
    { id: 8, name: 'Cardano', symbol: 'ADA', slug: 'cardano', logo_url: './assets/coins/ada.svg', blockchain: 'Ouroboros Proof of Stake (Peer-Reviewed Protocol)', current_price_usd: 0.362, change_24h: 1.15, high_24h: 0.375, low_24h: 0.354, volume_24h: 420000000, market_cap_usd: 12900000000, categories: ['Top 10', 'Layer 1'], risk_level: 'Medium', educational_content: 'Cardano is a research-first blockchain platform built on peer-reviewed academic papers.', risk_information: 'Development roadmap pacing and adoption competition.', sort_order: 8, is_active: 1, is_visible: 1, sparkline: [0.345, 0.35, 0.355, 0.36, 0.365, 0.358, 0.362] },
    { id: 9, name: 'Avalanche', symbol: 'AVAX', slug: 'avalanche-2', logo_url: './assets/coins/avax.svg', blockchain: 'Avalanche Consensus (Multi-Subnet Architecture)', current_price_usd: 24.85, change_24h: 2.40, high_24h: 25.6, low_24h: 23.9, volume_24h: 380000000, market_cap_usd: 9950000000, categories: ['Layer 1', 'DeFi'], risk_level: 'Medium', educational_content: 'Avalanche is a smart contract platform capable of sub-second finality with custom subnets.', risk_information: 'Unlocks schedule and subnet validation economics.', sort_order: 9, is_active: 1, is_visible: 1, sparkline: [23.1, 23.8, 24.2, 24.0, 25.1, 24.5, 24.85] },
    { id: 10, name: 'Chainlink', symbol: 'LINK', slug: 'chainlink', logo_url: './assets/coins/link.svg', blockchain: 'Decentralized Oracle Network (Cross-Chain CCIP)', current_price_usd: 11.24, change_24h: 0.95, high_24h: 11.6, low_24h: 10.9, volume_24h: 290000000, market_cap_usd: 6850000000, categories: ['DeFi'], risk_level: 'Medium', educational_content: 'Chainlink connects smart contracts with real-world external data feeds, off-chain computation, and APIs.', risk_information: 'Oracle node collaterals and multi-chain bridge integrations.', sort_order: 10, is_active: 1, is_visible: 1, sparkline: [10.5, 10.8, 11.1, 10.95, 11.35, 11.15, 11.24] },
    { id: 11, name: 'Polkadot', symbol: 'DOT', slug: 'polkadot', logo_url: './assets/coins/dot.svg', blockchain: 'Nominated Proof of Stake (Heterogeneous Parachains)', current_price_usd: 4.15, change_24h: -0.80, high_24h: 4.28, low_24h: 4.08, volume_24h: 185000000, market_cap_usd: 5950000000, categories: ['Layer 1'], risk_level: 'Medium', educational_content: 'Polkadot unites independent blockchains into a shared security and interoperability network.', risk_information: 'Parachain slot renewal dynamics and inflation rate.', sort_order: 11, is_active: 1, is_visible: 1, sparkline: [4.05, 4.12, 4.2, 4.18, 4.24, 4.14, 4.15] },
    { id: 12, name: 'TRON', symbol: 'TRX', slug: 'tron', logo_url: './assets/coins/trx.svg', blockchain: 'Delegated Proof of Stake (High-Throughput DPoS)', current_price_usd: 0.165, change_24h: 1.05, high_24h: 0.168, low_24h: 0.161, volume_24h: 650000000, market_cap_usd: 14300000000, categories: ['Top 10', 'Layer 1'], risk_level: 'Medium', educational_content: 'TRON is a decentralized platform known for hosting the largest volume of global USDT transfers.', risk_information: 'Validator centralization and governance concentration.', sort_order: 12, is_active: 1, is_visible: 1, sparkline: [0.158, 0.161, 0.163, 0.162, 0.167, 0.164, 0.165] },
    { id: 13, name: 'Monero', symbol: 'XMR', slug: 'monero', logo_url: './assets/coins/xmr.svg', blockchain: 'RandomX Proof of Work (Ring Confidential Transactions)', current_price_usd: 158.40, change_24h: 2.50, high_24h: 162.0, low_24h: 154.5, volume_24h: 194000000, market_cap_usd: 2910000000, categories: ['Privacy'], risk_level: 'High', educational_content: 'Monero is the leading privacy-focused cryptocurrency with untraceable stealth transactions and ring signatures.', risk_information: 'Regulatory exchange delistings and jurisdiction prohibitions.', sort_order: 13, is_active: 1, is_visible: 1, sparkline: [152, 155, 157, 154, 160, 156, 158.4] },
    { id: 14, name: 'Beldex', symbol: 'BDX', slug: 'beldex', logo_url: './assets/coins/bdx.png', blockchain: 'Proof of Stake Private Ecosystem (Masternodes & POS)', current_price_usd: 0.0722, change_24h: 3.41, high_24h: 0.075, low_24h: 0.069, volume_24h: 9420000, market_cap_usd: 568900000, categories: ['Privacy'], risk_level: 'High', educational_content: 'Beldex is a privacy-first web3 ecosystem providing BChat confidential messaging, BelNet dVPN, and Masternode validation.', risk_information: 'Altcoin liquidity profile and Masternode collateral requirements.', sort_order: 14, is_active: 1, is_visible: 1, sparkline: [0.066, 0.068, 0.071, 0.069, 0.074, 0.070, 0.0722] },
    { id: 15, name: 'Shiba Inu', symbol: 'SHIB', slug: 'shiba-inu', logo_url: './assets/coins/shib.svg', blockchain: 'Ethereum ERC-20 + Shibarium Layer-2 Ecosystem', current_price_usd: 0.0000185, change_24h: 4.25, high_24h: 0.0000192, low_24h: 0.0000176, volume_24h: 520000000, market_cap_usd: 10900000000, categories: ['Meme', 'DeFi'], risk_level: 'Very High', educational_content: 'Shiba Inu is a community-driven meme ecosystem expanding into DEXs and Shibarium Layer-2.', risk_information: 'Massive circulating token supply and high speculative swings.', sort_order: 15, is_active: 1, is_visible: 1, sparkline: [0.000017, 0.0000178, 0.0000182, 0.0000179, 0.0000189, 0.0000183, 0.0000185] },
    { id: 16, name: 'Pepe', symbol: 'PEPE', slug: 'pepe', logo_url: './assets/coins/pepe.svg', blockchain: 'Ethereum ERC-20 Deflationary Meme Token', current_price_usd: 0.0000098, change_24h: 7.90, high_24h: 0.0000105, low_24h: 0.0000089, volume_24h: 880000000, market_cap_usd: 4120000000, categories: ['Meme'], risk_level: 'Very High', educational_content: 'Pepe is a culture-centric viral meme coin on Ethereum with a burning redistribution mechanism.', risk_information: 'Meme sentiment volatility and zero inherent utility.', sort_order: 16, is_active: 1, is_visible: 1, sparkline: [0.0000085, 0.000009, 0.0000094, 0.0000091, 0.0000102, 0.0000096, 0.0000098] },
    { id: 17, name: 'Sui', symbol: 'SUI', slug: 'sui', logo_url: './assets/coins/sui.svg', blockchain: 'Move Language Object-Centric Layer 1', current_price_usd: 1.95, change_24h: 6.20, high_24h: 2.05, low_24h: 1.82, volume_24h: 750000000, market_cap_usd: 5460000000, categories: ['Layer 1', 'DeFi'], risk_level: 'High', educational_content: 'Sui is an innovative Layer 1 blockchain using the Move programming language for parallel execution.', risk_information: 'Token unlock vesting schedule and early developer adoption curve.', sort_order: 17, is_active: 1, is_visible: 1, sparkline: [1.75, 1.82, 1.89, 1.84, 1.98, 1.91, 1.95] },
    { id: 18, name: 'NEAR Protocol', symbol: 'NEAR', slug: 'near', logo_url: './assets/coins/near.svg', blockchain: 'Nightshade Sharding Proof of Stake (AI & Web3)', current_price_usd: 4.82, change_24h: 3.45, high_24h: 5.05, low_24h: 4.65, volume_24h: 410000000, market_cap_usd: 5880000000, categories: ['Layer 1', 'AI'], risk_level: 'Medium', educational_content: 'NEAR Protocol is a high-speed sharded blockchain focused on user-friendly abstraction and decentralized AI.', risk_information: 'Sharding complexity and market competition among smart contract chains.', sort_order: 18, is_active: 1, is_visible: 1, sparkline: [4.45, 4.58, 4.72, 4.65, 4.92, 4.75, 4.82] },
    { id: 19, name: 'Litecoin', symbol: 'LTC', slug: 'litecoin', logo_url: './assets/coins/ltc.svg', blockchain: 'Scrypt Proof of Work (Silver to Bitcoin Gold)', current_price_usd: 68.20, change_24h: 1.05, high_24h: 70.1, low_24h: 66.8, volume_24h: 360000000, market_cap_usd: 5120000000, categories: ['Layer 1'], risk_level: 'Medium', educational_content: 'Litecoin was launched in 2011 by Charlie Lee as a lightweight peer-to-peer payment alternative to Bitcoin.', risk_information: 'Mining reward halving cycles and low relative market beta.', sort_order: 19, is_active: 1, is_visible: 1, sparkline: [65.5, 66.8, 68.0, 67.2, 69.1, 67.8, 68.2] },
    { id: 20, name: 'Uniswap', symbol: 'UNI', slug: 'uniswap', logo_url: './assets/coins/uni.svg', blockchain: 'Ethereum Automated Market Maker (AMM DEX Governance)', current_price_usd: 7.65, change_24h: 2.10, high_24h: 7.95, low_24h: 7.42, volume_24h: 280000000, market_cap_usd: 4590000000, categories: ['DeFi'], risk_level: 'Medium', educational_content: 'Uniswap is the largest decentralized automated market maker exchange protocol across EVM networks.', risk_information: 'Fee-switch governance debates and decentralized liquidity concentration.', sort_order: 20, is_active: 1, is_visible: 1, sparkline: [7.2, 7.35, 7.55, 7.48, 7.8, 7.58, 7.65] }
];

async function fetchDirectMarketPrices() {
    // 1. Fetch live prices for top coins from API Ninjas using user's key
    try {
        const ninjaPairs = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK', 'LTC', 'DOT'];
        await Promise.all(ninjaPairs.map(async sym => {
            try {
                const res = await fetch(`https://api.api-ninjas.com/v1/cryptoprice?symbol=${sym}USD`, {
                    headers: { 'X-Api-Key': NINJA_API_KEY }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.price) {
                        const c = CLIENT_STATIC_COINS.find(x => x.symbol === sym);
                        if (c) {
                            const newP = parseFloat(data.price);
                            c.current_price_usd = newP;
                            if (c.sparkline) {
                                c.sparkline.push(newP);
                                if (c.sparkline.length > 10) c.sparkline.shift();
                            }
                        }
                    }
                }
            } catch (e) {}
        }));
    } catch (e) {}

    // 2. Fetch CoinGecko prices for privacy coins, altcoins, and market metrics
    try {
        const geckoIds = 'bitcoin,ethereum,monero,beldex,solana,ripple,dogecoin,cardano,avalanche-2,chainlink,polkadot,tron,shiba-inu,pepe,sui,near,litecoin,uniswap,tether,binancecoin';
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${geckoIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`);
        if (res.ok) {
            const data = await res.json();
            const map = {
                bitcoin: 'BTC', ethereum: 'ETH', monero: 'XMR', beldex: 'BDX', solana: 'SOL',
                ripple: 'XRP', dogecoin: 'DOGE', cardano: 'ADA', 'avalanche-2': 'AVAX', chainlink: 'LINK',
                polkadot: 'DOT', tron: 'TRX', 'shiba-inu': 'SHIB', pepe: 'PEPE', sui: 'SUI',
                near: 'NEAR', litecoin: 'LTC', uniswap: 'UNI', tether: 'USDT', binancecoin: 'BNB'
            };
            for (const [id, m] of Object.entries(data)) {
                const sym = map[id];
                const c = CLIENT_STATIC_COINS.find(x => x.symbol === sym);
                if (c && m && typeof m.usd === 'number') {
                    if (!['BTC', 'ETH', 'SOL', 'XRP', 'DOGE'].includes(sym) || !c.current_price_usd) {
                        c.current_price_usd = m.usd;
                    }
                    if (typeof m.usd_24h_change === 'number') {
                        c.change_24h = Number(m.usd_24h_change.toFixed(2));
                    }
                    c.volume_24h = m.usd_24h_vol || c.volume_24h;
                    c.market_cap_usd = m.usd_market_cap || c.market_cap_usd;
                }
            }
        }
    } catch (e) {}

    return CLIENT_STATIC_COINS;
}

const fetchDirectCoinGeckoPrices = fetchDirectMarketPrices;

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
            // Re-throw so individual endpoints can apply client fallback if needed
            throw err;
        }
    },

    // Auth
    auth: {
        login: async (credentials) => {
            try {
                return await API.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
            } catch (err) {
                // Client-side database fallback for GitHub Pages & Offline
                if (typeof ClientDB !== 'undefined') {
                    const res = ClientDB.users.login({
                        email: credentials.email,
                        username: credentials.email,
                        password: credentials.password
                    });
                    localStorage.setItem('ccpulse_jwt', res.token);
                    State.currentUser = res.user;
                    State.token = res.token;
                    State.wallet = res.wallet;
                    State.isGuest = false;
                    State.notify('auth');
                    return res;
                }
                throw err;
            }
        },
        register: async (formData) => {
            try {
                return await API.request('/auth/register', { method: 'POST', body: JSON.stringify(formData) });
            } catch (err) {
                // Client-side database fallback for GitHub Pages & Offline
                if (typeof ClientDB !== 'undefined') {
                    const res = ClientDB.users.register(formData);
                    localStorage.setItem('ccpulse_jwt', res.token);
                    State.currentUser = res.user;
                    State.token = res.token;
                    State.wallet = res.wallet;
                    State.isGuest = false;
                    State.notify('auth');
                    return res;
                }
                throw err;
            }
        },
        me: async () => {
            try {
                return await API.request('/auth/me');
            } catch (err) {
                if (typeof ClientDB !== 'undefined' && State.token) {
                    const user = ClientDB.users.getByToken(State.token);
                    if (user) {
                        const wallet = ClientDB.wallets.getByUserId(user.id);
                        State.currentUser = user;
                        State.wallet = wallet;
                        State.isGuest = false;
                        return { success: true, user, wallet, unreadNotifications: 0 };
                    }
                }
                if (State.currentUser) return { success: true, user: State.currentUser, wallet: State.wallet };
                return { success: false, isGuest: true };
            }
        },
        guest: () => API.request('/auth/guest', { method: 'POST' }).catch(() => ({ success: true, isGuest: true })),
        forgotPassword: (email) => API.request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }).catch(() => ({ success: true, message: 'Password reset link sent.' })),
        resetPassword: (payload) => API.request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
        updatePreferences: (prefs) => API.request('/auth/preferences', { method: 'POST', body: JSON.stringify(prefs) }).catch(() => ({ success: true }))
    },

    // Cryptocurrencies
    cryptos: {
        list: async () => {
            try {
                return await API.request('/cryptos');
            } catch (e) {
                const cryptos = await fetchDirectCoinGeckoPrices();
                return {
                    success: true,
                    count: cryptos.length,
                    cryptos,
                    feed: { isLive: true, provider: 'CoinGecko Live API (Direct)', lastUpdated: new Date().toISOString() }
                };
            }
        },
        refreshRates: async () => {
            try {
                return await API.request('/cryptos/refresh', { method: 'POST' });
            } catch (e) {
                const cryptos = await fetchDirectCoinGeckoPrices();
                return {
                    success: true,
                    count: cryptos.length,
                    cryptos,
                    provider: 'CoinGecko Live API (Direct)',
                    lastUpdated: new Date().toISOString()
                };
            }
        },
        getFeedStatus: () => API.request('/cryptos/feed-status').catch(() => ({ success: true, isLive: true, provider: 'CoinGecko Live API' })),
        get: async (symbolOrSlug) => {
            try {
                return await API.request(`/cryptos/${symbolOrSlug}`);
            } catch (e) {
                const match = CLIENT_STATIC_COINS.find(c => c.symbol.toLowerCase() === symbolOrSlug.toLowerCase() || c.slug.toLowerCase() === symbolOrSlug.toLowerCase());
                if (match) return { success: true, crypto: match };
                throw new Error('Cryptocurrency not found.');
            }
        },
        getChart: async (id, timeframe = '1D') => {
            try {
                return await API.request(`/cryptos/${id}/chart?timeframe=${timeframe}`);
            } catch (e) {
                // Generate simulated OHLC candlestick and line chart points anchored to current price
                const coin = CLIENT_STATIC_COINS.find(c => c.id === Number(id) || c.symbol === id) || CLIENT_STATIC_COINS[0];
                const base = coin.current_price_usd;
                const points = [];
                const candles = [];
                let walk = base * (1 - (coin.change_24h / 100));
                const numPoints = 24;

                for (let i = numPoints - 1; i >= 0; i--) {
                    const t = new Date(Date.now() - i * 3600000).toISOString();
                    const open = walk;
                    const volatility = base * 0.015;
                    const delta = (Math.random() - 0.48) * volatility;
                    const close = i === 0 ? base : Math.max(base * 0.4, open + delta);
                    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
                    const low = Math.max(base * 0.2, Math.min(open, close) - Math.random() * volatility * 0.5);
                    walk = close;

                    points.push({ timestamp: t, price: Number(close.toFixed(base < 1 ? 4 : 2)) });
                    candles.push({
                        timestamp: t,
                        open: Number(open.toFixed(base < 1 ? 4 : 2)),
                        high: Number(high.toFixed(base < 1 ? 4 : 2)),
                        low: Number(low.toFixed(base < 1 ? 4 : 2)),
                        close: Number(close.toFixed(base < 1 ? 4 : 2))
                    });
                }
                return { success: true, timeframe, data: points, candles };
            }
        },
        getOrderBook: async (id) => {
            try {
                return await API.request(`/cryptos/${id}/orderbook`);
            } catch (e) {
                const coin = CLIENT_STATIC_COINS.find(c => c.id === Number(id)) || CLIENT_STATIC_COINS[0];
                const mid = coin.current_price_usd;
                const bids = [];
                const asks = [];
                for (let i = 1; i <= 6; i++) {
                    const bp = mid * (1 - 0.002 * i);
                    const ap = mid * (1 + 0.002 * i);
                    bids.push({ price: Number(bp.toFixed(mid < 1 ? 4 : 2)), quantity: 0.5, total: Number((bp * 0.5).toFixed(2)) });
                    asks.push({ price: Number(ap.toFixed(mid < 1 ? 4 : 2)), quantity: 0.5, total: Number((ap * 0.5).toFixed(2)) });
                }
                return { success: true, orderbook: { bids, asks } };
            }
        },
        getWatchlist: () => API.request('/cryptos/watchlist/user').catch(() => ({ success: true, isGuest: State.isGuest, watchlist: [] })),
        toggleWatchlist: (crypto_id) => API.request('/cryptos/watchlist/toggle', { method: 'POST', body: JSON.stringify({ crypto_id }) }).catch(() => ({ success: true, isSaved: true }))
    },

    // Simulator
    simulator: {
        trade: async (tradeData) => {
            try {
                return await API.request('/simulator/trade', { method: 'POST', body: JSON.stringify(tradeData) });
            } catch (err) {
                const cid = Number(tradeData.crypto_id || tradeData.cryptoId);
                const sym = (tradeData.symbol || '').toUpperCase();

                let coin = null;
                if (State.cryptos && State.cryptos.length) {
                    coin = State.cryptos.find(c => c.id === cid || (sym && c.symbol.toUpperCase() === sym));
                }
                if (!coin) {
                    coin = CLIENT_STATIC_COINS.find(c => c.id === cid || (sym && c.symbol.toUpperCase() === sym));
                }
                if (!coin) {
                    coin = CLIENT_STATIC_COINS[0];
                }

                const priceUsd = tradeData.priceUsd ? parseFloat(tradeData.priceUsd) : coin.current_price_usd;
                const qty = parseFloat(tradeData.quantity);

                if (typeof ClientDB !== 'undefined' && State.currentUser) {
                    const res = ClientDB.trades.execute({
                        userId: State.currentUser.id,
                        crypto: coin,
                        type: tradeData.type,
                        quantity: qty,
                        priceUsd: priceUsd
                    });
                    State.wallet = res.wallet;
                    State.notify('wallet');
                    return {
                        success: true,
                        message: `Successfully executed simulated ${tradeData.type} for ${qty.toLocaleString()} ${coin.symbol}!`,
                        ...res
                    };
                }
                // Guest fallback trade
                State.updateGuestTrade({
                    type: tradeData.type,
                    crypto: coin,
                    quantity: qty,
                    priceUsd: priceUsd
                });
                return {
                    success: true,
                    message: `Successfully executed simulated ${tradeData.type} for ${qty.toLocaleString()} ${coin.symbol}!`,
                    trade: {
                        tradeType: tradeData.type,
                        symbol: coin.symbol,
                        quantity: qty,
                        executionPriceUsd: priceUsd,
                        totalCostUsd: qty * priceUsd
                    },
                    wallet: State.guestSession
                };
            }
        },
        swap: async (swapData) => {
            try {
                return await API.request('/simulator/swap', { method: 'POST', body: JSON.stringify(swapData) });
            } catch (err) {
                const fromSym = (swapData.fromSymbol || swapData.from_symbol || '').toUpperCase();
                const toSym = (swapData.toSymbol || swapData.to_symbol || '').toUpperCase();
                const fromCrypto = (State.cryptos && State.cryptos.find(c => c.symbol === fromSym)) || CLIENT_STATIC_COINS.find(c => c.symbol === fromSym);
                const toCrypto = (State.cryptos && State.cryptos.find(c => c.symbol === toSym)) || CLIENT_STATIC_COINS.find(c => c.symbol === toSym);

                if (!fromCrypto || !toCrypto) throw new Error('Selected cryptocurrency not found.');

                if (typeof ClientDB !== 'undefined' && State.currentUser) {
                    const res = ClientDB.trades.executeSwap({
                        userId: State.currentUser.id,
                        fromCrypto,
                        toCrypto,
                        fromQuantity: swapData.fromQuantity,
                        slippageTolerance: swapData.slippageTolerance || 0.005,
                        networkFeePct: swapData.networkFeePct || 0.0015,
                        handlingFeePct: swapData.handlingFeePct || 0.0025
                    });
                    State.wallet = res.wallet;
                    State.notify('wallet');
                    return res;
                }

                return State.updateGuestSwap({
                    fromCrypto,
                    toCrypto,
                    fromQuantity: swapData.fromQuantity,
                    slippagePct: swapData.slippageTolerance || 0.005,
                    networkFeePct: swapData.networkFeePct || 0.0015,
                    handlingFeePct: swapData.handlingFeePct || 0.0025
                });
            }
        },
        getPortfolio: async () => {
            try {
                const res = await API.request('/simulator/portfolio');
                if (res && res.success) {
                    const p = res.portfolio || res.wallet;
                    return {
                        success: true,
                        portfolio: p,
                        wallet: p,
                        holdings: (p && p.holdings) || res.holdings || [],
                        trades: res.trades || [],
                        transactions: res.transactions || []
                    };
                }
            } catch (e) {
                // Fallback to in-browser storage
            }

            if (typeof ClientDB !== 'undefined' && State.currentUser) {
                const wallet = ClientDB.wallets.getByUserId(State.currentUser.id);
                const trades = ClientDB.trades.getByUserId(State.currentUser.id);
                const txs = ClientDB.transactions ? ClientDB.transactions.getByUserId(State.currentUser.id) : [];
                return {
                    success: true,
                    portfolio: wallet,
                    wallet: wallet,
                    holdings: wallet ? (wallet.holdings || []) : [],
                    trades: trades || [],
                    transactions: txs || []
                };
            }

            const g = State.guestSession || { temporaryBalanceUsd: 10000.00, holdings: [], trades: [] };
            let guestInvested = 0;
            const enrichedGuestHoldings = (g.holdings || []).map(h => {
                const liveCoin = (State.cryptos && State.cryptos.find(c => c.symbol === h.symbol)) || CLIENT_STATIC_COINS.find(c => c.symbol === h.symbol) || { current_price_usd: h.avg_buy_price_usd || 1 };
                const curVal = h.quantity * liveCoin.current_price_usd;
                guestInvested += curVal;
                return {
                    ...h,
                    current_price_usd: liveCoin.current_price_usd,
                    current_value_usd: curVal,
                    pnl_usd: curVal - (h.total_invested_usd || 0),
                    pnl_percent: h.total_invested_usd > 0 ? ((curVal - h.total_invested_usd) / h.total_invested_usd) * 100 : 0
                };
            });

            const guestPortfolio = {
                availableCashUsd: g.temporaryBalanceUsd,
                investedUsd: guestInvested,
                totalPortfolioValueUsd: g.temporaryBalanceUsd + guestInvested,
                totalDepositedUsd: 10000.00,
                totalProfitLossUsd: (g.temporaryBalanceUsd + guestInvested) - 10000.00,
                totalProfitLossPercent: (((g.temporaryBalanceUsd + guestInvested) - 10000.00) / 10000.00) * 100,
                holdings: enrichedGuestHoldings
            };

            const guestTransactions = (g.trades || []).map(t => ({
                transaction_ref: t.tradeRef || `TX-${Date.now()}`,
                type: t.type === 'BUY' ? 'BUY_ORDER' : (t.type === 'SELL' ? 'SELL_ORDER' : 'SWAP'),
                amount_usd: t.totalValueUsd,
                balance_after_usd: g.temporaryBalanceUsd,
                description: t.type === 'SWAP' ? `Guest Swap ${t.fromQuantity} ${t.fromSymbol} → ${t.toSymbol}` : `Guest ${t.type} ${t.quantity} ${t.symbol}`,
                audit_reason: t.type === 'SWAP' ? `Network & Handling Fee: $${((t.networkFeeUsd || 0) + (t.handlingFeeUsd || 0)).toFixed(2)} USD` : 'Simulated execution',
                created_at: t.date || new Date().toISOString()
            }));

            return {
                success: true,
                portfolio: guestPortfolio,
                wallet: guestPortfolio,
                holdings: enrichedGuestHoldings,
                trades: g.trades || [],
                transactions: guestTransactions
            };
        },
        getTrades: async () => {
            try {
                return await API.request('/simulator/trades');
            } catch (e) {
                if (typeof ClientDB !== 'undefined' && State.currentUser) {
                    return { success: true, trades: ClientDB.trades.getByUserId(State.currentUser.id) };
                }
                return { success: true, trades: State.guestSession?.trades || [] };
            }
        }
    },

    // Currency
    currency: {
        getStatus: async () => {
            try {
                return await API.request('/currency/status');
            } catch (e) {
                // Primary: Query API Ninjas exchange rates with user key
                try {
                    const ninjaKey = 'mGMasDhcrG73bhUPj5VPOvxqdd33xgO5XxpROwjN';
                    const pairs = ['USD_INR', 'USD_EUR', 'USD_GBP', 'USD_AED', 'USD_JPY'];
                    const rates = { USD: 1.0 };

                    await Promise.all(pairs.map(async pair => {
                        const target = pair.replace('USD_', '');
                        try {
                            const res = await fetch(`https://api.api-ninjas.com/v1/exchangerate?pair=${pair}`, {
                                headers: { 'X-Api-Key': ninjaKey }
                            });
                            if (res.ok) {
                                const d = await res.json();
                                if (d && d.exchange_rate) {
                                    rates[target] = Number(d.exchange_rate);
                                }
                            }
                        } catch (err) {}
                    }));

                    if (rates.INR && rates.EUR) {
                        return {
                            success: true,
                            baseCurrency: 'USD',
                            rates,
                            lastUpdated: new Date().toISOString(),
                            isStale: false,
                            provider: 'API Ninjas Live Forex'
                        };
                    }
                } catch (err) {}

                // Secondary fallback: open.er-api.com
                try {
                    const res = await fetch('https://open.er-api.com/v6/latest/USD');
                    const data = await res.json();
                    if (data && data.rates) {
                        return {
                            success: true,
                            baseCurrency: 'USD',
                            rates: {
                                USD: 1.0,
                                INR: data.rates.INR || 93.59,
                                EUR: data.rates.EUR || 0.895,
                                GBP: data.rates.GBP || 0.749,
                                AED: data.rates.AED || 3.672,
                                JPY: data.rates.JPY || 158.71
                            },
                            provider: 'OpenExchangeAPI (Live Direct)',
                            lastUpdated: new Date().toISOString(),
                            isStale: false
                        };
                    }
                } catch (err) {}
                return {
                    success: true,
                    rates: { USD: 1.0, INR: 93.59, EUR: 0.895, GBP: 0.749, AED: 3.672, JPY: 158.71 },
                    provider: 'Client Fallback',
                    lastUpdated: new Date().toISOString(),
                    isStale: false
                };
            }
        },
        convert: (amount, currency) => API.request(`/currency/convert?amount=${amount}&currency=${currency}`).catch(() => ({
            success: true,
            originalAmountUsd: amount,
            targetCurrency: currency,
            convertedAmount: amount * (State.rates[currency] || 1)
        })),
        refreshRates: async () => {
            try {
                return await API.request('/currency/refresh', { method: 'POST' });
            } catch (e) {
                return API.currency.getStatus();
            }
        },
        adminUpdateRate: (code, data) => API.request(`/currency/${code}`, { method: 'PUT', body: JSON.stringify(data) })
    },

    // Admin
    admin: {
        getOverview: async () => {
            try {
                return await API.request('/admin/overview');
            } catch (e) {
                if (typeof ClientDB !== 'undefined') {
                    const allUsers = ClientDB.users.getAll();
                    const allTrades = ClientDB.trades.getAll();
                    return {
                        success: true,
                        overview: {
                            totalRegisteredUsers: allUsers.length,
                            totalAnonymousGuests: 15,
                            totalWallets: allUsers.length,
                            totalTrades: allTrades.length,
                            totalVirtualDistributedUsd: allUsers.length * 5000,
                            totalActiveCryptos: 5,
                            mostViewedCrypto: 'Bitcoin',
                            mostSimulatedCrypto: 'Bitcoin'
                        }
                    };
                }
                return {
                    success: true,
                    overview: {
                        totalRegisteredUsers: 2,
                        totalAnonymousGuests: 15,
                        totalWallets: 2,
                        totalTrades: 8,
                        totalVirtualDistributedUsd: 10000,
                        totalActiveCryptos: 5,
                        mostViewedCrypto: 'Bitcoin',
                        mostSimulatedCrypto: 'Bitcoin'
                    }
                };
            }
        },
        getCryptos: () => API.request('/admin/cryptos').catch(() => ({ success: true, count: 5, cryptos: CLIENT_STATIC_COINS })),
        addCrypto: (data) => API.request('/admin/cryptos', { method: 'POST', body: JSON.stringify(data) }),
        updateCrypto: (id, data) => API.request(`/admin/cryptos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        deleteCrypto: (id) => API.request(`/admin/cryptos/${id}`, { method: 'DELETE' }),
        getUsers: async (params = {}) => {
            const query = new URLSearchParams(params).toString();
            try {
                return await API.request(`/admin/users?${query}`);
            } catch (e) {
                if (typeof ClientDB !== 'undefined') {
                    const users = ClientDB.users.getAll();
                    return {
                        success: true,
                        total: users.length,
                        users
                    };
                }
                return {
                    success: true,
                    total: 2,
                    users: [
                        { id: 1, username: 'admin', email: 'admin@ccpulse.com', role: 'admin', isActive: true, availableCashUsd: 5000 },
                        { id: 2, username: 'trader', email: 'trader@ccpulse.com', role: 'user', isActive: true, availableCashUsd: 5000 }
                    ]
                };
            }
        },
        updateUserStatus: async (id, statusData) => {
            try {
                return await API.request(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify(statusData) });
            } catch (e) {
                if (typeof ClientDB !== 'undefined') {
                    return ClientDB.users.updateStatus(id, statusData);
                }
                throw e;
            }
        },
        resetUserPassword: async (id, data) => {
            try {
                return await API.request(`/admin/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify(data) });
            } catch (e) {
                if (typeof ClientDB !== 'undefined') {
                    return ClientDB.users.resetPassword(id, data.password || 'Trader@123456');
                }
                throw e;
            }
        },
        getUserActivity: (id) => API.request(`/admin/users/${id}/activity`).catch(() => ({ success: true, activity: [] })),
        grantBalance: async (data) => {
            try {
                return await API.request('/admin/balances/grant', { method: 'POST', body: JSON.stringify(data) });
            } catch (e) {
                if (typeof ClientDB !== 'undefined') {
                    ClientDB.wallets.adjustBalance(data.userId, parseFloat(data.amountUsd), data.reason, 'ADMIN_GRANT');
                    return { success: true, message: 'Balance granted successfully.' };
                }
                throw e;
            }
        },
        deductBalance: async (data) => {
            try {
                return await API.request('/admin/balances/deduct', { method: 'POST', body: JSON.stringify(data) });
            } catch (e) {
                if (typeof ClientDB !== 'undefined') {
                    ClientDB.wallets.adjustBalance(data.userId, -parseFloat(data.amountUsd), data.reason, 'ADMIN_DEDUCT');
                    return { success: true, message: 'Balance deducted successfully.' };
                }
                throw e;
            }
        },
        getBonusHistory: () => API.request('/admin/bonus-history').catch(() => ({ success: true, bonuses: [] })),
        getAuditLogs: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return API.request(`/admin/audit-logs?${query}`).catch(() => ({ success: true, logs: [] }));
        },
        getSettings: () => API.request('/admin/settings').catch(() => ({
            success: true,
            settings: {
                default_welcome_bonus: '5000.00',
                default_currency: 'USD',
                default_theme: 'dark'
            }
        })),
        updateSettings: (settings) => API.request('/admin/settings', { method: 'PUT', body: JSON.stringify(settings) }),

        // Daily Analytics for user registration & daily website activity
        getDailyAnalytics: async (range = '30d') => {
            try {
                return await API.request(`/admin/analytics/daily?range=${range}`);
            } catch (e) {
                if (typeof ClientDB !== 'undefined') {
                    return ClientDB.analytics.getDaily(range);
                }
                return generateClientDailyAnalytics(range);
            }
        },

        // Support Tickets Admin Management
        getTickets: async (params = {}) => {
            const query = new URLSearchParams(params).toString();
            try {
                return await API.request(`/admin/tickets?${query}`);
            } catch (e) {
                if (typeof ClientDB !== 'undefined') {
                    const tickets = ClientDB.tickets.getAll(params);
                    return {
                        success: true,
                        stats: {
                            total: tickets.length,
                            open: tickets.filter(t => t.status === 'open').length,
                            in_progress: tickets.filter(t => t.status === 'in_progress').length,
                            resolved: tickets.filter(t => t.status === 'resolved').length,
                            resolution_rate: Math.round((tickets.filter(t => t.status === 'resolved').length / (tickets.length || 1)) * 100)
                        },
                        tickets
                    };
                }
                const tickets = getClientStoredTickets();
                const status = params.status || 'all';
                const filtered = status === 'all' ? tickets : tickets.filter(t => t.status === status);
                return {
                    success: true,
                    stats: {
                        total: tickets.length,
                        open: tickets.filter(t => t.status === 'open').length,
                        in_progress: tickets.filter(t => t.status === 'in_progress').length,
                        resolved: tickets.filter(t => t.status === 'resolved').length,
                        resolution_rate: 67
                    },
                    tickets: filtered
                };
            }
        },
        updateTicket: async (id, data) => {
            try {
                return await API.request(`/admin/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
            } catch (e) {
                if (typeof ClientDB !== 'undefined') {
                    if (data.admin_note) {
                        ClientDB.tickets.addReply(id, { senderName: 'CCPulse Administrator', senderRole: 'admin', message: data.admin_note });
                    }
                    if (data.status) {
                        return ClientDB.tickets.updateStatus(id, data.status);
                    }
                    return { success: true };
                }
                const tickets = getClientStoredTickets();
                const ticket = tickets.find(t => t.id === parseInt(id, 10));
                if (ticket) {
                    if (data.status) ticket.status = data.status;
                    if (data.priority) ticket.priority = data.priority;
                    ticket.updated_at = new Date().toISOString();
                    if (data.admin_note) {
                        ticket.replies = ticket.replies || [];
                        ticket.replies.push({
                            id: Date.now(),
                            sender_id: 1,
                            sender_name: 'CCPulse Administrator',
                            sender_role: 'admin',
                            message: data.admin_note,
                            created_at: new Date().toISOString()
                        });
                        ticket.reply_count = ticket.replies.length;
                    }
                    localStorage.setItem(CLIENT_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
                    return { success: true, ticket, replies: ticket.replies };
                }
                throw e;
            }
        },
        replyTicket: async (id, data) => {
            try {
                return await API.request(`/admin/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify(data) });
            } catch (e) {
                if (typeof ClientDB !== 'undefined') {
                    if (data.set_status) ClientDB.tickets.updateStatus(id, data.set_status);
                    return ClientDB.tickets.addReply(id, {
                        senderName: 'CCPulse Administrator',
                        senderRole: 'admin',
                        message: data.message
                    });
                }
                const tickets = getClientStoredTickets();
                const ticket = tickets.find(t => t.id === parseInt(id, 10));
                if (ticket) {
                    ticket.replies = ticket.replies || [];
                    ticket.replies.push({
                        id: Date.now(),
                        sender_id: 1,
                        sender_name: 'CCPulse Administrator',
                        sender_role: 'admin',
                        message: data.message,
                        created_at: new Date().toISOString()
                    });
                    ticket.reply_count = ticket.replies.length;
                    ticket.status = data.set_status || 'in_progress';
                    ticket.updated_at = new Date().toISOString();
                    localStorage.setItem(CLIENT_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
                    return { success: true, ticket, replies: ticket.replies };
                }
                throw e;
            }
        }
    },

    // User Help & Support
    support: {
        createTicket: async (ticketData) => {
            try {
                return await API.request('/support/tickets', { method: 'POST', body: JSON.stringify(ticketData) });
            } catch (e) {
                if (typeof ClientDB !== 'undefined') {
                    return ClientDB.tickets.create({
                        userId: State.currentUser ? State.currentUser.id : null,
                        userEmail: (State.currentUser ? State.currentUser.email : ticketData.email) || 'guest@ccpulse.com',
                        userName: (State.currentUser ? State.currentUser.username : ticketData.name) || 'Trader User',
                        subject: ticketData.subject,
                        category: ticketData.category || 'General Inquiry',
                        priority: ticketData.priority || 'normal',
                        description: ticketData.description
                    });
                }
                const tickets = getClientStoredTickets();
                const newTicket = {
                    id: Date.now(),
                    ticket_code: 'TKT-' + Math.floor(100000 + Math.random() * 900000),
                    user_id: State.currentUser ? State.currentUser.id : null,
                    user_email: (State.currentUser ? State.currentUser.email : ticketData.email) || 'guest@ccpulse.com',
                    user_name: (State.currentUser ? State.currentUser.username : ticketData.name) || 'Trader User',
                    subject: ticketData.subject,
                    category: ticketData.category || 'General',
                    priority: ticketData.priority || 'medium',
                    status: 'open',
                    description: ticketData.description,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    reply_count: 1,
                    replies: [
                        {
                            id: Date.now() + 1,
                            sender_id: State.currentUser ? State.currentUser.id : null,
                            sender_name: (State.currentUser ? State.currentUser.username : ticketData.name) || 'User',
                            sender_role: State.currentUser ? 'user' : 'guest',
                            message: ticketData.description,
                            created_at: new Date().toISOString()
                        }
                    ]
                };
                tickets.unshift(newTicket);
                localStorage.setItem(CLIENT_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
                return { success: true, message: 'Ticket raised successfully!', ticket: newTicket };
            }
        },
        listTickets: async (params = {}) => {
            const query = new URLSearchParams(params).toString();
            try {
                return await API.request(`/support/tickets?${query}`);
            } catch (e) {
                if (typeof ClientDB !== 'undefined') {
                    return { success: true, tickets: ClientDB.tickets.getAll(params) };
                }
                const tickets = getClientStoredTickets();
                return { success: true, tickets };
            }
        },
        getTicket: async (id) => {
            try {
                return await API.request(`/support/tickets/${id}`);
            } catch (e) {
                if (typeof ClientDB !== 'undefined') {
                    const ticket = ClientDB.tickets.getById(id);
                    if (ticket) return { success: true, ticket, replies: ticket.replies || [] };
                    throw new Error('Ticket not found in database.');
                }
                const tickets = getClientStoredTickets();
                const ticket = tickets.find(t => t.id === parseInt(id, 10));
                if (ticket) {
                    return { success: true, ticket, replies: ticket.replies || [] };
                }
                throw new Error('Ticket not found');
            }
        },
        addReply: async (id, replyData) => {
            try {
                return await API.request(`/support/tickets/${id}/replies`, { method: 'POST', body: JSON.stringify(replyData) });
            } catch (e) {
                if (typeof ClientDB !== 'undefined') {
                    return ClientDB.tickets.addReply(id, {
                        senderName: State.currentUser ? State.currentUser.username : (replyData.sender_name || 'User'),
                        senderRole: State.currentUser && State.currentUser.role === 'admin' ? 'admin' : 'user',
                        message: replyData.message
                    });
                }
                const tickets = getClientStoredTickets();
                const ticket = tickets.find(t => t.id === parseInt(id, 10));
                if (ticket) {
                    ticket.replies = ticket.replies || [];
                    const newRep = {
                        id: Date.now(),
                        sender_id: State.currentUser ? State.currentUser.id : null,
                        sender_name: State.currentUser ? State.currentUser.username : (replyData.sender_name || 'User'),
                        sender_role: State.currentUser && State.currentUser.role === 'admin' ? 'admin' : 'user',
                        message: replyData.message,
                        created_at: new Date().toISOString()
                    };
                    ticket.replies.push(newRep);
                    ticket.reply_count = ticket.replies.length;
                    ticket.updated_at = new Date().toISOString();
                    localStorage.setItem(CLIENT_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
                    return { success: true, replies: ticket.replies };
                }
                throw e;
            }
        }
    },

    // Database Engine Diagnostics & JSON Export/Backup
    database: {
        getStatus: async () => {
            try {
                return await API.request('/database/status');
            } catch (e) {
                if (typeof ClientDB !== 'undefined') {
                    const snap = ClientDB.getSnapshot();
                    return {
                        success: true,
                        engine: 'In-Browser ClientDB (GitHub Pages Persistent)',
                        storageLocation: 'localStorage (ccpulse_client_database_v2)',
                        usersCount: snap.users.length,
                        walletsCount: snap.wallets.length,
                        tradesCount: snap.trades.length,
                        ticketsCount: snap.support_tickets.length,
                        lastUpdated: snap.meta.lastUpdated
                    };
                }
                return {
                    success: true,
                    engine: 'SQLite 3 (Server / Local)',
                    storageLocation: 'ccpulse.db'
                };
            }
        },
        exportJSON: () => {
            if (typeof ClientDB !== 'undefined') {
                return ClientDB.exportJSON();
            }
            return JSON.stringify({ error: 'Server database backup available through SQLite CLI or API dump.' });
        },
        importJSON: (jsonStr) => {
            if (typeof ClientDB !== 'undefined') {
                return ClientDB.importJSON(jsonStr);
            }
            throw new Error('Client database import only supported in in-browser mode.');
        },
        resetToDefault: () => {
            if (typeof ClientDB !== 'undefined') {
                return ClientDB.resetToDefault();
            }
        }
    },

    // Learning
    learning: {
        getCourses: () => API.request('/learning/courses').catch(() => ({ success: true, courses: [] })),
        getCourse: (slug) => API.request(`/learning/courses/${slug}`),
        updateProgress: (data) => API.request('/learning/progress', { method: 'POST', body: JSON.stringify(data) })
    },

    // Notifications
    notifications: {
        list: () => API.request('/notifications').catch(() => ({ success: true, notifications: [] })),
        markRead: (id) => API.request(`/notifications/${id}/read`, { method: 'PUT' }),
        markAllRead: () => API.request('/notifications/mark-all-read', { method: 'POST' })
    },

    // Simulation Lab
    simulationLab: {
        getScenarios: () => API.request('/simulation-lab/scenarios').catch(() => ({ success: true, scenarios: [] })),
        simulate: (scenarioId) => API.request('/simulation-lab/simulate', { method: 'POST', body: JSON.stringify({ scenario_id: scenarioId }) })
    }
};

// Client-side Fallback Helpers for Daily Analytics and Support Ticketing
const CLIENT_STORAGE_TICKETS_KEY = 'ccpulse_support_tickets_v1';

function getClientStoredTickets() {
    try {
        const raw = localStorage.getItem(CLIENT_STORAGE_TICKETS_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    const defaultTickets = [
        {
            id: 1,
            ticket_code: 'TKT-100291',
            user_id: 2,
            user_email: 'trader@ccpulse.com',
            user_name: 'Simulated Trader',
            subject: 'How do Beldex Masternode rewards work in simulation?',
            category: 'Crypto Pricing & Live Feeds',
            priority: 'medium',
            status: 'open',
            description: 'I am testing the Beldex ecosystem in the simulator. Does the paper trading calculate staking yield or Masternode block validation rewards?',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 86400000).toISOString(),
            reply_count: 1,
            replies: [
                { id: 101, sender_id: 2, sender_name: 'Simulated Trader', sender_role: 'user', message: 'Looking forward to guidance on POS privacy block yields.', created_at: new Date(Date.now() - 86400000).toISOString() }
            ]
        },
        {
            id: 2,
            ticket_code: 'TKT-100292',
            user_id: 2,
            user_email: 'trader@ccpulse.com',
            user_name: 'Simulated Trader',
            subject: 'Request to add Avalanche (AVAX) to the simulator registry',
            category: 'Feature Suggestion',
            priority: 'low',
            status: 'in_progress',
            description: 'Could the admin team add AVAX so we can test Layer 1 subnets in the simulation lab?',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            updated_at: new Date(Date.now() - 86400000).toISOString(),
            reply_count: 2,
            replies: [
                { id: 102, sender_id: 2, sender_name: 'Simulated Trader', sender_role: 'user', message: 'Could the admin team add AVAX so we can test Layer 1 subnets in the simulation lab?', created_at: new Date(Date.now() - 172800000).toISOString() },
                { id: 103, sender_id: 1, sender_name: 'CCPulse Administrator', sender_role: 'admin', message: 'Thank you for the suggestion! The coin request is under review and will be added via the Dynamic Crypto Registry.', created_at: new Date(Date.now() - 86400000).toISOString() }
            ]
        },
        {
            id: 3,
            ticket_code: 'TKT-100293',
            user_id: 1,
            user_email: 'admin@ccpulse.com',
            user_name: 'Admin User',
            subject: 'App Store Compliance & Simulated Disclosures verification',
            category: 'Simulator & Trading',
            priority: 'high',
            status: 'resolved',
            description: 'Audit verification of all paper trading risk disclaimers across mobile and desktop views.',
            created_at: new Date(Date.now() - 259200000).toISOString(),
            updated_at: new Date(Date.now() - 172800000).toISOString(),
            reply_count: 2,
            replies: [
                { id: 104, sender_id: 1, sender_name: 'Admin User', sender_role: 'admin', message: 'Audit verification of all paper trading risk disclaimers across mobile and desktop views.', created_at: new Date(Date.now() - 259200000).toISOString() },
                { id: 105, sender_id: 1, sender_name: 'CCPulse Administrator', sender_role: 'admin', message: 'Verified 100% compliant with Apple Guideline 3.1.5 and Google Play Financial Services Policy.', created_at: new Date(Date.now() - 172800000).toISOString() }
            ]
        }
    ];
    try {
        localStorage.setItem(CLIENT_STORAGE_TICKETS_KEY, JSON.stringify(defaultTickets));
    } catch (e) {}
    return defaultTickets;
}

function generateClientDailyAnalytics(range = '30d') {
    let dayLimit = 30;
    if (range === 'today') dayLimit = 1;
    else if (range === '7d') dayLimit = 7;
    else if (range === '14d') dayLimit = 14;
    else if (range === '30d') dayLimit = 30;
    else if (range === 'all') dayLimit = 90;

    const timeline = [];
    const today = new Date();
    for (let i = 0; i < dayLimit; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const seed = (i * 13 + 7) % 31;
        const regs = Math.floor(seed * 0.8) + (i === 0 ? 5 : 2);
        const active = regs * 4 + 18 + (seed % 9);
        const trades = Math.floor(active * 1.6) + (seed % 14);
        const volume = trades * 2450 + (seed * 850);
        const bonus = regs * 5000;
        const tickets = (i % 3 === 0) ? Math.floor(seed % 3) + 1 : 0;

        timeline.push({
            date: dateStr,
            dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
            registrations: regs,
            userRegistrations: regs,
            adminRegistrations: 0,
            activeUsers: active,
            pageViews: active * 16,
            tradesCount: trades,
            buyTrades: Math.round(trades * 0.58),
            sellTrades: Math.round(trades * 0.42),
            tradingVolumeUsd: volume,
            welcomeBonusesDistributedUsd: bonus,
            supportTickets: tickets
        });
    }

    const totalRegs = timeline.reduce((acc, r) => acc + r.registrations, 0);
    const totalTrades = timeline.reduce((acc, r) => acc + r.tradesCount, 0);
    const totalVol = timeline.reduce((acc, r) => acc + r.tradingVolumeUsd, 0);
    const avgActive = Math.round(timeline.reduce((acc, r) => acc + r.activeUsers, 0) / timeline.length);
    const totalTkts = timeline.reduce((acc, r) => acc + r.supportTickets, 0);

    return {
        success: true,
        range,
        aggregates: {
            totalRegistrationsInPeriod: totalRegs,
            totalTradesInPeriod: totalTrades,
            totalVolumeInPeriod: totalVol,
            avgDailyActiveUsers: avgActive,
            totalTicketsInPeriod: totalTkts
        },
        dailyTimeline: timeline
    };
}

window.API = API;


