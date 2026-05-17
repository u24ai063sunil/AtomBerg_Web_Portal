const express = require('express');
const router = express.Router();
const EscalationRule = require('../models/EscalationRule');
const EscalationLog = require('../models/EscalationLog');
const { authenticateJWT } = require('../middleware/auth');
const requireRole = (roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ success: false, message: 'Forbidden' });

// Get all rules
router.get('/rules', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
    try {
        const rules = await EscalationRule.find().populate('cycleId', 'name');
        res.json({ success: true, data: rules });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Create/Update a rule
router.post('/rules', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id, cycleId, triggerEvent, daysThreshold, notifyEmployee, notifyManager, notifySkipLevel, isActive } = req.body;
        
        let rule;
        if (id) {
            rule = await EscalationRule.findByIdAndUpdate(id, {
                daysThreshold, notifyEmployee, notifyManager, notifySkipLevel, isActive
            }, { new: true });
        } else {
            rule = await EscalationRule.create({
                cycleId, triggerEvent, daysThreshold, notifyEmployee, notifyManager, notifySkipLevel, isActive
            });
        }
        res.json({ success: true, data: rule });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get logs
router.get('/logs', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
    try {
        const logs = await EscalationLog.find()
            .populate('ruleId', 'triggerEvent')
            .populate('userId', 'name email role')
            .sort({ sentAt: -1 });
        res.json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Resolve a log
router.put('/logs/:id/resolve', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
    try {
        const log = await EscalationLog.findByIdAndUpdate(req.params.id, {
            status: 'RESOLVED',
            resolvedAt: new Date()
        }, { new: true });
        res.json({ success: true, data: log });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Manual trigger for testing
router.post('/trigger', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { checkEscalations } = require('../services/escalationCron');
        await checkEscalations();
        res.json({ success: true, message: 'Escalation job triggered manually.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
