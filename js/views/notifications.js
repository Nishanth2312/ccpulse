/**
 * CCPulse Notifications Dropdown / Dialog
 */
const NotificationsView = {
    async showModal() {
        let notifications = [];
        try {
            const res = await API.notifications.list();
            notifications = res.notifications || [];
        } catch (e) {
            notifications = [];
        }

        const dialog = AuthModals.createModal('notifications-dialog', `
            <div class="modal-header">
                <h3><i class="fa-solid fa-bell text-cyan"></i> Notifications</h3>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button type="button" id="notif-mark-all-btn" class="btn btn-outline" style="font-size: 0.78rem; padding: 4px 8px;">
                        Mark All Read
                    </button>
                    <button type="button" class="modal-close-btn" aria-label="Close dialog"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>
            <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
                ${notifications.length === 0 ? `
                    <div style="text-align: center; padding: 30px; color: var(--text-muted);">
                        <i class="fa-regular fa-bell-slash" style="font-size: 2rem; margin-bottom: 8px;"></i>
                        <p>No notifications yet.</p>
                    </div>
                ` : notifications.map(n => {
                    const iconMap = {
                        WELCOME_BONUS: 'fa-gift text-success',
                        TRADE: 'fa-bolt text-cyan',
                        ALERT: 'fa-triangle-exclamation text-danger',
                        ADMIN: 'fa-user-shield text-cyan',
                        SYSTEM: 'fa-circle-info text-cyan'
                    };
                    const icon = iconMap[n.type] || 'fa-bell text-cyan';
                    return `
                        <div style="padding: 12px; background: ${n.is_read ? 'var(--bg-surface)' : 'var(--bg-surface-elevated)'}; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 8px; border-left: 3px solid ${n.is_read ? 'transparent' : 'var(--color-primary)'};">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 0.9rem;">
                                    <i class="fa-solid ${icon}"></i> ${n.title}
                                </div>
                                <span style="font-size: 0.72rem; color: var(--text-muted);">${new Date(n.created_at).toLocaleDateString()}</span>
                            </div>
                            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${n.message}</p>
                        </div>
                    `;
                }).join('')}
            </div>
        `);

        dialog.querySelector('#notif-mark-all-btn').onclick = async () => {
            try {
                await API.notifications.markAllRead();
                State.unreadNotificationsCount = 0;
                State.notify('notifications');
                dialog.close();
            } catch (e) {
                alert(e.message);
            }
        };

        dialog.showModal();
    }
};

window.NotificationsView = NotificationsView;

