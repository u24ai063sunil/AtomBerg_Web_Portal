const AuditLog = require('../models/AuditLog');

const autoAuditLog = (entityType) => {
    return async (req, res, next) => {
        const originalSend = res.json;
        res.json = async function (data) {
            res.json = originalSend;
            
            if (data.success && req.auditData) {
                const log = new AuditLog({
                    actorId: req.user ? req.user._id : null,
                    actorName: req.user ? req.user.name : 'System',
                    actorRole: req.user ? req.user.role : 'SYSTEM',
                    entityType: entityType,
                    entityId: req.auditData.entityId,
                    action: req.auditData.action,
                    oldValue: req.auditData.oldValue,
                    newValue: req.auditData.newValue,
                    reason: req.body.reason || req.auditData.reason
                });
                await log.save().catch(err => console.error('AuditLog save error:', err));
            }
            return res.json.call(this, data);
        };
        next();
    };
};

module.exports = { autoAuditLog };
