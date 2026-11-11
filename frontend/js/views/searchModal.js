/**
 * CCPulse Quick Search & Command Palette Modal
 * Tier-1 crypto trading interface feature: Instant asset lookup, hotkeys (Ctrl+K or /),
 * multi-currency live pricing, category filtering, and direct links to simulation views.
 */

const SearchModal = {
    isOpen: false,

    init() {
        // Global Keyboard Shortcut: Ctrl+K or Cmd+K or /
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                this.toggle();
            } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
                e.preventDefault();
                this.open();
            } else if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    },

    open() {
        let host = document.getElementById('search-modal-container');
        if (!host) {
            host = document.createElement('div');
            host.id = 'search-modal-container';
            document.body.appendChild(host);
        }

        const coins = (typeof State !== 'undefined' && State.cryptos && State.cryptos.length) 
            ? State.cryptos 
            : (typeof CLIENT_STATIC_COINS !== 'undefined' ? CLIENT_STATIC_COINS : []);

        host.innerHTML = `
            <style>
                .search-modal-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.75);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    z-index: 10000;
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                    padding-top: 12vh;
                    padding-left: 16px;
                    padding-right: 16px;
                    animation: searchFadeIn 0.18s ease-out;
                }
                @keyframes searchFadeIn {
                    from { opacity: 0; transform: scale(0.98); }
                    to { opacity: 1; transform: scale(1); }
                }
                .search-modal-window {
                    background: var(--bg-surface, #141722);
                    border: 1px solid var(--border-color, rgba(255,255,255,0.1));
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(22, 199, 132, 0.2);
                    border-radius: var(--border-radius-lg, 16px);
                    width: 100%;
                    max-width: 620px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .search-input-box {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.08));
                    background: var(--bg-surface-elevated, #1E2332);
                }
                .search-input-field {
                    flex: 1;
                    background: none;
                    border: none;
                    outline: none;
                    color: var(--text-primary, #FFFFFF);
                    font-size: 1.1rem;
                    font-weight: 600;
                }
                .search-input-field::placeholder {
                    color: var(--text-muted, #687385);
                }
                .search-shortcut-hint {
                    font-size: 0.72rem;
                    background: rgba(255, 255, 255, 0.08);
                    color: var(--text-muted, #9FA6B2);
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-family: monospace;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .search-results-list {
                    max-height: 380px;
                    overflow-y: auto;
                    padding: 8px;
                }
                .search-result-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px 14px;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: background var(--transition-fast, 0.15s ease);
                    text-decoration: none;
                    color: inherit;
                }
                .search-result-item:hover, .search-result-item.highlighted {
                    background: rgba(22, 199, 132, 0.12);
                }
                .search-coin-meta {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .search-coin-logo {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                }
                .search-coin-name {
                    font-weight: 700;
                    font-size: 0.95rem;
                    color: var(--text-primary, #FFFFFF);
                }
                .search-coin-symbol {
                    font-size: 0.78rem;
                    color: var(--text-muted, #9FA6B2);
                    margin-left: 6px;
                    font-weight: 600;
                }
                .search-coin-badge {
                    font-size: 0.7rem;
                    background: rgba(139, 92, 246, 0.15);
                    color: #A78BFA;
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-left: 8px;
                }
                .search-coin-pricing {
                    text-align: right;
                }
                .search-coin-price {
                    font-family: monospace;
                    font-weight: 700;
                    font-size: 0.95rem;
                    color: var(--text-primary, #FFFFFF);
                }
                .search-coin-change {
                    font-size: 0.78rem;
                    font-weight: 700;
                    font-family: monospace;
                }
                .search-footer-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 18px;
                    border-top: 1px solid var(--border-color, rgba(255,255,255,0.08));
                    font-size: 0.76rem;
                    color: var(--text-muted, #9FA6B2);
                    background: var(--bg-surface-elevated, #1E2332);
                }
            </style>

            <div class="search-modal-backdrop" id="search-modal-backdrop">
                <div class="search-modal-window" role="dialog" aria-modal="true" aria-label="Quick Search Cryptocurrency">
                    <div class="search-input-box">
                        <i class="fa-solid fa-magnifying-glass" style="color: #16C784;"></i>
                        <input type="text" id="palette-search-input" class="search-input-field" 
                            placeholder="Search 20+ coins, privacy tokens, Layer-1s... (e.g. BTC, Beldex)" autofocus autocomplete="off" />
                        <span class="search-shortcut-hint">ESC</span>
                    </div>

                    <div class="search-results-list" id="palette-results-list">
                        ${this.renderCoinItems(coins)}
                    </div>

                    <div class="search-footer-bar">
                        <span><i class="fa-solid fa-arrows-up-down"></i> Navigate &bull; <i class="fa-solid fa-arrow-turn-down"></i> Open Simulation &bull; <strong>ESC</strong> Exit</span>
                        <span style="color: #16C784; font-weight: 700;"><i class="fa-solid fa-shield-halved"></i> 100% Risk-Free Sandbox</span>
                    </div>
                </div>
            </div>
        `;

        this.isOpen = true;
        this.bindEvents(coins);
    },

    renderCoinItems(coins, query = '') {
        const q = query.trim().toLowerCase();
        const filtered = coins.filter(c => 
            !q || 
            c.name.toLowerCase().includes(q) || 
            c.symbol.toLowerCase().includes(q) ||
            (c.categories && c.categories.some(cat => cat.toLowerCase().includes(q)))
        );

        if (filtered.length === 0) {
            return `
                <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                    <i class="fa-solid fa-coins" style="font-size: 2rem; margin-bottom: 8px; opacity: 0.4;"></i>
                    <p style="margin: 0; font-size: 0.9rem;">No cryptocurrencies matching "<strong>${query}</strong>"</p>
                </div>
            `;
        }

        return filtered.map(c => {
            const price = Currency.format(c.current_price_usd);
            const chg = c.change_24h || 0;
            const isUp = chg >= 0;
            const logo = (typeof State !== 'undefined' && State.getCoinLogo) ? State.getCoinLogo(c) : './assets/coins/generic.svg';
            const isPrivacy = (c.symbol === 'BDX' || c.symbol === 'XMR');

            return `
                <a href="#simulator?coin=${c.symbol}" class="search-result-item" data-symbol="${c.symbol}">
                    <div class="search-coin-meta">
                        <img src="${logo}" alt="${c.symbol}" class="search-coin-logo" onerror="this.src='./assets/coins/generic.svg'" />
                        <div>
                            <span class="search-coin-name">${c.name}</span>
                            <span class="search-coin-symbol">${c.symbol}</span>
                            ${isPrivacy ? '<span class="search-coin-badge"><i class="fa-solid fa-shield-cat"></i> Privacy</span>' : ''}
                        </div>
                    </div>
                    <div class="search-coin-pricing">
                        <div class="search-coin-price">${price}</div>
                        <div class="search-coin-change" style="color: ${isUp ? '#16C784' : '#EA3943'};">
                            ${isUp ? '+' : ''}${chg.toFixed(2)}%
                        </div>
                    </div>
                </a>
            `;
        }).join('');
    },

    bindEvents(coins) {
        const backdrop = document.getElementById('search-modal-backdrop');
        const input = document.getElementById('palette-search-input');
        const list = document.getElementById('palette-results-list');

        if (input) {
            input.focus();
            input.oninput = (e) => {
                if (list) {
                    list.innerHTML = this.renderCoinItems(coins, e.target.value);
                }
            };
        }

        if (backdrop) {
            backdrop.onclick = (e) => {
                if (e.target === backdrop) this.close();
            };
        }

        if (list) {
            list.addEventListener('click', (e) => {
                const item = e.target.closest('.search-result-item');
                if (item) {
                    this.close();
                }
            });
        }
    },

    close() {
        const host = document.getElementById('search-modal-container');
        if (host) host.remove();
        this.isOpen = false;
    },

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }
};

window.SearchModal = SearchModal;
