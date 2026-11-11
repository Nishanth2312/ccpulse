/**
 * CCPulse Paper Trading Leaderboard & Simulation League
 * 
 * An interactive, gamified leaderboard tracking top simulated performers,
 * encouraging peer-to-peer strategy comparisons and risk-managed execution.
 */
const LeaderboardView = {
    sortBy: 'pnlPercent', // 'pnlPercent' | 'totalValue' | 'winRate' | 'tradeCount'
    sortDirection: 'desc',
    searchQuery: '',
    tierFilter: 'ALL',

    // Realistic ghost traders simulating active peer competition
    GHOST_TRADERS: [
        {
            id: 'ghost-1',
            username: 'SatoshiDisciple',
            fullName: 'Alexander Vance',
            role: 'user',
            badge: 'Whale Scout',
            streak: 7,
            avatarBg: 'linear-gradient(135deg, #F59E0B, #D97706)',
            portfolioValueUsd: 24850.30,
            initialDepositUsd: 10000.00,
            winRate: 78,
            totalTrades: 34,
            favoriteCoin: 'BTC',
            strategy: 'Macro Trend Following',
            lastActive: '5m ago'
        },
        {
            id: 'ghost-2',
            username: 'PrivacyMaxi',
            fullName: 'Elena Rostova',
            role: 'user',
            badge: 'Privacy Pioneer',
            streak: 5,
            avatarBg: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
            portfolioValueUsd: 21420.80,
            initialDepositUsd: 10000.00,
            winRate: 74,
            totalTrades: 28,
            favoriteCoin: 'BDX',
            strategy: 'Confidential Layer Accumulation',
            lastActive: '12m ago'
        },
        {
            id: 'ghost-3',
            username: 'DeFi_Alchemist',
            fullName: 'Marcus Chen',
            role: 'user',
            badge: 'Yield Master',
            streak: 4,
            avatarBg: 'linear-gradient(135deg, #10B981, #047857)',
            portfolioValueUsd: 18940.60,
            initialDepositUsd: 10000.00,
            winRate: 69,
            totalTrades: 42,
            favoriteCoin: 'ETH',
            strategy: 'Smart Contract Beta & DEX Arbitrage',
            lastActive: '18m ago'
        },
        {
            id: 'ghost-4',
            username: 'SolanaSpeedrun',
            fullName: 'Sarah Jenkins',
            role: 'user',
            badge: 'High-Throughput',
            streak: 3,
            avatarBg: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
            portfolioValueUsd: 16730.15,
            initialDepositUsd: 10000.00,
            winRate: 65,
            totalTrades: 51,
            favoriteCoin: 'SOL',
            strategy: 'Breakout Momentum Trading',
            lastActive: '32m ago'
        },
        {
            id: 'ghost-5',
            username: 'HODL_Commander',
            fullName: 'David Thorne',
            role: 'user',
            badge: 'Diamond Hands',
            streak: 6,
            avatarBg: 'linear-gradient(135deg, #EC4899, #BE185D)',
            portfolioValueUsd: 15480.20,
            initialDepositUsd: 10000.00,
            winRate: 62,
            totalTrades: 19,
            favoriteCoin: 'BTC',
            strategy: 'Systematic Dollar Cost Averaging',
            lastActive: '1h ago'
        },
        {
            id: 'ghost-6',
            username: 'QuantNinja',
            fullName: 'Priya Sharma',
            role: 'user',
            badge: 'Algo Pilot',
            streak: 2,
            avatarBg: 'linear-gradient(135deg, #06B6D4, #0891B2)',
            portfolioValueUsd: 13920.40,
            initialDepositUsd: 10000.00,
            winRate: 59,
            totalTrades: 64,
            favoriteCoin: 'LINK',
            strategy: 'Statistical Mean Reversion',
            lastActive: '2h ago'
        },
        {
            id: 'ghost-7',
            username: 'ZeroLossCurator',
            fullName: 'Kenji Takahashi',
            role: 'user',
            badge: 'Risk Conservative',
            streak: 8,
            avatarBg: 'linear-gradient(135deg, #14B8A6, #0F766E)',
            portfolioValueUsd: 12450.90,
            initialDepositUsd: 10000.00,
            winRate: 85,
            totalTrades: 15,
            favoriteCoin: 'USDT',
            strategy: 'Capital Preservation & Low Beta',
            lastActive: '3h ago'
        },
        {
            id: 'ghost-8',
            username: 'AltSeasonSniper',
            fullName: 'Liam O\'Connor',
            role: 'user',
            badge: 'Volatility Hunter',
            streak: 0,
            avatarBg: 'linear-gradient(135deg, #F97316, #C2410C)',
            portfolioValueUsd: 10890.00,
            initialDepositUsd: 10000.00,
            winRate: 52,
            totalTrades: 39,
            favoriteCoin: 'AVAX',
            strategy: 'L1 Ecosystem Catalysts',
            lastActive: '5h ago'
        }
    ],

    async render(container) {
        const isGuest = State.isGuest || !State.currentUser;
        const currentUser = State.currentUser;

        // Calculate User's current simulated standing
        const userStanding = this.calculateUserStanding(isGuest, currentUser);

        // Fetch DB users if any
        let dbUsers = [];
        if (typeof ClientDB !== 'undefined' && ClientDB.users) {
            try {
                const rawUsers = ClientDB.users.getAll();
                dbUsers = rawUsers
                    .filter(u => u.id !== currentUser?.id)
                    .map(u => {
                        const wallet = ClientDB.wallets.getByUserId(u.id);
                        const portVal = wallet ? wallet.totalPortfolioValueUsd : 10000;
                        const dep = wallet ? (wallet.totalDepositedUsd || 10000) : 10000;
                        const pnl = portVal - dep;
                        const pnlPct = dep > 0 ? (pnl / dep) * 100 : 0;
                        const trades = ClientDB.trades.getByUserId(u.id) || [];
                        return {
                            id: `usr-${u.id}`,
                            username: u.username,
                            fullName: u.fullName || u.username,
                            role: u.role,
                            badge: u.role === 'admin' ? 'System Overseer' : 'Simulated Trader',
                            streak: Math.min(6, trades.length),
                            avatarBg: 'linear-gradient(135deg, #6366F1, #4338CA)',
                            portfolioValueUsd: portVal,
                            initialDepositUsd: dep,
                            winRate: trades.length > 0 ? Math.round(55 + (trades.length * 2) % 30) : 60,
                            totalTrades: trades.length,
                            favoriteCoin: 'BTC',
                            strategy: 'Dynamic Spot Simulation',
                            lastActive: 'Active now'
                        };
                    });
            } catch (e) {
                dbUsers = [];
            }
        }

        // Combine Ghost Traders + DB Users + Current User
        let allTraders = [
            userStanding,
            ...this.GHOST_TRADERS,
            ...dbUsers
        ];

        // Process P&L metrics for all
        allTraders = allTraders.map(t => {
            const pnlUsd = t.portfolioValueUsd - t.initialDepositUsd;
            const pnlPercent = t.initialDepositUsd > 0 ? (pnlUsd / t.initialDepositUsd) * 100 : 0;
            return {
                ...t,
                pnlUsd,
                pnlPercent
            };
        });

        // Filter by Tier if selected
        if (this.tierFilter !== 'ALL') {
            if (this.tierFilter === 'TOP10') {
                allTraders = allTraders.slice(0, 10);
            } else if (this.tierFilter === 'STREAK') {
                allTraders = allTraders.filter(t => t.streak >= 4);
            }
        }

        // Search Filter
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            allTraders = allTraders.filter(t => 
                t.username.toLowerCase().includes(q) || 
                t.fullName.toLowerCase().includes(q) ||
                t.favoriteCoin.toLowerCase().includes(q) ||
                t.strategy.toLowerCase().includes(q)
            );
        }

        // Sort Traders
        allTraders.sort((a, b) => {
            let valA = a[this.sortBy];
            let valB = b[this.sortBy];
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (this.sortDirection === 'desc') {
                return valB > valA ? 1 : (valB < valA ? -1 : 0);
            } else {
                return valA > valB ? 1 : (valA < valB ? -1 : 0);
            }
        });

        // Assign Rank
        allTraders = allTraders.map((t, idx) => ({ ...t, rank: idx + 1 }));

        // Locate current user in ranked list
        const myRankItem = allTraders.find(t => t.isMe);
        const myRank = myRankItem ? myRankItem.rank : 1;

        container.innerHTML = `
            <style>
                .leaderboard-header {
                    margin-bottom: 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    flex-wrap: wrap;
                    gap: 16px;
                }
                .league-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(245, 158, 11, 0.12);
                    color: #F59E0B;
                    border: 1px solid rgba(245, 158, 11, 0.28);
                    padding: 4px 10px;
                    border-radius: 999px;
                    font-size: 0.78rem;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .podium-container {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 18px;
                    margin-bottom: 28px;
                }
                @media (max-width: 768px) {
                    .podium-container {
                        grid-template-columns: 1fr;
                    }
                }
                .podium-card {
                    background: var(--bg-surface, #181B24);
                    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
                    border-radius: 14px;
                    padding: 22px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
                    transition: transform 0.2s ease, border-color 0.2s ease;
                }
                .podium-card:hover {
                    transform: translateY(-3px);
                }
                .podium-1 {
                    border-color: rgba(245, 158, 11, 0.5);
                    background: linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, var(--bg-surface, #181B24) 100%);
                }
                .podium-2 {
                    border-color: rgba(148, 163, 184, 0.4);
                    background: linear-gradient(180deg, rgba(148, 163, 184, 0.06) 0%, var(--bg-surface, #181B24) 100%);
                }
                .podium-3 {
                    border-color: rgba(217, 119, 6, 0.35);
                    background: linear-gradient(180deg, rgba(217, 119, 6, 0.06) 0%, var(--bg-surface, #181B24) 100%);
                }
                .podium-crown {
                    font-size: 1.8rem;
                    margin-bottom: 8px;
                }
                .podium-avatar {
                    width: 58px;
                    height: 58px;
                    border-radius: 50%;
                    margin: 0 auto 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #FFFFFF;
                    font-weight: 800;
                    font-size: 1.3rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    border: 2px solid rgba(255, 255, 255, 0.15);
                }
                .rank-pill {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    font-weight: 800;
                    font-size: 0.85rem;
                }
                .rank-1 { background: #F59E0B; color: #0C0E14; box-shadow: 0 0 12px rgba(245, 158, 11, 0.5); }
                .rank-2 { background: #94A3B8; color: #0C0E14; }
                .rank-3 { background: #D97706; color: #FFFFFF; }
                .rank-other { background: rgba(255, 255, 255, 0.08); color: var(--text-secondary, #9CA3AF); }

                .leaderboard-table-wrap {
                    background: var(--bg-surface, #181B24);
                    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
                    border-radius: 12px;
                    overflow-x: auto;
                }
                .leaderboard-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.88rem;
                    text-align: left;
                }
                .leaderboard-table th {
                    background: rgba(255, 255, 255, 0.02);
                    padding: 14px 16px;
                    color: var(--text-secondary, #9CA3AF);
                    font-weight: 700;
                    font-size: 0.76rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
                    white-space: nowrap;
                    cursor: pointer;
                    user-select: none;
                }
                .leaderboard-table th:hover {
                    color: var(--text-primary, #F9FAFB);
                }
                .leaderboard-table td {
                    padding: 14px 16px;
                    border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
                    color: var(--text-primary, #F9FAFB);
                    vertical-align: middle;
                }
                .row-me {
                    background: rgba(22, 199, 132, 0.08) !important;
                    border-left: 3px solid #16C784;
                }
                .row-me td {
                    font-weight: 600;
                }
                .you-badge {
                    display: inline-block;
                    background: #16C784;
                    color: #0C0E14;
                    font-weight: 800;
                    font-size: 0.68rem;
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-left: 6px;
                    text-transform: uppercase;
                }
                .streak-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    background: rgba(245, 158, 11, 0.12);
                    color: #F59E0B;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 0.72rem;
                    font-weight: 700;
                }
            </style>

            <div class="leaderboard-header">
                <div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                        <h1 style="font-size: 1.8rem; font-weight: 800; margin: 0;">
                            <i class="fa-solid fa-trophy text-amber"></i> Paper Trading Leaderboard
                        </h1>
                        <span class="league-badge">
                            <i class="fa-solid fa-shield-halved"></i> 100% Risk-Free Arena
                        </span>
                    </div>
                    <p style="color: var(--text-secondary); font-size: 0.92rem; margin: 0;">
                        Compete in real-time simulated market conditions, benchmark your P&L performance against fellow traders, and climb the ranks.
                    </p>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button type="button" class="btn btn-outline" id="refresh-leaderboard-btn" style="padding: 9px 15px; font-size: 0.85rem;">
                        <i class="fa-solid fa-rotate"></i> Refresh Ranks
                    </button>
                    <a href="#simulator" class="btn btn-primary" style="padding: 9px 15px; font-size: 0.85rem; text-decoration: none;">
                        <i class="fa-solid fa-rocket"></i> Boost Your Rank
                    </a>
                </div>
            </div>

            <!-- User Standing Banner -->
            <div style="margin-bottom: 24px; padding: 16px 20px; background: rgba(22, 199, 132, 0.08); border: 1px solid rgba(22, 199, 132, 0.3); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <div style="width: 44px; height: 44px; border-radius: 50%; background: #16C784; color: #0C0E14; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.2rem;">
                        #${myRank}
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-weight: 800; font-size: 1rem; color: var(--text-primary);">${userStanding.fullName}</span>
                            <span class="you-badge">YOU</span>
                            <span style="font-size: 0.75rem; color: var(--text-muted);">&bull; @${userStanding.username}</span>
                        </div>
                        <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 2px;">
                            Simulation Rank: <strong>#${myRank} of ${allTraders.length}</strong> &bull; Total Simulated Value: <strong class="font-mono">${Currency.format(userStanding.portfolioValueUsd)}</strong>
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 20px; align-items: center;">
                    <div style="text-align: right;">
                        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Simulated P&L</div>
                        <div style="font-size: 1.15rem; font-weight: 800; font-family: monospace; color: ${(userStanding.pnlPercent || 0) >= 0 ? '#16C784' : '#EF4444'};">
                            ${(userStanding.pnlPercent || 0) >= 0 ? '+' : ''}${(userStanding.pnlPercent || 0).toFixed(2)}%
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Win Rate</div>
                        <div style="font-size: 1.15rem; font-weight: 800; font-family: monospace; color: var(--text-primary);">
                            ${userStanding.winRate || 65}%
                        </div>
                    </div>
                </div>
            </div>

            <!-- Top 3 Podium Cards -->
            <div class="podium-container">
                <!-- 2nd Place -->
                ${allTraders[1] ? this.renderPodiumCard(allTraders[1], 2, 'podium-2', '🥈', '#94A3B8') : ''}
                <!-- 1st Place (Champion) -->
                ${allTraders[0] ? this.renderPodiumCard(allTraders[0], 1, 'podium-1', '👑', '#F59E0B') : ''}
                <!-- 3rd Place -->
                ${allTraders[2] ? this.renderPodiumCard(allTraders[2], 3, 'podium-3', '🥉', '#D97706') : ''}
            </div>

            <!-- Search, Filter & Sorter Toolbar -->
            <div style="background: var(--bg-surface, #181B24); border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08)); border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">Sort By:</label>
                    <select id="leaderboard-sort-by" class="filter-select" style="background: var(--bg-card); color: var(--text-primary); border-radius: 8px; padding: 7px 10px; border: 1px solid var(--border-color);">
                        <option value="pnlPercent" ${this.sortBy === 'pnlPercent' ? 'selected' : ''}>Profit / Loss (%)</option>
                        <option value="portfolioValueUsd" ${this.sortBy === 'portfolioValueUsd' ? 'selected' : ''}>Portfolio Value ($)</option>
                        <option value="winRate" ${this.sortBy === 'winRate' ? 'selected' : ''}>Win Rate (%)</option>
                        <option value="totalTrades" ${this.sortBy === 'totalTrades' ? 'selected' : ''}>Total Trades</option>
                    </select>

                    <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; margin-left: 8px;">Filter:</label>
                    <select id="leaderboard-filter-tier" class="filter-select" style="background: var(--bg-card); color: var(--text-primary); border-radius: 8px; padding: 7px 10px; border: 1px solid var(--border-color);">
                        <option value="ALL" ${this.tierFilter === 'ALL' ? 'selected' : ''}>All Traders (${allTraders.length})</option>
                        <option value="TOP10" ${this.tierFilter === 'TOP10' ? 'selected' : ''}>Top 10 Performers</option>
                        <option value="STREAK" ${this.tierFilter === 'STREAK' ? 'selected' : ''}>Active Win Streak 🔥</option>
                    </select>
                </div>

                <div style="position: relative;">
                    <input type="text" id="leaderboard-search" placeholder="Search by trader or asset..." value="${this.searchQuery}" style="background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 8px; padding: 7px 12px 7px 32px; font-size: 0.85rem; width: 220px; outline: none;">
                    <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 0.78rem; color: var(--text-muted);"></i>
                </div>
            </div>

            <!-- Leaderboard Table -->
            <div class="leaderboard-table-wrap">
                <table class="leaderboard-table">
                    <thead>
                        <tr>
                            <th style="width: 60px; text-align: center;">Rank</th>
                            <th>Trader</th>
                            <th>Strategy / Badge</th>
                            <th style="text-align: right;" data-sort="portfolioValueUsd">Portfolio Value <i class="fa-solid fa-sort" style="font-size: 0.7rem; opacity: 0.6;"></i></th>
                            <th style="text-align: right;" data-sort="pnlPercent">Simulated P&L (%) <i class="fa-solid fa-sort" style="font-size: 0.7rem; opacity: 0.6;"></i></th>
                            <th style="text-align: right;" data-sort="winRate">Win Rate <i class="fa-solid fa-sort" style="font-size: 0.7rem; opacity: 0.6;"></i></th>
                            <th style="text-align: right;" data-sort="totalTrades">Trades <i class="fa-solid fa-sort" style="font-size: 0.7rem; opacity: 0.6;"></i></th>
                            <th style="text-align: center;">Core Asset</th>
                            <th>Last Active</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allTraders.map(t => {
                            const isMe = t.isMe;
                            let rankClass = 'rank-other';
                            if (t.rank === 1) rankClass = 'rank-1';
                            else if (t.rank === 2) rankClass = 'rank-2';
                            else if (t.rank === 3) rankClass = 'rank-3';

                            return `
                                <tr class="${isMe ? 'row-me' : ''}">
                                    <td style="text-align: center;">
                                        <span class="rank-pill ${rankClass}">${t.rank}</span>
                                    </td>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <div style="width: 34px; height: 34px; border-radius: 50%; background: ${t.avatarBg}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; color: #FFFFFF;">
                                                ${t.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style="font-weight: 700; font-size: 0.88rem; display: flex; align-items: center;">
                                                    ${t.fullName}
                                                    ${isMe ? '<span class="you-badge">YOU</span>' : ''}
                                                </div>
                                                <div style="font-size: 0.74rem; color: var(--text-muted);">
                                                    @${t.username}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div>
                                            <span style="font-size: 0.78rem; font-weight: 600; color: var(--text-secondary);">${t.badge}</span>
                                            ${t.streak > 0 ? `<div style="margin-top: 2px;"><span class="streak-pill"><i class="fa-solid fa-fire"></i> ${t.streak}x streak</span></div>` : ''}
                                        </div>
                                    </td>
                                    <td style="text-align: right; font-family: monospace; font-weight: 700;">
                                        ${Currency.format(t.portfolioValueUsd)}
                                    </td>
                                    <td style="text-align: right; font-family: monospace; font-weight: 700; color: ${t.pnlPercent >= 0 ? '#16C784' : '#EF4444'};">
                                        ${t.pnlPercent >= 0 ? '+' : ''}${t.pnlPercent.toFixed(2)}%
                                        <div style="font-size: 0.72rem; opacity: 0.85;">
                                            ${t.pnlUsd >= 0 ? '+' : ''}${Currency.format(t.pnlUsd)}
                                        </div>
                                    </td>
                                    <td style="text-align: right; font-family: monospace;">
                                        ${t.winRate}%
                                    </td>
                                    <td style="text-align: right; font-family: monospace;">
                                        ${t.totalTrades}
                                    </td>
                                    <td style="text-align: center;">
                                        <span style="background: rgba(255, 255, 255, 0.06); padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 0.76rem; font-family: monospace;">
                                            ${t.favoriteCoin}
                                        </span>
                                    </td>
                                    <td style="font-size: 0.78rem; color: var(--text-muted); white-space: nowrap;">
                                        ${t.lastActive}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <!-- League Education Card -->
            <div style="margin-top: 24px; padding: 20px; background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(245, 158, 11, 0.15); display: flex; align-items: center; justify-content: center; color: #F59E0B; font-size: 1.3rem;">
                        <i class="fa-solid fa-graduation-cap"></i>
                    </div>
                    <div>
                        <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">Why Practice in a Simulation League?</div>
                        <div style="font-size: 0.82rem; color: var(--text-secondary); max-width: 680px;">
                            Real market participants often lose capital due to over-leveraging and emotional panic. CCPulse’s Paper Trading Leaderboard lets you stress-test technical setups, evaluate drawdowns, and sharpen execution without risking a single dollar.
                        </div>
                    </div>
                </div>
                <a href="#learning" class="btn btn-outline" style="font-size: 0.82rem; padding: 8px 16px; text-decoration: none;">
                    Explore Academy Modules
                </a>
            </div>
        `;

        this.attachEventListeners(container);
    },

    renderPodiumCard(trader, rank, cardClass, icon, color) {
        return `
            <div class="podium-card ${cardClass}">
                <div class="podium-crown">${icon}</div>
                <div class="podium-avatar" style="background: ${trader.avatarBg};">
                    ${trader.username.charAt(0).toUpperCase()}
                </div>
                <h3 style="font-size: 1.15rem; font-weight: 800; margin: 0 0 2px;">
                    ${trader.fullName} ${trader.isMe ? '<span class="you-badge">YOU</span>' : ''}
                </h3>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 12px;">
                    @${trader.username} &bull; ${trader.badge}
                </div>
                <div style="font-size: 1.4rem; font-weight: 800; font-family: monospace; color: ${trader.pnlPercent >= 0 ? '#16C784' : '#EF4444'}; margin-bottom: 4px;">
                    ${trader.pnlPercent >= 0 ? '+' : ''}${trader.pnlPercent.toFixed(2)}%
                </div>
                <div style="font-size: 0.82rem; color: var(--text-secondary); font-family: monospace;">
                    ${Currency.format(trader.portfolioValueUsd)}
                </div>
                <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 0.76rem; color: var(--text-muted); display: flex; justify-content: space-around;">
                    <span>Win Rate: <strong>${trader.winRate}%</strong></span>
                    <span>Trades: <strong>${trader.totalTrades}</strong></span>
                </div>
            </div>
        `;
    },

    calculateUserStanding(isGuest, currentUser) {
        if (!isGuest && currentUser && typeof ClientDB !== 'undefined' && ClientDB.wallets) {
            try {
                const wallet = ClientDB.wallets.getByUserId(currentUser.id);
                const trades = ClientDB.trades.getByUserId(currentUser.id) || [];
                const portVal = wallet ? wallet.totalPortfolioValueUsd : 10000;
                const dep = wallet ? (wallet.totalDepositedUsd || 10000) : 10000;
                let wins = 0;
                trades.forEach(t => {
                    const sym = (t.symbol || 'BTC').split(' ')[0];
                    const coin = State.cryptos.find(c => c.symbol === sym) || { current_price_usd: t.executionPriceUsd };
                    if (t.type === 'BUY' && (coin.current_price_usd || 0) >= t.executionPriceUsd) wins++;
                    else if (t.type === 'SELL' || t.type === 'SWAP') wins++;
                });
                const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 70;

                const pnlUsd = portVal - dep;
                const pnlPercent = dep > 0 ? (pnlUsd / dep) * 100 : 0;

                return {
                    id: `usr-${currentUser.id}`,
                    username: currentUser.username || 'trader',
                    fullName: currentUser.fullName || currentUser.full_name || 'My Trader Account',
                    role: currentUser.role || 'user',
                    badge: 'Rising Star',
                    streak: Math.min(8, trades.length),
                    avatarBg: 'linear-gradient(135deg, #16C784, #059669)',
                    portfolioValueUsd: portVal,
                    initialDepositUsd: dep,
                    pnlUsd,
                    pnlPercent,
                    winRate: winRate,
                    totalTrades: trades.length,
                    favoriteCoin: 'BTC',
                    strategy: 'Disciplined Capital Allocation',
                    lastActive: 'Active now',
                    isMe: true
                };
            } catch (e) {
                console.warn('Error calculating user standing:', e);
            }
        }

        // Guest user calculation
        const guestCash = State.guestSession?.temporaryBalanceUsd || 10000.00;
        let guestInvested = 0;
        (State.guestSession?.holdings || []).forEach(h => {
            const coin = (State.cryptos && State.cryptos.find(c => c.symbol === h.symbol)) || { current_price_usd: h.avg_buy_price_usd || 1 };
            guestInvested += h.quantity * (coin.current_price_usd || h.avg_buy_price_usd || 1);
        });
        const totalGuest = guestCash + guestInvested;
        const guestTrades = State.guestSession?.trades || [];
        const guestDep = 10000.00;
        const guestPnlUsd = totalGuest - guestDep;
        const guestPnlPercent = guestDep > 0 ? (guestPnlUsd / guestDep) * 100 : 0;

        return {
            id: 'guest-me',
            username: 'guest_trader',
            fullName: 'Guest Simulator',
            role: 'guest',
            badge: 'Sandbox Explorer',
            streak: Math.min(5, guestTrades.length),
            avatarBg: 'linear-gradient(135deg, #16C784, #059669)',
            portfolioValueUsd: totalGuest,
            initialDepositUsd: guestDep,
            pnlUsd: guestPnlUsd,
            pnlPercent: guestPnlPercent,
            winRate: guestTrades.length > 0 ? 67 : 60,
            totalTrades: guestTrades.length,
            favoriteCoin: 'BTC',
            strategy: 'Paper Trading Practice',
            lastActive: 'Active now',
            isMe: true
        };
    },

    attachEventListeners(container) {
        const sortSelect = container.querySelector('#leaderboard-sort-by');
        const filterTierSelect = container.querySelector('#leaderboard-filter-tier');
        const searchInput = container.querySelector('#leaderboard-search');
        const refreshBtn = container.querySelector('#refresh-leaderboard-btn');

        if (sortSelect) {
            sortSelect.onchange = (e) => {
                this.sortBy = e.target.value;
                this.render(container);
            };
        }

        if (filterTierSelect) {
            filterTierSelect.onchange = (e) => {
                this.tierFilter = e.target.value;
                this.render(container);
            };
        }

        if (searchInput) {
            let debounce;
            searchInput.oninput = (e) => {
                clearTimeout(debounce);
                debounce = setTimeout(() => {
                    this.searchQuery = e.target.value.trim();
                    this.render(container);
                }, 250);
            };
        }

        if (refreshBtn) {
            refreshBtn.onclick = () => {
                if (window.Toast) {
                    window.Toast.info('Refreshing live paper trading rankings...', 'Updating Leaderboard');
                }
                setTimeout(() => {
                    this.render(container);
                    if (window.Toast) {
                        window.Toast.success('Leaderboard updated with current simulated portfolio values.', 'Rankings Updated');
                    }
                }, 400);
            };
        }

        // Table header click-to-sort
        container.querySelectorAll('.leaderboard-table th[data-sort]').forEach(th => {
            th.onclick = () => {
                const sortField = th.getAttribute('data-sort');
                if (this.sortBy === sortField) {
                    this.sortDirection = this.sortDirection === 'desc' ? 'asc' : 'desc';
                } else {
                    this.sortBy = sortField;
                    this.sortDirection = 'desc';
                }
                this.render(container);
            };
        });
    }
};

window.LeaderboardView = LeaderboardView;
