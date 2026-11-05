/**
 * CCPulse Help & Support Center View
 * Provides user-facing support ticketing (raising tickets, viewing threads, replying, and FAQ)
 */
const SupportView = {
    currentTab: 'raise', // 'raise', 'my_tickets', 'faq'

    async render(container, preselectedTab = 'raise') {
        this.currentTab = preselectedTab || 'raise';

        container.innerHTML = `
            <!-- Support Hero Banner -->
            <div style="background: radial-gradient(circle at top right, rgba(58, 134, 255, 0.12), transparent 70%), var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--border-radius-lg); padding: 32px 28px; margin-bottom: 28px; box-shadow: var(--shadow-sm);">
                <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(0, 230, 118, 0.1); border: 1px solid rgba(0, 230, 118, 0.25); color: var(--color-success); padding: 4px 12px; border-radius: var(--border-radius-full); font-size: 0.8rem; font-weight: 700; margin-bottom: 12px; font-family: var(--font-heading);">
                    <i class="fa-solid fa-headset"></i> 24/7 Simulator Help & Support Desk
                </div>
                <h1 style="font-size: 2.2rem; font-weight: 800; font-family: var(--font-heading); margin-bottom: 8px;">
                    Help & <span class="pulse-text">Support Center</span>
                </h1>
                <p style="color: var(--text-secondary); max-width: 680px; font-size: 1rem; line-height: 1.5; margin: 0; font-family: var(--font-family);">
                    Need help with real-time trading simulation, portfolio balances, cryptocurrency feeds, or reporting a bug? Raise a ticket below and our administrative support team will assist you.
                </p>
            </div>

            <!-- Tabs Navigation -->
            <div style="display: flex; gap: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 24px; overflow-x: auto;">
                <button type="button" class="btn ${this.currentTab === 'raise' ? 'btn-primary' : 'btn-outline'} support-tab-btn" data-tab="raise">
                    <i class="fa-solid fa-plus-circle"></i> Raise a Support Ticket
                </button>
                <button type="button" class="btn ${this.currentTab === 'my_tickets' ? 'btn-primary' : 'btn-outline'} support-tab-btn" data-tab="my_tickets">
                    <i class="fa-solid fa-ticket"></i> My Tickets
                </button>
                <button type="button" class="btn ${this.currentTab === 'faq' ? 'btn-primary' : 'btn-outline'} support-tab-btn" data-tab="faq">
                    <i class="fa-solid fa-circle-question"></i> FAQ & Simulator Guides
                </button>
            </div>

            <!-- Tab Content Container -->
            <div id="support-tab-content"></div>
        `;

        // Tab click listeners
        container.querySelectorAll('.support-tab-btn').forEach(btn => {
            btn.onclick = () => {
                const tab = btn.getAttribute('data-tab');
                this.currentTab = tab;
                container.querySelectorAll('.support-tab-btn').forEach(b => b.className = 'btn btn-outline support-tab-btn');
                btn.className = 'btn btn-primary support-tab-btn';
                this.loadTab(tab);
            };
        });

        await this.loadTab(this.currentTab);
    },

    async loadTab(tab) {
        const content = document.getElementById('support-tab-content');
        if (!content) return;

        content.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</div>';

        if (tab === 'raise') {
            this.renderRaiseForm(content);
        } else if (tab === 'my_tickets') {
            await this.renderMyTickets(content);
        } else if (tab === 'faq') {
            this.renderFaq(content);
        }
    },

    renderRaiseForm(container) {
        const user = State.currentUser;
        const isAuth = !!user;

        container.innerHTML = `
            <div class="glass-card" style="padding: 32px 28px; max-width: 800px; margin: 0 auto;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color);">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(58, 134, 255, 0.12); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
                        <i class="fa-solid fa-ticket"></i>
                    </div>
                    <div>
                        <h2 style="font-size: 1.3rem; font-weight: 800; font-family: var(--font-heading); margin: 0;">Submit a Support Request</h2>
                        <p style="color: var(--text-muted); font-size: 0.85rem; margin: 2px 0 0;">Fill in the details below. Tickets are monitored 24/7 by CCPulse administrators.</p>
                    </div>
                </div>

                <form id="raise-ticket-form" style="display: flex; flex-direction: column; gap: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;" class="responsive-form-row">
                        <div>
                            <label style="display: block; font-size: 0.88rem; font-weight: 700; margin-bottom: 6px; font-family: var(--font-heading);">
                                Your Full Name
                            </label>
                            <input type="text" id="ticket-name" class="form-input" style="width: 100%; padding: 10px 14px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary);" 
                                value="${isAuth ? user.full_name : ''}" placeholder="e.g. John Doe" required>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.88rem; font-weight: 700; margin-bottom: 6px; font-family: var(--font-heading);">
                                Your Email Address
                            </label>
                            <input type="email" id="ticket-email" class="form-input" style="width: 100%; padding: 10px 14px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary);" 
                                value="${isAuth ? user.email : ''}" placeholder="name@example.com" required>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px;" class="responsive-form-row">
                        <div>
                            <label style="display: block; font-size: 0.88rem; font-weight: 700; margin-bottom: 6px; font-family: var(--font-heading);">
                                Issue Category
                            </label>
                            <select id="ticket-category" style="width: 100%; padding: 10px 14px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary); font-family: var(--font-family);">
                                <option value="Simulator & Trading">Simulator & Virtual Trading Issue</option>
                                <option value="Crypto Pricing & Live Feeds">Crypto Pricing & CoinGecko / Forex Feed</option>
                                <option value="Account & Bonus">Account, Registration & Welcome Bonus</option>
                                <option value="Feature Suggestion">Feature Request & Coin Addition</option>
                                <option value="Bug Report">Technical Bug or UI Glitch</option>
                                <option value="App Store & Compliance">App Store Compliance & Legal Inquiry</option>
                                <option value="Other">Other Inquiry</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.88rem; font-weight: 700; margin-bottom: 6px; font-family: var(--font-heading);">
                                Priority Level
                            </label>
                            <select id="ticket-priority" style="width: 100%; padding: 10px 14px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary); font-family: var(--font-family);">
                                <option value="low">Low (General question)</option>
                                <option value="medium" selected>Medium (Standard request)</option>
                                <option value="high">High (Urgent simulator issue)</option>
                                <option value="urgent">Urgent (Critical blocker)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.88rem; font-weight: 700; margin-bottom: 6px; font-family: var(--font-heading);">
                            Subject / Summary
                        </label>
                        <input type="text" id="ticket-subject" class="form-input" style="width: 100%; padding: 10px 14px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary);" 
                            placeholder="Briefly state your question or issue..." required>
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.88rem; font-weight: 700; margin-bottom: 6px; font-family: var(--font-heading);">
                            Detailed Description
                        </label>
                        <textarea id="ticket-description" rows="5" class="form-input" style="width: 100%; padding: 12px 14px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary); resize: vertical; font-family: var(--font-family);" 
                            placeholder="Please provide full details of what you experienced, including coin symbol, steps to reproduce, or suggestions..." required></textarea>
                    </div>

                    <div id="ticket-feedback" class="hidden" style="padding: 12px; border-radius: var(--border-radius-sm);"></div>

                    <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px;">
                        <button type="submit" id="submit-ticket-btn" class="btn btn-primary" style="padding: 12px 28px; font-size: 0.95rem;">
                            <i class="fa-solid fa-paper-plane"></i> Submit Ticket
                        </button>
                    </div>
                </form>
            </div>
        `;

        const form = container.querySelector('#raise-ticket-form');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('#submit-ticket-btn');
            const feedback = form.querySelector('#ticket-feedback');

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
            feedback.classList.add('hidden');

            const payload = {
                name: form.querySelector('#ticket-name').value.trim(),
                email: form.querySelector('#ticket-email').value.trim(),
                category: form.querySelector('#ticket-category').value,
                priority: form.querySelector('#ticket-priority').value,
                subject: form.querySelector('#ticket-subject').value.trim(),
                description: form.querySelector('#ticket-description').value.trim()
            };

            try {
                const res = await API.support.createTicket(payload);
                feedback.className = 'text-success';
                feedback.style.background = 'rgba(0, 230, 118, 0.1)';
                feedback.style.border = '1px solid rgba(0, 230, 118, 0.3)';
                feedback.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px; font-weight: 700;">
                        <i class="fa-solid fa-circle-check"></i> Ticket Raised Successfully: #${res.ticket.ticket_code}
                    </div>
                    <div style="font-size: 0.85rem; margin-top: 4px;">You can view and track updates on the "My Tickets" tab.</div>
                `;
                feedback.classList.remove('hidden');
                form.reset();

                setTimeout(() => {
                    this.currentTab = 'my_tickets';
                    document.querySelectorAll('.support-tab-btn').forEach(b => {
                        b.className = b.getAttribute('data-tab') === 'my_tickets' ? 'btn btn-primary support-tab-btn' : 'btn btn-outline support-tab-btn';
                    });
                    this.loadTab('my_tickets');
                }, 1600);
            } catch (err) {
                feedback.className = 'text-danger';
                feedback.style.background = 'rgba(255, 59, 48, 0.1)';
                feedback.style.border = '1px solid rgba(255, 59, 48, 0.3)';
                feedback.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Error: ${err.message || 'Failed to submit ticket'}`;
                feedback.classList.remove('hidden');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Ticket';
            }
        };
    },

    async renderMyTickets(container) {
        let tickets = [];
        try {
            const res = await API.support.listTickets();
            tickets = res.tickets || [];
        } catch (e) {
            tickets = [];
        }

        if (tickets.length === 0) {
            container.innerHTML = `
                <div class="glass-card" style="padding: 48px 24px; text-align: center; max-width: 600px; margin: 0 auto;">
                    <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--bg-surface-elevated); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: var(--text-muted); margin: 0 auto 16px;">
                        <i class="fa-solid fa-ticket-simple"></i>
                    </div>
                    <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 6px;">No Tickets Raised Yet</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">
                        You have not submitted any support tickets. If you have an inquiry, raise a ticket now.
                    </p>
                    <button type="button" class="btn btn-primary" onclick="SupportView.loadTab('raise')">
                        <i class="fa-solid fa-plus"></i> Raise a Support Ticket
                    </button>
                </div>
            `;
            return;
        }

        const ticketRows = tickets.map(t => {
            const statusBadge = this.getStatusBadge(t.status);
            const priorityBadge = this.getPriorityBadge(t.priority);
            const dateStr = new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            return `
                <div class="glass-card" style="padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 12px; transition: transform var(--transition-fast);">
                    <div style="display: flex; align-items: flex-start; gap: 14px;">
                        <div style="width: 40px; height: 40px; border-radius: 10px; background: var(--bg-surface-elevated); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: var(--color-primary); flex-shrink: 0;">
                            <i class="fa-solid fa-ticket"></i>
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;">
                                <span class="font-mono" style="font-weight: 800; color: var(--color-primary); font-size: 0.95rem;">#${t.ticket_code}</span>
                                ${statusBadge}
                                ${priorityBadge}
                                <span style="font-size: 0.78rem; color: var(--text-muted);">&bull; ${t.category}</span>
                            </div>
                            <div style="font-weight: 700; font-size: 1.05rem; font-family: var(--font-heading); margin-bottom: 4px;">
                                ${t.subject}
                            </div>
                            <div style="font-size: 0.82rem; color: var(--text-muted);">
                                Raised on ${dateStr} &bull; ${t.reply_count || 1} message(s)
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn btn-outline view-ticket-detail-btn" data-id="${t.id}" style="padding: 8px 18px; font-size: 0.85rem;">
                        <i class="fa-solid fa-comments"></i> View Thread
                    </button>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div style="max-width: 900px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div style="font-weight: 800; font-size: 1.1rem; font-family: var(--font-heading);">
                        Active & Historical Tickets (${tickets.length})
                    </div>
                    <button type="button" class="btn btn-primary" onclick="SupportView.loadTab('raise')" style="padding: 6px 16px; font-size: 0.85rem;">
                        <i class="fa-solid fa-plus"></i> New Ticket
                    </button>
                </div>
                ${ticketRows}
            </div>
            <div id="ticket-detail-modal-host"></div>
        `;

        container.querySelectorAll('.view-ticket-detail-btn').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                this.showTicketModal(id);
            };
        });
    },

    async showTicketModal(ticketId) {
        const host = document.getElementById('ticket-detail-modal-host');
        if (!host) return;

        host.innerHTML = `
            <dialog id="ticket-modal" style="width: min(92vw, 680px); padding: 0; border-radius: var(--border-radius-lg); background: var(--bg-surface); border: 1px solid var(--border-color); color: var(--text-primary); box-shadow: var(--shadow-lg);">
                <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-weight: 800; font-size: 1.15rem; font-family: var(--font-heading);" id="ticket-modal-title">
                        Loading Ticket...
                    </div>
                    <button type="button" onclick="document.getElementById('ticket-modal').close()" style="border: none; background: transparent; font-size: 1.2rem; color: var(--text-muted); cursor: pointer;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div style="padding: 20px 24px; max-height: 480px; overflow-y: auto;" id="ticket-modal-body">
                    <div style="text-align: center; padding: 30px;"><i class="fa-solid fa-spinner fa-spin"></i> Loading conversation...</div>
                </div>
                <div style="padding: 16px 24px; border-top: 1px solid var(--border-color); background: var(--bg-surface-elevated);" id="ticket-modal-reply-box">
                </div>
            </dialog>
        `;

        const modal = document.getElementById('ticket-modal');
        modal.showModal();

        try {
            const res = await API.support.getTicket(ticketId);
            const ticket = res.ticket;
            const replies = res.replies || [];

            document.getElementById('ticket-modal-title').innerHTML = `
                <span class="font-mono text-primary">#${ticket.ticket_code}</span>: ${ticket.subject}
            `;

            const repliesHtml = replies.map(r => {
                const isAdmin = r.sender_role === 'admin' || r.sender_role === 'staff';
                const timeStr = new Date(r.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                return `
                    <div style="margin-bottom: 16px; display: flex; flex-direction: column; align-items: ${isAdmin ? 'flex-end' : 'flex-start'};">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 0.78rem;">
                            <span style="font-weight: 700; color: ${isAdmin ? '#FFB703' : 'var(--text-primary)'};">
                                ${isAdmin ? '<i class="fa-solid fa-shield-halved"></i> Staff: ' : ''}${r.sender_name}
                            </span>
                            <span style="color: var(--text-muted);">${timeStr}</span>
                        </div>
                        <div style="max-width: 85%; padding: 12px 16px; border-radius: 14px; background: ${isAdmin ? 'rgba(255, 183, 3, 0.12)' : 'var(--bg-surface-elevated)'}; border: 1px solid ${isAdmin ? 'rgba(255, 183, 3, 0.3)' : 'var(--border-color)'}; font-size: 0.92rem; line-height: 1.45; font-family: var(--font-family);">
                            ${r.message}
                        </div>
                    </div>
                `;
            }).join('');

            document.getElementById('ticket-modal-body').innerHTML = `
                <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;">
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
                        ${this.getStatusBadge(ticket.status)}
                        ${this.getPriorityBadge(ticket.priority)}
                        <span style="font-size: 0.8rem; color: var(--text-muted);">&bull; Category: <strong>${ticket.category}</strong></span>
                    </div>
                    <div style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.5;">
                        ${ticket.description}
                    </div>
                </div>
                <div style="font-size: 0.82rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px; letter-spacing: 0.5px;">
                    Conversation Thread
                </div>
                ${repliesHtml}
            `;

            document.getElementById('ticket-modal-reply-box').innerHTML = `
                <form id="ticket-modal-reply-form" style="display: flex; gap: 10px;">
                    <input type="text" id="modal-reply-msg" placeholder="Write a reply to staff..." style="flex: 1; padding: 10px 14px; border-radius: var(--border-radius-full); border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary);" required>
                    <button type="submit" class="btn btn-primary" style="padding: 10px 20px; font-size: 0.88rem;">
                        <i class="fa-solid fa-reply"></i> Send
                    </button>
                </form>
            `;

            document.getElementById('ticket-modal-reply-form').onsubmit = async (e) => {
                e.preventDefault();
                const msgInput = document.getElementById('modal-reply-msg');
                const message = msgInput.value.trim();
                if (!message) return;

                msgInput.disabled = true;
                try {
                    await API.support.addReply(ticketId, { message });
                    this.showTicketModal(ticketId); // Refresh modal thread
                } catch (err) {
                    alert('Failed to send reply: ' + err.message);
                    msgInput.disabled = false;
                }
            };

        } catch (err) {
            document.getElementById('ticket-modal-body').innerHTML = `<div class="text-danger">Failed to load ticket details: ${err.message}</div>`;
        }
    },

    renderFaq(container) {
        const faqs = [
            {
                q: "What is the CCPulse Welcome Bonus?",
                a: "Every new user receives a guaranteed $5,000.00 virtual trading credit upon registration. This balance is stored in your personal virtual wallet and allows you to practice paper trading risk-free."
            },
            {
                q: "Can I deposit or withdraw real fiat money or cryptocurrency?",
                a: "No. CCPulse is strictly an educational simulation and paper-trading platform designed for financial literacy. In full compliance with Apple App Store Guideline 3.1.5 and Google Play Developer Policies, no real money or cryptocurrencies are held, deposited, or withdrawn."
            },
            {
                q: "Where do the live cryptocurrency prices and exchange rates come from?",
                a: "Crypto prices are pulled directly in real-time from the CoinGecko Simple Price API. Forex reference rates for USD, INR, EUR, GBP, AED, and JPY are synced live from open.er-api.com."
            },
            {
                q: "How does Beldex (BDX) work in the platform?",
                a: "Beldex is a privacy-first web3 ecosystem with Masternodes and Proof-of-Stake consensus. In CCPulse, you can practice paper trading BDX, inspect its liquidity metrics, and learn about RingCT and confidential ledgers."
            },
            {
                q: "How do I test the platform as an Administrator?",
                a: "Log in with the credentials: admin@ccpulse.com / Admin@CCPulse2026!. An 'Admin Control' navigation item will appear, granting access to the Dynamic Coin Registry, Daily Registration Analytics, and Support Tickets Console."
            }
        ];

        const faqHtml = faqs.map((f, i) => `
            <details class="glass-card" style="padding: 16px 20px; margin-bottom: 12px; border-radius: 14px; cursor: pointer;">
                <summary style="font-weight: 700; font-size: 1rem; color: var(--text-primary); font-family: var(--font-heading); list-style: none; display: flex; justify-content: space-between; align-items: center;">
                    <span><i class="fa-solid fa-circle-question text-primary" style="margin-right: 8px;"></i> ${f.q}</span>
                    <i class="fa-solid fa-chevron-down" style="font-size: 0.8rem; color: var(--text-muted);"></i>
                </summary>
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color); color: var(--text-secondary); line-height: 1.55; font-size: 0.92rem; font-family: var(--font-family);">
                    ${f.a}
                </div>
            </details>
        `).join('');

        container.innerHTML = `
            <div style="max-width: 820px; margin: 0 auto;">
                <div style="font-size: 1.15rem; font-weight: 800; font-family: var(--font-heading); margin-bottom: 16px;">
                    Frequently Asked Questions & Educational Guides
                </div>
                ${faqHtml}
            </div>
        `;
    },

    getStatusBadge(status) {
        switch (status) {
            case 'open':
                return '<span style="background: rgba(58, 134, 255, 0.15); color: #3A86FF; border: 1px solid rgba(58, 134, 255, 0.3); font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 6px;">OPEN</span>';
            case 'in_progress':
                return '<span style="background: rgba(255, 183, 3, 0.15); color: #FFB703; border: 1px solid rgba(255, 183, 3, 0.3); font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 6px;">IN PROGRESS</span>';
            case 'resolved':
                return '<span style="background: rgba(0, 230, 118, 0.15); color: #00E676; border: 1px solid rgba(0, 230, 118, 0.3); font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 6px;">RESOLVED</span>';
            case 'closed':
                return '<span style="background: rgba(255, 255, 255, 0.08); color: var(--text-muted); border: 1px solid var(--border-color); font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 6px;">CLOSED</span>';
            default:
                return `<span style="font-size: 0.72rem; font-weight: 700;">${status.toUpperCase()}</span>`;
        }
    },

    getPriorityBadge(priority) {
        switch (priority) {
            case 'urgent':
                return '<span style="background: rgba(255, 59, 48, 0.15); color: #FF3B30; border: 1px solid rgba(255, 59, 48, 0.3); font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 6px;"><i class="fa-solid fa-triangle-exclamation"></i> URGENT</span>';
            case 'high':
                return '<span style="background: rgba(255, 149, 0, 0.15); color: #FF9500; border: 1px solid rgba(255, 149, 0, 0.3); font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 6px;">HIGH</span>';
            case 'medium':
                return '<span style="background: rgba(58, 134, 255, 0.1); color: #3A86FF; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 6px;">MEDIUM</span>';
            default:
                return '<span style="background: rgba(255, 255, 255, 0.05); color: var(--text-muted); font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 6px;">LOW</span>';
        }
    }
};

window.SupportView = SupportView;

