/**
 * CCPulse Dashboard View
 */
const DashboardView = {
    async render(container) {
        let cryptos = [];
        try {
            const res = await API.cryptos.list();
            cryptos = res.cryptos || [];
            State.cryptos = cryptos;
        } catch (e) {
            cryptos = State.cryptos || [];
        }

        const bonusFormatted = Currency.format(5000);
        const activeCurrency = Currency.getActiveCode();

        const tickerHtml = cryptos.slice(0, 5).map(c => {
            const price = Currency.formatCryptoPrice(c.current_price_usd);
            const changeClass = c.change_24h >= 0 ? 'text-success' : 'text-danger';
            const changeIcon = c.change_24h >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
            const logo = State.getCoinLogo(c);
            return `
                <div class="ticker-item" style="display: flex; align-items: center; gap: 8px; padding: 6px 14px; background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: var(--border-radius-full); font-size: 0.85rem; flex-shrink: 0;">
                    <img src="${logo}" alt="${c.name}" class="crypto-logo" style="width: 20px; height: 20px; min-width: 20px; min-height: 20px;" onerror="this.onerror=null; this.src='/assets/coins/generic.svg'">
                    <span style="font-weight: 700;">${c.symbol}</span>
                    <span class="font-mono">${price}</span>
                    <span class="${changeClass}" style="font-size: 0.78rem; font-weight: 600;">
                        <i class="fa-solid ${changeIcon}"></i> ${c.change_24h >= 0 ? '+' : ''}${c.change_24h}%
                    </span>
                </div>
            `;
        }).join('');

        const cardsHtml = cryptos.slice(0, 5).map(c => {
            const price = Currency.formatCryptoPrice(c.current_price_usd);
            const changeClass = c.change_24h >= 0 ? 'text-success' : 'text-danger';
            const mcap = Currency.format(c.market_cap_usd);
            const logo = State.getCoinLogo(c);

            return `
                <div class="glass-card" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <img src="${logo}" alt="${c.name}" class="crypto-logo" style="width: 40px; height: 40px; min-width: 40px; min-height: 40px;" onerror="this.onerror=null; this.src='/assets/coins/generic.svg'">
                                <div>
                                    <div style="font-weight: 700; font-size: 1.05rem;">${c.name}</div>
                                    <div style="font-size: 0.8rem; color: var(--text-muted);">${c.symbol} &bull; ${c.blockchain.split(' ')[0]}</div>
                                </div>
                            </div>
                            <span class="${changeClass}" style="font-weight: 700; font-size: 0.9rem; padding: 4px 8px; border-radius: 6px; background: rgba(255,255,255,0.03);">
                                ${c.change_24h >= 0 ? '+' : ''}${c.change_24h}%
                            </span>
                        </div>
                        <div style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-mono); margin-bottom: 6px;">
                            ${price}
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 16px;">
                            Mkt Cap: <span class="font-mono">${mcap}</span>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <a href="#crypto/${c.symbol}" class="btn btn-outline" style="font-size: 0.82rem; padding: 6px 10px;">
                            <i class="fa-solid fa-chart-line"></i> Profile
                        </a>
                        <a href="#simulator?coin=${c.symbol}" class="btn btn-primary" style="font-size: 0.82rem; padding: 6px 10px;">
                            <i class="fa-solid fa-bolt"></i> Sim Trade
                        </a>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <!-- Ticker Ribbon -->
            <div style="display: flex; gap: 12px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 24px; -webkit-overflow-scrolling: touch;">
                ${tickerHtml}
            </div>

            <!-- Hero Section -->
            <section class="hero-section" style="background: radial-gradient(circle at top right, rgba(0, 240, 255, 0.12), transparent 60%), var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--border-radius-lg); padding: 44px 36px; margin-bottom: 36px;">
                <div style="max-width: 800px;">
                    <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.25); color: var(--color-primary); padding: 4px 12px; border-radius: var(--border-radius-full); font-size: 0.82rem; font-weight: 700; margin-bottom: 16px;">
                        <i class="fa-solid fa-shield-halved"></i> 100% Zero Financial Risk &bull; Educational Platform
                    </div>
                    <h1 class="hero-title" style="font-size: clamp(1.8rem, 4vw, 3rem); font-weight: 900; line-height: 1.15; margin-bottom: 16px; letter-spacing: -1px;">
                        Master Cryptocurrency Markets with <span class="pulse-text">Simulated Confidence</span>
                    </h1>
                    <p style="font-size: 1.1rem; line-height: 1.6; color: var(--text-secondary); margin-bottom: 24px;">
                        Practice real-time trading with a guaranteed <strong style="color: var(--color-success);">${bonusFormatted}</strong> virtual welcome bonus. Explore privacy blockchains (Monero, Beldex), stress-test portfolio risk scenarios, and track dynamic multi-currency valuations in <strong>${activeCurrency}</strong>.
                    </p>
                    <div style="display: flex; gap: 14px; flex-wrap: wrap;">
                        ${State.currentUser ? `
                            <a href="#simulator" class="btn btn-primary" style="font-size: 1rem; padding: 12px 24px;">
                                <i class="fa-solid fa-chart-candlestick"></i> Go to Simulator
                            </a>
                            <a href="#portfolio" class="btn btn-outline" style="font-size: 1rem; padding: 12px 24px;">
                                <i class="fa-solid fa-wallet"></i> My Virtual Portfolio
                            </a>
                        ` : `
                            <button type="button" class="btn btn-primary" onclick="AuthModals.showRegister()" style="font-size: 1rem; padding: 12px 24px;">
                                <i class="fa-solid fa-gift"></i> Register & Claim ${bonusFormatted}
                            </button>
                            <button type="button" class="btn btn-guest" onclick="State.setGuest(); window.location.hash='#simulator';" style="font-size: 1rem; padding: 12px 24px;">
                                <i class="fa-solid fa-user-secret"></i> Continue as Guest
                            </button>
                            <button type="button" class="btn btn-outline" onclick="AuthModals.showLogin()" style="font-size: 1rem; padding: 12px 24px;">
                                <i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In
                            </button>
                        `}
                    </div>
                </div>
            </section>

            <!-- Spotlight Grid -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
                <div>
                    <h2 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 4px;">Supported Digital Assets</h2>
                    <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.78rem; color: #10B981; font-weight: 600;">
                        <span style="width: 7px; height: 7px; border-radius: 50%; background: #10B981; box-shadow: 0 0 6px #10B981; display: inline-block;"></span>
                        Live CoinGecko Data Feed &bull; Auto-synced
                    </div>
                </div>
                <a href="#markets" style="font-size: 0.9rem; color: var(--color-primary); font-weight: 600;">
                    View All Markets <i class="fa-solid fa-arrow-right"></i>
                </a>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px;">
                ${cardsHtml}
            </div>

            <!-- Educational Pillars Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
                <div class="glass-card" style="padding: 24px;">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(0, 240, 255, 0.1); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; margin-bottom: 16px;">
                        <i class="fa-solid fa-flask-vial"></i>
                    </div>
                    <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 8px;">Market Simulation Lab</h3>
                    <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px;">
                        Simulate historic events like Bitcoin halvings, flash crash liquidation cascades, and regulatory announcements against your virtual holdings.
                    </p>
                    <a href="#simulation-lab" style="color: var(--color-primary); font-weight: 600; font-size: 0.88rem;">
                        Open Simulation Lab <i class="fa-solid fa-chevron-right"></i>
                    </a>
                </div>

                <div class="glass-card" style="padding: 24px;">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(139, 92, 246, 0.1); color: var(--color-purple); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; margin-bottom: 16px;">
                        <i class="fa-solid fa-user-shield"></i>
                    </div>
                    <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 8px;">Privacy Blockchains Focus</h3>
                    <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px;">
                        Understand zero-knowledge cryptography, stealth addresses, RingCT on Monero, and Masternode ecosystems on Beldex.
                    </p>
                    <a href="#learning" style="color: var(--color-purple); font-weight: 600; font-size: 0.88rem;">
                        Explore Privacy Courses <i class="fa-solid fa-chevron-right"></i>
                    </a>
                </div>

                <div class="glass-card" style="padding: 24px;">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(16, 185, 129, 0.1); color: var(--color-success); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; margin-bottom: 16px;">
                        <i class="fa-solid fa-shield-virus"></i>
                    </div>
                    <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 8px;">Safety & Scam Defense</h3>
                    <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px;">
                        Learn how to identify phishing attempts, smart contract honeypots, seed phrase vulnerability pitfalls, and verify on-chain safety.
                    </p>
                    <a href="#safety-center" style="color: var(--color-success); font-weight: 600; font-size: 0.88rem;">
                        Visit Safety Center <i class="fa-solid fa-chevron-right"></i>
                    </a>
                </div>
            </div>
        `;
    }
};

window.DashboardView = DashboardView;

