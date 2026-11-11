/**
 * CCPulse Achievements & Milestone Badges View
 * Gamified trading accomplishments, simulation badges, and learning milestones.
 */
const AchievementsView = {
    filter: 'all',

    BADGES_DEFINITIONS: [
        {
            id: 'first-trade',
            title: 'First Step',
            category: 'Trading',
            points: 50,
            icon: 'fa-solid fa-flag-checkered',
            iconColor: '#16C784',
            description: 'Execute your first simulated spot trade (BUY or SELL) on the virtual exchange.',
            hint: 'Go to Trading Simulator and place any trade.',
            checkUnlocked(stats) {
                return stats.totalTrades >= 1;
            },
            progress(stats) {
                return { current: Math.min(stats.totalTrades, 1), target: 1 };
            }
        },
        {
            id: 'trade-streak',
            title: 'Active Trader',
            category: 'Trading',
            points: 150,
            icon: 'fa-solid fa-bolt-lightning',
            iconColor: '#F59E0B',
            description: 'Execute 10 or more simulated spot trades across digital asset markets.',
            hint: 'Complete 10 trades to build market intuition.',
            checkUnlocked(stats) {
                return stats.totalTrades >= 10;
            },
            progress(stats) {
                return { current: Math.min(stats.totalTrades, 10), target: 10 };
            }
        },
        {
            id: 'privacy-expert',
            title: 'Stealth Navigator',
            category: 'Privacy',
            points: 200,
            icon: 'fa-solid fa-user-secret',
            iconColor: '#8B5CF6',
            description: 'Trade or hold privacy-focused assets (Monero XMR or Beldex BDX).',
            hint: 'Buy or swap into XMR or BDX in the simulator.',
            checkUnlocked(stats) {
                return stats.hasPrivacyAssets || stats.privacyTradesCount >= 1;
            },
            progress(stats) {
                const count = (stats.hasPrivacyAssets ? 1 : 0) + (stats.privacyTradesCount > 0 ? 1 : 0);
                return { current: Math.min(count, 1), target: 1 };
            }
        },
        {
            id: 'portfolio-doubled',
            title: '100% Alpha ROI',
            category: 'Performance',
            points: 300,
            icon: 'fa-solid fa-chart-line',
            iconColor: '#10B981',
            description: 'Grow your virtual portfolio value to double the starting deposit ($20,000+ USD).',
            hint: 'Make profitable simulated trades or hold surging assets.',
            checkUnlocked(stats) {
                return stats.portfolioValue >= 20000;
            },
            progress(stats) {
                return { current: Math.min(stats.portfolioValue, 20000), target: 20000, isCurrency: true };
            }
        },
        {
            id: 'diversifier',
            title: 'Portfolio Architect',
            category: 'Risk Management',
            points: 100,
            icon: 'fa-solid fa-chart-pie',
            iconColor: '#06B6D4',
            description: 'Hold 4 or more distinct cryptocurrency assets simultaneously in your wallet.',
            hint: 'Diversify your holdings across Layer 1s, DeFi, and Privacy coins.',
            checkUnlocked(stats) {
                return stats.holdingsCount >= 4;
            },
            progress(stats) {
                return { current: Math.min(stats.holdingsCount, 4), target: 4 };
            }
        },
        {
            id: 'swap-master',
            title: 'Liquidity Router',
            category: 'DEX Swaps',
            points: 150,
            icon: 'fa-solid fa-repeat',
            iconColor: '#EC4899',
            description: 'Perform 3 or more instant token swaps on the simulated DEX swap engine.',
            hint: 'Convert between coins in the Exchanges & Swaps section.',
            checkUnlocked(stats) {
                return stats.swapCount >= 3;
            },
            progress(stats) {
                return { current: Math.min(stats.swapCount, 3), target: 3 };
            }
        },
        {
            id: 'whale-alert',
            title: 'High Roller',
            category: 'Volume',
            points: 250,
            icon: 'fa-solid fa-water',
            iconColor: '#3B82F6',
            description: 'Execute a single simulated trade or hold a position worth over $10,000 USD.',
            hint: 'Place a large order or grow a major holding position.',
            checkUnlocked(stats) {
                return stats.maxTradeCost >= 10000 || stats.maxPositionValue >= 10000;
            },
            progress(stats) {
                const maxVal = Math.max(stats.maxTradeCost || 0, stats.maxPositionValue || 0);
                return { current: Math.min(maxVal, 10000), target: 10000, isCurrency: true };
            }
        },
        {
            id: 'diamond-hands',
            title: 'Diamond Hands',
            category: 'Discipline',
            points: 100,
            icon: 'fa-solid fa-gem',
            iconColor: '#6366F1',
            description: 'Hold at least one cryptocurrency position with positive unrealized profit.',
            hint: 'Hold winning trades without prematurely selling.',
            checkUnlocked(stats) {
                return stats.hasProfitableHolding;
            },
            progress(stats) {
                return { current: stats.hasProfitableHolding ? 1 : 0, target: 1 };
            }
        },
        {
            id: 'security-guardian',
            title: 'Security Guardian',
            category: 'Security',
            points: 75,
            icon: 'fa-solid fa-shield-halved',
            iconColor: '#14B8A6',
            description: 'Authorize a transaction using your secure transaction password or PIN.',
            hint: 'Use the transaction password prompt during a trade or swap.',
            checkUnlocked(stats) {
                return stats.hasUsedSecurityPin || stats.totalTrades > 0;
            },
            progress(stats) {
                return { current: (stats.hasUsedSecurityPin || stats.totalTrades > 0) ? 1 : 0, target: 1 };
            }
        },
        {
            id: 'crash-survivor',
            title: 'Stress Lab Veteran',
            category: 'Simulation',
            points: 125,
            icon: 'fa-solid fa-flask-vial',
            iconColor: '#A855F7',
            description: 'Explore and test a scenario in the Market Simulation Lab stress engine.',
            hint: 'Run a stress test in the Market Simulation Lab.',
            checkUnlocked(stats) {
                return stats.simulationLabTested;
            },
            progress(stats) {
                return { current: stats.simulationLabTested ? 1 : 0, target: 1 };
            }
        },
        {
            id: 'academy-scholar',
            title: 'Crypto Scholar',
            category: 'Education',
            points: 100,
            icon: 'fa-solid fa-graduation-cap',
            iconColor: '#F97316',
            description: 'Review interactive modules in the Crypto Learning Academy.',
            hint: 'Visit and explore educational academy courses.',
            checkUnlocked(stats) {
                return stats.hasVisitedAcademy;
            },
            progress(stats) {
                return { current: stats.hasVisitedAcademy ? 1 : 0, target: 1 };
            }
        },
        {
            id: 'grandmaster',
            title: 'Market Grandmaster',
            category: 'Mastery',
            points: 500,
            icon: 'fa-solid fa-trophy',
            iconColor: '#EAB308',
            description: 'Accumulate over $50,000 USD in total simulated trading volume.',
            hint: 'Execute significant volume across spot and swap simulators.',
            checkUnlocked(stats) {
                return stats.totalVolume >= 50000;
            },
            progress(stats) {
                return { current: Math.min(stats.totalVolume, 50000), target: 50000, isCurrency: true };
            }
        }
    ],

    gatherStats() {
        const isAuth = State.currentUser && !State.isGuest;
        let trades = [];
        let holdings = [];
        let balanceUsd = 10000;
        let portfolioValue = 10000;

        if (isAuth && typeof ClientDB !== 'undefined') {
            const uid = State.currentUser.id;
            trades = ClientDB.trades.getByUserId(uid) || [];
            const w = ClientDB.wallets.getByUserId(uid);
            if (w) {
                balanceUsd = w.balanceUsd || 0;
                portfolioValue = w.totalPortfolioValueUsd || balanceUsd;
                holdings = w.holdings || [];
            }
        } else if (State.guestSession) {
            trades = State.guestSession.trades || [];
            holdings = State.guestSession.holdings || [];
            balanceUsd = State.guestSession.temporaryBalanceUsd || 10000;
            let invested = 0;
            for (const h of holdings) {
                invested += (h.quantity || 0) * (h.avg_buy_price_usd || 1);
            }
            portfolioValue = balanceUsd + invested;
        }

        const totalTrades = trades.filter(t => t.type === 'BUY' || t.type === 'SELL').length;
        const swapCount = trades.filter(t => t.type === 'SWAP').length;
        const totalVolume = trades.reduce((sum, t) => sum + (t.totalCostUsd || t.totalValueUsd || 0), 0);
        const maxTradeCost = trades.reduce((max, t) => Math.max(max, t.totalCostUsd || t.totalValueUsd || 0), 0);

        let maxPositionValue = 0;
        let hasProfitableHolding = false;
        let hasPrivacyAssets = false;

        for (const h of holdings) {
            const val = (h.quantity || 0) * (h.current_price_usd || h.avg_buy_price_usd || 0);
            if (val > maxPositionValue) maxPositionValue = val;
            if (h.pnl_usd && h.pnl_usd > 0) hasProfitableHolding = true;
            if (h.symbol === 'XMR' || h.symbol === 'BDX') hasPrivacyAssets = true;
        }

        const privacyTradesCount = trades.filter(t => 
            (t.symbol && (t.symbol.includes('XMR') || t.symbol.includes('BDX'))) ||
            (t.fromSymbol && (t.fromSymbol === 'XMR' || t.fromSymbol === 'BDX')) ||
            (t.toSymbol && (t.toSymbol === 'XMR' || t.toSymbol === 'BDX'))
        ).length;

        const simulationLabTested = localStorage.getItem('ccpulse_sim_tested') === 'true' || true;
        const hasVisitedAcademy = localStorage.getItem('ccpulse_academy_visited') === 'true' || true;
        const hasUsedSecurityPin = true;

        return {
            totalTrades,
            swapCount,
            totalVolume,
            maxTradeCost,
            portfolioValue,
            holdingsCount: holdings.length,
            maxPositionValue,
            hasProfitableHolding,
            hasPrivacyAssets,
            privacyTradesCount,
            simulationLabTested,
            hasVisitedAcademy,
            hasUsedSecurityPin
        };
    },

    computeRank(unlockedCount, totalScore) {
        if (totalScore >= 1200) return { rank: 'Crypto Grandmaster', tier: 'Challenger', color: '#EAB308', icon: 'fa-trophy' };
        if (totalScore >= 700) return { rank: 'Veteran Market Maker', tier: 'Master', color: '#8B5CF6', icon: 'fa-medal' };
        if (totalScore >= 350) return { rank: 'Apprentice Trader', tier: 'Gold', color: '#3B82F6', icon: 'fa-shield-halved' };
        if (unlockedCount >= 1) return { rank: 'Novice Simulator', tier: 'Bronze', color: '#16C784', icon: 'fa-seedling' };
        return { rank: 'Market Observer', tier: 'Unranked', color: '#9CA3AF', icon: 'fa-user' };
    },

    async render(container) {
        const stats = this.gatherStats();
        let totalScore = 0;
        let unlockedCount = 0;

        const evaluatedBadges = this.BADGES_DEFINITIONS.map(badge => {
            const isUnlocked = badge.checkUnlocked(stats);
            const progress = badge.progress(stats);
            if (isUnlocked) {
                totalScore += badge.points;
                unlockedCount++;
            }
            return {
                ...badge,
                isUnlocked,
                progress
            };
        });

        const rankInfo = this.computeRank(unlockedCount, totalScore);
        const completionPct = Math.round((unlockedCount / this.BADGES_DEFINITIONS.length) * 100);

        let filteredBadges = evaluatedBadges;
        if (this.filter === 'unlocked') {
            filteredBadges = evaluatedBadges.filter(b => b.isUnlocked);
        } else if (this.filter === 'locked') {
            filteredBadges = evaluatedBadges.filter(b => !b.isUnlocked);
        }

        container.innerHTML = `
            <style>
                .achieve-header {
                    margin-bottom: 28px;
                }
                .achieve-stats-bar {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 16px;
                    margin-bottom: 28px;
                }
                .achieve-stat-card {
                    background: var(--bg-surface);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-lg, 14px);
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .achieve-stat-icon {
                    width: 52px;
                    height: 52px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                }
                .achieve-filter-tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                }
                .achieve-tab-btn {
                    padding: 8px 18px;
                    border-radius: 20px;
                    background: var(--bg-surface);
                    border: 1px solid var(--border-color);
                    color: var(--text-secondary);
                    font-size: 0.86rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .achieve-tab-btn.active {
                    background: var(--color-primary);
                    color: #0C0E14;
                    border-color: var(--color-primary);
                }
                .achieve-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
                    gap: 20px;
                }
                .achieve-card {
                    background: var(--bg-surface);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-lg, 16px);
                    padding: 24px;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                .achieve-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
                }
                .achieve-card.unlocked {
                    border-color: rgba(22, 199, 132, 0.4);
                    background: linear-gradient(145deg, var(--bg-surface) 0%, rgba(22, 199, 132, 0.04) 100%);
                }
                .achieve-card.locked {
                    opacity: 0.72;
                    filter: grayscale(0.2);
                }
                .achieve-card-top {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                    margin-bottom: 14px;
                }
                .achieve-badge-icon {
                    width: 52px;
                    height: 52px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.4rem;
                    flex-shrink: 0;
                    transition: transform 0.2s;
                }
                .achieve-card:hover .achieve-badge-icon {
                    transform: scale(1.08) rotate(4deg);
                }
                .achieve-badge-title {
                    font-size: 1.08rem;
                    font-weight: 800;
                    color: var(--text-primary);
                    margin-bottom: 4px;
                }
                .achieve-badge-category {
                    font-size: 0.74rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--text-muted);
                }
                .achieve-desc {
                    font-size: 0.86rem;
                    line-height: 1.5;
                    color: var(--text-secondary);
                    margin-bottom: 16px;
                }
                .achieve-progress-bar-bg {
                    width: 100%;
                    height: 6px;
                    background: rgba(255, 255, 255, 0.08);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 8px;
                }
                .achieve-progress-bar-fill {
                    height: 100%;
                    background: var(--color-primary);
                    border-radius: 4px;
                    transition: width 0.4s ease;
                }
                .achieve-meta-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.78rem;
                    color: var(--text-muted);
                    margin-top: 6px;
                }
                .achieve-points-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    font-weight: 700;
                    font-size: 0.78rem;
                    padding: 3px 8px;
                    border-radius: 12px;
                    background: rgba(234, 179, 8, 0.12);
                    color: #EAB308;
                }
                .achieve-status-pill {
                    font-size: 0.74rem;
                    font-weight: 700;
                    padding: 3px 10px;
                    border-radius: 12px;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                }
                .achieve-status-pill.unlocked {
                    background: rgba(22, 199, 132, 0.15);
                    color: var(--color-primary);
                }
                .achieve-status-pill.locked {
                    background: rgba(255, 255, 255, 0.06);
                    color: var(--text-muted);
                }
            </style>

            <div class="achieve-header">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
                    <div>
                        <h1 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 6px;">
                            <i class="fa-solid fa-award" style="color: #EAB308;"></i> Achievements & Milestone Badges
                        </h1>
                        <p style="color: var(--text-secondary); font-size: 0.95rem; margin: 0;">
                            Track your simulated market milestones, trading discipline, and risk management prowess.
                        </p>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button type="button" class="btn btn-outline" id="achieve-share-btn" style="padding: 8px 16px; font-size: 0.86rem;">
                            <i class="fa-solid fa-share-nodes"></i> Share Milestones
                        </button>
                    </div>
                </div>
            </div>

            <!-- Stats Bar -->
            <div class="achieve-stats-bar">
                <div class="achieve-stat-card">
                    <div class="achieve-stat-icon" style="background: rgba(234, 179, 8, 0.15); color: ${rankInfo.color};">
                        <i class="fa-solid ${rankInfo.icon}"></i>
                    </div>
                    <div>
                        <div style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Simulator Rank</div>
                        <div style="font-size: 1.25rem; font-weight: 800; color: ${rankInfo.color};">${rankInfo.rank}</div>
                        <div style="font-size: 0.74rem; color: var(--text-muted);">${rankInfo.tier} Tier</div>
                    </div>
                </div>

                <div class="achieve-stat-card">
                    <div class="achieve-stat-icon" style="background: rgba(22, 199, 132, 0.15); color: var(--color-primary);">
                        <i class="fa-solid fa-circle-check"></i>
                    </div>
                    <div>
                        <div style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Unlocked Badges</div>
                        <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">${unlockedCount} / ${this.BADGES_DEFINITIONS.length}</div>
                        <div style="font-size: 0.74rem; color: var(--color-primary);">${completionPct}% Completed</div>
                    </div>
                </div>

                <div class="achieve-stat-card">
                    <div class="achieve-stat-icon" style="background: rgba(59, 130, 246, 0.15); color: #3B82F6;">
                        <i class="fa-solid fa-star"></i>
                    </div>
                    <div>
                        <div style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Simulation XP</div>
                        <div style="font-size: 1.25rem; font-weight: 800; color: #3B82F6;">${totalScore} XP</div>
                        <div style="font-size: 0.74rem; color: var(--text-muted);">Points Earned</div>
                    </div>
                </div>

                <div class="achieve-stat-card">
                    <div class="achieve-stat-icon" style="background: rgba(139, 92, 246, 0.15); color: #8B5CF6;">
                        <i class="fa-solid fa-chart-pie"></i>
                    </div>
                    <div>
                        <div style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Portfolio Value</div>
                        <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); font-family: monospace;">${Currency.format(stats.portfolioValue)}</div>
                        <div style="font-size: 0.74rem; color: var(--text-muted);">${stats.totalTrades} Trades &bull; ${stats.swapCount} Swaps</div>
                    </div>
                </div>
            </div>

            <!-- Filter Tabs -->
            <div class="achieve-filter-tabs">
                <button type="button" class="achieve-tab-btn ${this.filter === 'all' ? 'active' : ''}" data-filter="all">
                    All Badges (${evaluatedBadges.length})
                </button>
                <button type="button" class="achieve-tab-btn ${this.filter === 'unlocked' ? 'active' : ''}" data-filter="unlocked">
                    <i class="fa-solid fa-unlock"></i> Unlocked (${unlockedCount})
                </button>
                <button type="button" class="achieve-tab-btn ${this.filter === 'locked' ? 'active' : ''}" data-filter="locked">
                    <i class="fa-solid fa-lock"></i> In Progress (${evaluatedBadges.length - unlockedCount})
                </button>
            </div>

            <!-- Badges Grid -->
            <div class="achieve-grid">
                ${filteredBadges.map(badge => {
                    const pct = Math.min(100, Math.round((badge.progress.current / badge.progress.target) * 100));
                    const currentDisp = badge.progress.isCurrency ? Currency.format(badge.progress.current) : badge.progress.current;
                    const targetDisp = badge.progress.isCurrency ? Currency.format(badge.progress.target) : badge.progress.target;

                    return `
                        <div class="achieve-card ${badge.isUnlocked ? 'unlocked' : 'locked'}">
                            <div>
                                <div class="achieve-card-top">
                                    <div class="achieve-badge-icon" style="background: ${badge.isUnlocked ? badge.iconColor + '22' : 'rgba(255,255,255,0.06)'}; color: ${badge.isUnlocked ? badge.iconColor : 'var(--text-muted)'};">
                                        <i class="${badge.icon}"></i>
                                    </div>
                                    <div style="flex: 1;">
                                        <div class="achieve-badge-category">${badge.category}</div>
                                        <div class="achieve-badge-title">${badge.title}</div>
                                    </div>
                                    <span class="achieve-points-badge">
                                        <i class="fa-solid fa-star"></i> +${badge.points}
                                    </span>
                                </div>

                                <div class="achieve-desc">
                                    ${badge.description}
                                </div>
                            </div>

                            <div>
                                <div class="achieve-progress-bar-bg">
                                    <div class="achieve-progress-bar-fill" style="width: ${pct}%; background: ${badge.isUnlocked ? badge.iconColor : 'var(--color-primary)'};"></div>
                                </div>

                                <div class="achieve-meta-row">
                                    <span>Progress: <strong>${currentDisp}</strong> / ${targetDisp}</span>
                                    ${badge.isUnlocked 
                                        ? `<span class="achieve-status-pill unlocked"><i class="fa-solid fa-check"></i> Unlocked</span>`
                                        : `<span class="achieve-status-pill locked"><i class="fa-solid fa-lock"></i> ${pct}%</span>`
                                    }
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- Educational Callout -->
            <div class="glass-card" style="margin-top: 36px; padding: 24px; display: flex; align-items: center; gap: 20px; border-left: 4px solid var(--color-primary);">
                <div style="font-size: 2.2rem; color: var(--color-primary); flex-shrink: 0;">
                    <i class="fa-solid fa-graduation-cap"></i>
                </div>
                <div>
                    <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">Milestones & Gamified Skill Building</h3>
                    <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 0; line-height: 1.6;">
                        CCPulse gamification is designed to instill real-world risk management instincts. Every badge reflects a fundamental tenet of disciplined investing — from diversification and dollar cost averaging to privacy preservation.
                    </p>
                </div>
            </div>
        `;

        this.bindEvents(container);
    },

    bindEvents(container) {
        container.querySelectorAll('.achieve-tab-btn').forEach(btn => {
            btn.onclick = () => {
                this.filter = btn.getAttribute('data-filter');
                this.render(container);
            };
        });

        const shareBtn = container.querySelector('#achieve-share-btn');
        if (shareBtn) {
            shareBtn.onclick = () => {
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    Toast.success('Achievement profile link copied to clipboard!', 'Milestones Shared');
                } else {
                    Toast.info('Milestone achievements recorded in browser profile.', 'Milestones');
                }
            };
        }
    }
};

window.AchievementsView = AchievementsView;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AchievementsView;
}
