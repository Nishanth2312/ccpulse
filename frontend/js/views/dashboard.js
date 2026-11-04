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

            <!-- Hero & Live Showcase Split Grid -->
            <section style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 32px; align-items: center; margin-bottom: 40px;" class="responsive-grid-two-col">
                <!-- Left: Hero Text & Value Proposition -->
                <div style="background: radial-gradient(circle at top right, rgba(58, 134, 255, 0.12), transparent 70%), var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--border-radius-lg); padding: 36px 32px; box-shadow: var(--shadow-sm);">
                    <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(0, 230, 118, 0.1); border: 1px solid rgba(0, 230, 118, 0.25); color: var(--color-success); padding: 4px 14px; border-radius: var(--border-radius-full); font-size: 0.84rem; font-weight: 700; margin-bottom: 16px; font-family: var(--font-heading);">
                        <i class="fa-solid fa-shield-halved"></i> 100% Zero Financial Risk &bull; Educational Platform
                    </div>
                    <h1 class="hero-title" style="font-size: clamp(2rem, 3.8vw, 3.2rem); font-weight: 900; line-height: 1.15; margin-bottom: 16px; font-family: var(--font-heading); letter-spacing: -0.5px;">
                        Master Cryptocurrency Markets with <span class="pulse-text">Simulated Confidence</span>
                    </h1>
                    <p style="font-size: 1.08rem; line-height: 1.6; color: var(--text-secondary); margin-bottom: 24px; font-family: var(--font-family);">
                        Practice real-time trading with a guaranteed <strong style="color: var(--color-success);">${bonusFormatted}</strong> virtual welcome bonus. Explore privacy blockchains (Monero, Beldex), stress-test portfolio risk scenarios, and track dynamic multi-currency valuations in <strong>${activeCurrency}</strong>.
                    </p>
                    <div style="display: flex; gap: 14px; flex-wrap: wrap;">
                        ${State.currentUser ? `
                            <a href="#simulator" class="btn btn-primary" style="font-size: 1rem; padding: 12px 28px;">
                                <i class="fa-solid fa-chart-candlestick"></i> Go to Simulator
                            </a>
                            <a href="#portfolio" class="btn btn-outline" style="font-size: 1rem; padding: 12px 28px;">
                                <i class="fa-solid fa-wallet"></i> My Virtual Portfolio
                            </a>
                        ` : `
                            <button type="button" class="btn btn-primary" onclick="AuthModals.showRegister()" style="font-size: 1rem; padding: 12px 28px;">
                                <i class="fa-solid fa-gift"></i> Register & Claim ${bonusFormatted}
                            </button>
                            <button type="button" class="btn btn-outline" onclick="State.setGuest(); window.location.hash='#simulator';" style="font-size: 1rem; padding: 12px 28px;">
                                <i class="fa-solid fa-user-secret"></i> Continue as Guest
                            </button>
                        `}
                    </div>
                </div>

                <!-- Right: Mobile Trading Showcase Card (Matching Reference Design) -->
                <div class="phone-showcase-container">
                    <div class="phone-trading-card">
                        <!-- Card Header -->
                        <div class="phone-card-header">
                            <div>
                                <div class="phone-welcome-text">Welcome, ${State.currentUser ? State.currentUser.username : 'Trader'}</div>
                                <h2 class="phone-dashboard-title">Dashboard</h2>
                            </div>
                            <button type="button" class="phone-bell-btn" title="Notifications" onclick="window.location.hash='#notifications'">
                                <i class="fa-solid fa-bell"></i>
                            </button>
                        </div>

                        <!-- Coin Switcher Pills -->
                        <div class="phone-coin-pills" id="dashboard-coin-pills">
                            ${cryptos.slice(0, 5).map((c, i) => `
                                <button type="button" class="phone-coin-pill ${i === 0 ? 'active' : ''}" data-symbol="${c.symbol}">
                                    ${c.symbol}
                                </button>
                            `).join('')}
                        </div>

                        <!-- Dual Metric Cards -->
                        <div class="phone-metrics-row">
                            <div class="phone-metric-box">
                                <div class="phone-metric-price" id="showcase-current-price">
                                    1 ${cryptos[0]?.symbol || 'BTC'} = ${Currency.formatCryptoPrice(cryptos[0]?.current_price_usd || 78245)}
                                </div>
                                <div class="phone-metric-label text-success">
                                    Current Price <i class="fa-solid fa-arrow-trend-up"></i>
                                </div>
                            </div>
                            <div class="phone-metric-box">
                                <div class="phone-metric-price" id="showcase-prev-price">
                                    1 ${cryptos[0]?.symbol || 'BTC'} = ${Currency.formatCryptoPrice(cryptos[0]?.low_24h || 76800)}
                                </div>
                                <div class="phone-metric-label text-danger">
                                    24h Low <i class="fa-solid fa-arrow-trend-down"></i>
                                </div>
                            </div>
                        </div>

                        <!-- Timeframe Navigation Pills -->
                        <div class="phone-timeframe-pills" id="dashboard-tf-pills">
                            <button type="button" class="phone-tf-pill active" data-tf="MON">MON</button>
                            <button type="button" class="phone-tf-pill" data-tf="TUE">TUE</button>
                            <button type="button" class="phone-tf-pill" data-tf="WED">WED</button>
                            <button type="button" class="phone-tf-pill" data-tf="THU">THU</button>
                            <button type="button" class="phone-tf-pill" data-tf="FRI">FRI</button>
                        </div>

                        <!-- Interactive Wave Chart Area -->
                        <div class="phone-chart-wrapper">
                            <svg viewBox="0 0 380 150">
                                <defs>
                                    <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stop-color="var(--chart-line-color)" stop-opacity="0.32"/>
                                        <stop offset="100%" stop-color="var(--chart-line-color)" stop-opacity="0.0"/>
                                    </linearGradient>
                                </defs>
                                <!-- Smooth Bezier Wave -->
                                <path id="showcase-wave-area" d="M 0 110 Q 45 45, 90 95 T 180 65 T 270 45 T 380 85 L 380 150 L 0 150 Z" fill="url(#waveGradient)"/>
                                <path id="showcase-wave-stroke" d="M 0 110 Q 45 45, 90 95 T 180 65 T 270 45 T 380 85" fill="none" stroke="var(--chart-line-color)" stroke-width="3" stroke-linecap="round"/>
                                
                                <!-- Peak Callout Marker & Tooltip -->
                                <circle id="showcase-marker" cx="270" cy="45" r="5" fill="var(--chart-line-color)"/>
                                <g id="showcase-bubble" transform="translate(240, 12)">
                                    <rect width="64" height="24" rx="12" fill="var(--chart-tooltip-bg)"/>
                                    <text id="showcase-bubble-text" x="32" y="16" text-anchor="middle" font-size="11" font-weight="800" fill="var(--chart-tooltip-text)" font-family="var(--font-heading)">
                                        ${Currency.formatCryptoPrice(cryptos[0]?.current_price_usd || 78245).split('.')[0]}
                                    </text>
                                </g>
                            </svg>
                        </div>

                        <!-- Balance & Holdings Bar -->
                        <div class="phone-balance-section">
                            <div>
                                <div class="phone-balance-label">Your Balance</div>
                                <div class="phone-balance-amount" id="showcase-balance-amount">
                                    ${Currency.format(State.wallet ? State.wallet.availableCashUsd : (State.guestSession?.temporaryBalanceUsd || 5000))}
                                </div>
                            </div>
                            <div class="phone-holding-badge">
                                <img src="${State.getCoinLogo(cryptos[0])}" class="phone-coin-icon" id="showcase-coin-icon" onerror="this.onerror=null; this.src='./assets/coins/generic.svg'">
                                <span id="showcase-coin-qty">1.051530 ${cryptos[0]?.symbol || 'BTC'}</span>
                            </div>
                        </div>

                        <!-- Vibrant Action Buttons: BUY (Green) & SELL (Red) -->
                        <div class="phone-actions-row">
                            <button type="button" class="phone-action-btn phone-btn-buy" id="showcase-buy-btn">
                                <div class="btn-main-label"><i class="fa-solid fa-arrow-trend-up"></i> BUY</div>
                                <div class="btn-sub-label" id="showcase-buy-sub">1 ${cryptos[0]?.symbol || 'BTC'} = ${Currency.formatCryptoPrice(cryptos[0]?.current_price_usd || 78245)}</div>
                            </button>
                            <button type="button" class="phone-action-btn phone-btn-sell" id="showcase-sell-btn">
                                <div class="btn-main-label"><i class="fa-solid fa-arrow-trend-down"></i> SELL</div>
                                <div class="btn-sub-label" id="showcase-sell-sub">1 ${cryptos[0]?.symbol || 'BTC'} = ${Currency.formatCryptoPrice(cryptos[0]?.current_price_usd || 78245)}</div>
                            </button>
                        </div>
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

        // Attach Interactive Events for the Mobile Showcase Trading Card
        this.attachShowcaseEvents(container, cryptos);
    },

    attachShowcaseEvents(container, cryptos) {
        let activeCoin = cryptos[0] || { symbol: 'BTC', name: 'Bitcoin', current_price_usd: 78245, low_24h: 76800 };

        // Coin Switcher
        const coinPills = container.querySelectorAll('.phone-coin-pill');
        coinPills.forEach(pill => {
            pill.onclick = () => {
                coinPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');

                const sym = pill.getAttribute('data-symbol');
                activeCoin = cryptos.find(c => c.symbol === sym) || activeCoin;

                // Update prices
                const curPriceTag = container.querySelector('#showcase-current-price');
                const prevPriceTag = container.querySelector('#showcase-prev-price');
                const buySub = container.querySelector('#showcase-buy-sub');
                const sellSub = container.querySelector('#showcase-sell-sub');
                const coinIcon = container.querySelector('#showcase-coin-icon');
                const coinQty = container.querySelector('#showcase-coin-qty');
                const bubbleText = container.querySelector('#showcase-bubble-text');

                const priceFmt = Currency.formatCryptoPrice(activeCoin.current_price_usd);
                const lowFmt = Currency.formatCryptoPrice(activeCoin.low_24h || activeCoin.current_price_usd * 0.98);

                if (curPriceTag) curPriceTag.textContent = `1 ${activeCoin.symbol} = ${priceFmt}`;
                if (prevPriceTag) prevPriceTag.textContent = `1 ${activeCoin.symbol} = ${lowFmt}`;
                if (buySub) buySub.textContent = `1 ${activeCoin.symbol} = ${priceFmt}`;
                if (sellSub) sellSub.textContent = `1 ${activeCoin.symbol} = ${priceFmt}`;
                if (coinIcon) coinIcon.src = State.getCoinLogo(activeCoin);
                if (coinQty) coinQty.textContent = `${activeCoin.symbol === 'BTC' ? '1.051530' : (activeCoin.symbol === 'ETH' ? '1.603568' : '25.000000')} ${activeCoin.symbol}`;
                if (bubbleText) bubbleText.textContent = priceFmt.split('.')[0];
            };
        });

        // Timeframe Pills
        const tfPills = container.querySelectorAll('.phone-tf-pill');
        tfPills.forEach(pill => {
            pill.onclick = () => {
                tfPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');

                // Animate SVG wave
                const strokePath = container.querySelector('#showcase-wave-stroke');
                const areaPath = container.querySelector('#showcase-wave-area');
                const marker = container.querySelector('#showcase-marker');
                const bubble = container.querySelector('#showcase-bubble');

                const randomOffset = Math.floor(Math.random() * 25);
                const dStroke = `M 0 ${110 + randomOffset} Q 45 ${35 + randomOffset}, 90 ${90 - randomOffset} T 180 ${70 + randomOffset} T 270 ${40 - randomOffset} T 380 ${85 + randomOffset}`;
                const dArea = `${dStroke} L 380 150 L 0 150 Z`;

                if (strokePath) strokePath.setAttribute('d', dStroke);
                if (areaPath) areaPath.setAttribute('d', dArea);
                if (marker) {
                    marker.setAttribute('cy', (40 - randomOffset).toString());
                }
                if (bubble) {
                    bubble.setAttribute('transform', `translate(240, ${(10 - randomOffset).toString()})`);
                }
            };
        });

        // Action Buttons: Route to simulator with selected coin & type
        const buyBtn = container.querySelector('#showcase-buy-btn');
        const sellBtn = container.querySelector('#showcase-sell-btn');

        if (buyBtn) {
            buyBtn.onclick = () => {
                window.location.hash = `#simulator?coin=${activeCoin.symbol}&type=BUY`;
            };
        }
        if (sellBtn) {
            sellBtn.onclick = () => {
                window.location.hash = `#simulator?coin=${activeCoin.symbol}&type=SELL`;
            };
        }
    }
};

window.DashboardView = DashboardView;

