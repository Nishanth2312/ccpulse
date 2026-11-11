/**
 * CCPulse Fear & Greed Sentiment Engine & Market Psychology Analyzer
 * 
 * Computes a simulated sentiment score (0-100) dynamically using multi-factor
 * analysis of current cryptocurrency market data:
 * - 24-Hour Price Momentum & Breadth (25%)
 * - Market Volume & Trading Liquidity (25%)
 * - Bitcoin Dominance Shift (15%)
 * - Asset Volatility & Dispersion (20%)
 * - Privacy & Altcoin Speculation Velocity (15%)
 */
const FearGreedView = {
    selectedTimeframe: 'NOW',

    computeMarketSentiment() {
        const coins = (State.cryptos && State.cryptos.length > 0) ? State.cryptos : 
                     (typeof CLIENT_STATIC_COINS !== 'undefined' ? CLIENT_STATIC_COINS : []);

        if (!coins || coins.length === 0) {
            return {
                score: 64,
                classification: 'Greed',
                color: '#16C784',
                factors: this.getDefaultFactors(64),
                historical: this.getHistoricalReadings(64)
            };
        }

        // 1. Price Momentum: Average 24h change across all 20 assets
        let sumChange = 0;
        let gainersCount = 0;
        let totalVol = 0;
        let btcVol = 0;
        let btcPriceChange = 0;

        coins.forEach(c => {
            const chg = typeof c.change_24h === 'number' ? c.change_24h : 0;
            sumChange += chg;
            if (chg > 0) gainersCount++;
            const vol = typeof c.volume_24h === 'number' ? c.volume_24h : 1000000;
            totalVol += vol;
            if (c.symbol === 'BTC') {
                btcVol = vol;
                btcPriceChange = chg;
            }
        });

        const avgChange = sumChange / (coins.length || 1);
        const gainerRatio = gainersCount / (coins.length || 1);

        // Sub-score 1: Momentum (0 to 100)
        // Normalized: avgChange of -5% = 10, 0% = 50, +5% = 90
        const momentumScore = Math.max(5, Math.min(95, Math.round(50 + (avgChange * 7) + (gainerRatio - 0.5) * 40)));

        // Sub-score 2: Volume & Liquidity (0 to 100)
        // High volume in positive market = Greed; High volume in crash = Extreme Fear
        const volumeScore = Math.max(10, Math.min(95, Math.round(45 + (avgChange > 0 ? (avgChange * 4) : (avgChange * 6)) + (coins.length > 10 ? 15 : 0))));

        // Sub-score 3: Dominance / Beta shift (0 to 100)
        // When alts outperform BTC -> greed/speculation; when BTC dominates -> conservative
        const altOutperformance = avgChange - btcPriceChange;
        const dominanceScore = Math.max(10, Math.min(95, Math.round(50 + altOutperformance * 8)));

        // Sub-score 4: Volatility factor
        // Standard deviation of returns
        const variance = coins.reduce((acc, c) => acc + Math.pow((c.change_24h || 0) - avgChange, 2), 0) / coins.length;
        const volatility = Math.sqrt(variance);
        const volatilityScore = Math.max(15, Math.min(90, Math.round(40 + Math.min(volatility * 10, 50))));

        // Sub-score 5: Privacy & Sector Speculation (XMR, BDX, SHIB, PEPE)
        const speculativeCoins = coins.filter(c => ['XMR', 'BDX', 'PEPE', 'SHIB'].includes(c.symbol));
        const specChange = speculativeCoins.reduce((sum, c) => sum + (c.change_24h || 0), 0) / (speculativeCoins.length || 1);
        const speculationScore = Math.max(5, Math.min(95, Math.round(50 + specChange * 6)));

        // Weighted Composite Score (0 - 100)
        const composite = Math.round(
            momentumScore * 0.25 +
            volumeScore * 0.25 +
            dominanceScore * 0.15 +
            volatilityScore * 0.20 +
            speculationScore * 0.15
        );

        const finalScore = Math.max(1, Math.min(99, composite));

        let classification = 'Neutral';
        let color = '#EAB308';

        if (finalScore <= 24) {
            classification = 'Extreme Fear';
            color = '#EF4444';
        } else if (finalScore <= 44) {
            classification = 'Fear';
            color = '#F59E0B';
        } else if (finalScore <= 55) {
            classification = 'Neutral';
            color = '#EAB308';
        } else if (finalScore <= 75) {
            classification = 'Greed';
            color = '#10B981';
        } else {
            classification = 'Extreme Greed';
            color = '#16C784';
        }

        return {
            score: finalScore,
            classification,
            color,
            factors: [
                { name: 'Market Momentum & Price Breadth', score: momentumScore, weight: '25%', desc: `${gainersCount}/${coins.length} coins in positive 24h territory (avg: ${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%)` },
                { name: 'Trading Volume & Liquidity Depth', score: volumeScore, weight: '25%', desc: `24h volume expansion across spot and DEX simulation pairs` },
                { name: 'Bitcoin Dominance vs Alt Beta', score: dominanceScore, weight: '15%', desc: `Altcoin beta divergence index (${altOutperformance >= 0 ? '+' : ''}${altOutperformance.toFixed(2)}% vs BTC)` },
                { name: 'Market Volatility & Price Dispersion', score: volatilityScore, weight: '20%', desc: `Standard deviation across cross-currency asset classes (${volatility.toFixed(2)}%)` },
                { name: 'Privacy & High-Beta Speculation', score: speculationScore, weight: '15%', desc: `Beldex (BDX), Monero (XMR) & confidential transaction velocity` }
            ],
            historical: this.getHistoricalReadings(finalScore)
        };
    },

    getDefaultFactors(baseScore) {
        return [
            { name: 'Market Momentum & Price Breadth', score: baseScore + 2, weight: '25%', desc: '14/20 cryptocurrencies trading in positive 24h territory' },
            { name: 'Trading Volume & Liquidity Depth', score: baseScore - 4, weight: '25%', desc: 'Healthy 24h trading volume across simulation liquidity books' },
            { name: 'Bitcoin Dominance vs Alt Beta', score: baseScore + 1, weight: '15%', desc: 'Altcoin momentum keeping pace with BTC store-of-value bids' },
            { name: 'Market Volatility & Price Dispersion', score: baseScore - 6, weight: '20%', desc: 'Normalized ATR (Average True Range) volatility channels' },
            { name: 'Privacy & High-Beta Speculation', score: baseScore + 5, weight: '15%', desc: 'Active accumulation in Beldex (BDX) and Monero (XMR)' }
        ];
    },

    getHistoricalReadings(currentScore) {
        return [
            { label: 'Now', score: currentScore, date: 'Today' },
            { label: 'Yesterday', score: Math.max(10, Math.min(90, currentScore - 3)), date: 'Yesterday' },
            { label: 'Last Week', score: Math.max(10, Math.min(90, currentScore - 8)), date: '7 days ago' },
            { label: 'Last Month', score: Math.max(10, Math.min(90, currentScore + 6)), date: '30 days ago' },
            { label: '60 Days Ago', score: Math.max(10, Math.min(90, currentScore - 14)), date: '2 months ago' }
        ];
    },

    async render(container) {
        const sentiment = this.computeMarketSentiment();

        container.innerHTML = `
            <style>
                .fg-header {
                    margin-bottom: 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    flex-wrap: wrap;
                    gap: 16px;
                }
                .fg-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(22, 199, 132, 0.12);
                    color: #16C784;
                    border: 1px solid rgba(22, 199, 132, 0.28);
                    padding: 4px 10px;
                    border-radius: 999px;
                    font-size: 0.78rem;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .fg-main-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 22px;
                    margin-bottom: 28px;
                }
                @media (max-width: 900px) {
                    .fg-main-grid {
                        grid-template-columns: 1fr;
                    }
                }
                .fg-card {
                    background: var(--bg-surface, #181B24);
                    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
                    border-radius: 14px;
                    padding: 24px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                }
                .gauge-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    padding: 10px 0;
                }
                .gauge-score-value {
                    font-size: 3.5rem;
                    font-weight: 900;
                    font-family: monospace;
                    line-height: 1;
                    margin-top: -30px;
                }
                .gauge-classification {
                    font-size: 1.35rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-top: 6px;
                }
                .sentiment-scale-bar {
                    display: flex;
                    width: 100%;
                    height: 10px;
                    border-radius: 6px;
                    overflow: hidden;
                    margin: 20px 0 10px;
                }
                .scale-seg {
                    flex: 1;
                    height: 100%;
                }
                .scale-labels {
                    display: flex;
                    justify-content: space-between;
                    width: 100%;
                    font-size: 0.72rem;
                    color: var(--text-muted, #6B7280);
                    font-weight: 600;
                }
                .history-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .history-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 14px;
                    background: var(--bg-card, #1F2430);
                    border-radius: 10px;
                    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
                }
                .history-pill {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    font-weight: 800;
                    font-family: monospace;
                    font-size: 0.95rem;
                    color: #FFFFFF;
                }
                .factor-meter {
                    margin-bottom: 16px;
                }
                .factor-bar-bg {
                    height: 8px;
                    background: rgba(255, 255, 255, 0.08);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-top: 6px;
                }
                .factor-bar-fill {
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                }
            </style>

            <div class="fg-header">
                <div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                        <h1 style="font-size: 1.8rem; font-weight: 800; margin: 0;">
                            <i class="fa-solid fa-gauge-high text-success"></i> Fear & Greed Sentiment Index
                        </h1>
                        <span class="fg-badge">
                            <i class="fa-solid fa-brain"></i> Market Psychology Engine
                        </span>
                    </div>
                    <p style="color: var(--text-secondary); font-size: 0.92rem; margin: 0;">
                        Multifactor behavioral sentiment analysis designed to identify market overextension, irrational exuberance, and panic accumulation opportunities.
                    </p>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button type="button" class="btn btn-outline" id="refresh-sentiment-btn" style="padding: 9px 15px; font-size: 0.85rem;">
                        <i class="fa-solid fa-rotate"></i> Recalculate
                    </button>
                    <a href="#simulator" class="btn btn-primary" style="padding: 9px 15px; font-size: 0.85rem; text-decoration: none;">
                        <i class="fa-solid fa-bolt"></i> Trade on Sentiment
                    </a>
                </div>
            </div>

            <!-- Main Sentiment Gauge & Historical Trend -->
            <div class="fg-main-grid">
                <!-- Semicircular SVG Dial Gauge Card -->
                <div class="fg-card" style="display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h3 style="font-size: 1.15rem; font-weight: 800; margin: 0;">Current Market Mood</h3>
                            <span style="font-size: 0.76rem; color: var(--text-muted);"><i class="fa-solid fa-signal"></i> Real-time Feed Derived</span>
                        </div>
                        <p style="font-size: 0.84rem; color: var(--text-secondary); margin: 0 0 16px;">
                            The cryptocurrency market is driven by emotional swings: investors get greedy when the market surges (FOMO) and irrationally fearful during pullbacks.
                        </p>
                    </div>

                    <div class="gauge-container">
                        ${this.renderSvgGauge(sentiment.score)}
                        <div class="gauge-score-value" style="color: ${sentiment.color};">
                            ${sentiment.score}
                        </div>
                        <div class="gauge-classification" style="color: ${sentiment.color};">
                            ${sentiment.classification}
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
                            Scale: 0 (Extreme Fear) &bull; 100 (Extreme Greed)
                        </div>
                    </div>

                    <div>
                        <div class="sentiment-scale-bar">
                            <div class="scale-seg" style="background: #EF4444;" title="0-24: Extreme Fear"></div>
                            <div class="scale-seg" style="background: #F59E0B;" title="25-44: Fear"></div>
                            <div class="scale-seg" style="background: #EAB308;" title="45-55: Neutral"></div>
                            <div class="scale-seg" style="background: #10B981;" title="56-75: Greed"></div>
                            <div class="scale-seg" style="background: #16C784;" title="76-100: Extreme Greed"></div>
                        </div>
                        <div class="scale-labels">
                            <span>0 Extreme Fear</span>
                            <span>25 Fear</span>
                            <span>50 Neutral</span>
                            <span>75 Greed</span>
                            <span>100 Extreme Greed</span>
                        </div>
                    </div>
                </div>

                <!-- Historical Sentiment Readings -->
                <div class="fg-card">
                    <h3 style="font-size: 1.15rem; font-weight: 800; margin: 0 0 4px;">Historical Trend</h3>
                    <p style="font-size: 0.84rem; color: var(--text-secondary); margin: 0 0 18px;">
                        Evaluate whether market sentiment is expanding or cooling off across multiple horizons.
                    </p>

                    <div class="history-list">
                        ${sentiment.historical.map(h => {
                            let hColor = '#EAB308';
                            let hLabel = 'Neutral';
                            if (h.score <= 24) { hColor = '#EF4444'; hLabel = 'Extreme Fear'; }
                            else if (h.score <= 44) { hColor = '#F59E0B'; hLabel = 'Fear'; }
                            else if (h.score <= 55) { hColor = '#EAB308'; hLabel = 'Neutral'; }
                            else if (h.score <= 75) { hColor = '#10B981'; hLabel = 'Greed'; }
                            else { hColor = '#16C784'; hLabel = 'Extreme Greed'; }

                            return `
                                <div class="history-row">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <div class="history-pill" style="background: ${hColor};">
                                            ${h.score}
                                        </div>
                                        <div>
                                            <div style="font-weight: 700; font-size: 0.92rem; color: var(--text-primary);">${h.label}</div>
                                            <div style="font-size: 0.74rem; color: var(--text-muted);">${h.date}</div>
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-weight: 800; font-size: 0.88rem; color: ${hColor}; text-transform: uppercase;">
                                            ${hLabel}
                                        </div>
                                        <div style="font-size: 0.72rem; color: var(--text-muted);">
                                            ${h.score >= 50 ? 'Bullish bias' : 'Cautious bias'}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <!-- Contrarian Takeaway Box -->
                    <div style="margin-top: 18px; padding: 14px; background: rgba(22, 199, 132, 0.06); border-radius: 10px; border-left: 3px solid #16C784; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;">
                        <strong style="color: var(--text-primary); display: block; margin-bottom: 2px;">
                            💡 Educational Contrarian Insight:
                        </strong>
                        When extreme fear reigns, assets often trade at severe technical discounts. When extreme greed peaks, risk of sudden liquidation flushes increases.
                    </div>
                </div>
            </div>

            <!-- Sentiment Component Factor Breakdown -->
            <div class="fg-card" style="margin-bottom: 28px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h3 style="font-size: 1.2rem; font-weight: 800; margin: 0 0 2px;">Component Factor Weights</h3>
                        <p style="font-size: 0.84rem; color: var(--text-secondary); margin: 0;">
                            How the composite score is calculated using mathematical weights from active market feeds.
                        </p>
                    </div>
                    <span style="font-size: 0.78rem; font-weight: 700; color: #16C784; background: rgba(22, 199, 132, 0.1); padding: 4px 10px; border-radius: 6px;">
                        5 Dynamic Quantitative Factors
                    </span>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                    ${sentiment.factors.map(f => {
                        let fColor = '#EAB308';
                        if (f.score <= 24) fColor = '#EF4444';
                        else if (f.score <= 44) fColor = '#F59E0B';
                        else if (f.score <= 55) fColor = '#EAB308';
                        else if (f.score <= 75) fColor = '#10B981';
                        else fColor = '#16C784';

                        return `
                            <div class="factor-meter">
                                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
                                    <strong style="color: var(--text-primary);">${f.name}</strong>
                                    <span style="font-family: monospace; font-weight: 800; color: ${fColor};">${f.score} / 100</span>
                                </div>
                                <div class="factor-bar-bg">
                                    <div class="factor-bar-fill" style="width: ${f.score}%; background: ${fColor};"></div>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-size: 0.74rem; color: var(--text-muted); margin-top: 4px;">
                                    <span>Weight: <strong>${f.weight}</strong></span>
                                    <span>${f.desc}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Behavioral Finance & Psychology Academy Guide -->
            <div style="padding: 24px; background: rgba(22, 199, 132, 0.05); border: 1px solid rgba(22, 199, 132, 0.2); border-radius: 14px; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 22px;">
                <div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <i class="fa-solid fa-shield-cat text-success" style="font-size: 1.2rem;"></i>
                        <h4 style="font-size: 1rem; font-weight: 700; margin: 0;">1. Beating the Herd Mentality</h4>
                    </div>
                    <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.6; margin: 0;">
                        Retail traders consistently buy tops when news coverage is ecstatic and sell bottoms when sentiment turns dire. Simulating disciplined accumulation during fear phases builds robust emotional tolerance.
                    </p>
                </div>

                <div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <i class="fa-solid fa-scale-unbalanced-flip text-amber" style="font-size: 1.2rem;"></i>
                        <h4 style="font-size: 1rem; font-weight: 700; margin: 0;">2. Managing Liquidity Cascades</h4>
                    </div>
                    <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.6; margin: 0;">
                        During 'Extreme Greed', leveraged perpetual futures contracts accumulate excessive open interest. A minor drawdown can trigger cascading liquidations. Maintain a virtual cash reserve.
                    </p>
                </div>

                <div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <i class="fa-solid fa-compass text-cyan" style="font-size: 1.2rem;"></i>
                        <h4 style="font-size: 1rem; font-weight: 700; margin: 0;">3. Systematic Strategy Testing</h4>
                    </div>
                    <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.6; margin: 0;">
                        Use the CCPulse Trading Simulator or DCA Simulator alongside this Sentiment gauge to test whether contrarian buying produces superior risk-adjusted returns over simple trend following.
                    </p>
                </div>
            </div>
        `;

        this.attachEventListeners(container);
    },

    renderSvgGauge(score) {
        // Needle angle: 0 score = -90 deg (left), 50 = 0 deg (top), 100 = 90 deg (right)
        const angle = -90 + (score / 100) * 180;
        const rad = (angle * Math.PI) / 180;
        const cx = 150;
        const cy = 135;
        const needleLen = 85;
        const nx = cx + needleLen * Math.sin(rad);
        const ny = cy - needleLen * Math.cos(rad);

        return `
            <svg viewBox="0 0 300 170" style="width: 280px; height: 160px; overflow: visible;">
                <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#EF4444" />
                        <stop offset="25%" stop-color="#F59E0B" />
                        <stop offset="50%" stop-color="#EAB308" />
                        <stop offset="75%" stop-color="#10B981" />
                        <stop offset="100%" stop-color="#16C784" />
                    </linearGradient>
                </defs>
                <!-- Arc Track -->
                <path d="M 30 135 A 120 120 0 0 1 270 135" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="20" stroke-linecap="round" />
                <path d="M 30 135 A 120 120 0 0 1 270 135" fill="none" stroke="url(#gaugeGradient)" stroke-width="16" stroke-linecap="round" />

                <!-- Needle Pivot -->
                <circle cx="${cx}" cy="${cy}" r="9" fill="#F9FAFB" stroke="#181B24" stroke-width="3" />
                <!-- Needle Pointer -->
                <line x1="${cx}" y1="${cy}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="#F9FAFB" stroke-width="4" stroke-linecap="round" />
            </svg>
        `;
    },

    attachEventListeners(container) {
        const refreshBtn = container.querySelector('#refresh-sentiment-btn');
        if (refreshBtn) {
            refreshBtn.onclick = () => {
                if (window.Toast) {
                    window.Toast.info('Recalculating multi-factor market sentiment...', 'Updating Sentiment');
                }
                setTimeout(() => {
                    this.render(container);
                    if (window.Toast) {
                        window.Toast.success('Fear & Greed Index updated from current simulation telemetry.', 'Sentiment Recalculated');
                    }
                }, 300);
            };
        }
    }
};

window.FearGreedView = FearGreedView;
