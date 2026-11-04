const db = require('../database/db');

function logAdminAction({ adminId, adminUsername, action, entityType, entityId, oldValues = null, newValues = null, auditReason = '', ipAddress = '' }) {
    try {
        const stmt = db.prepare(`
            INSERT INTO admin_audit_logs (
                admin_id, admin_username, action, entity_type, entity_id,
                old_values, new_values, audit_reason, ip_address
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            adminId || null,
            adminUsername || 'system',
            action,
            entityType,
            entityId ? String(entityId) : null,
            oldValues ? JSON.stringify(oldValues) : null,
            newValues ? JSON.stringify(newValues) : null,
            auditReason || null,
            ipAddress || '127.0.0.1'
        );
    } catch (err) {
        console.error('Failed to write admin audit log:', err.message);
    }
}

function getAuditLogs({ limit = 50, offset = 0, search = '' } = {}) {
    let query = 'SELECT * FROM admin_audit_logs';
    const params = [];

    if (search) {
        query += ' WHERE admin_username LIKE ? OR action LIKE ? OR entity_type LIKE ? OR audit_reason LIKE ?';
        const pattern = `%${search}%`;
        params.push(pattern, pattern, pattern, pattern);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const logs = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM admin_audit_logs').get().count;

    return { logs, total };
}

module.exports = {
    logAdminAction,
    getAuditLogs
};

