const AuditLog = require('../models/AuditLog');

const logChange = async (req, res, next) => {
    // Only log if the goal sheet was already locked/approved
    // This is a placeholder logic
    const originalJson = res.json;
    res.json = function(data) {
        if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
            // Logic to identify goal changes and log to AuditLog
        }
        originalJson.call(this, data);
    };
    next();
};

module.exports = { logChange };
