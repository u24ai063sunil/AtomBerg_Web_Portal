const express = require('express');
const router = express.Router();
const QuarterlyEntry = require('../models/QuarterlyEntry');
const Goal = require('../models/Goal');
const SharedGoal = require('../models/SharedGoal');
const AuditLog = require('../models/AuditLog');
const { computeScore } = require('../utils/scoreUtils');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { requireActiveWindow } = require('../middleware/validators');
const { autoAuditLog } = require('../middleware/audit');

// We use requireActiveWindow dynamically or we define it per route
// Since the route contains :quarter, we can check it inside the route
router.post('/:goalId/:quarter', authenticateJWT, requireRole('EMPLOYEE', 'MANAGER', 'ADMIN'), async (req, res) => {
    try {
        const { goalId, quarter } = req.params;
        const { plannedValue, actualValue, actualNumeric, completionDate, status } = req.body;
        
        // Custom window check because quarter is dynamic
        const Cycle = require('../models/Cycle');
        const cycle = await Cycle.findOne({ isActive: true });
        if (!cycle) return res.status(403).json({ success: false, error: 'No active cycle found' });

        const now = new Date();
        let isOpen = false;
        switch (quarter.toUpperCase()) {
            case 'Q1': isOpen = now >= cycle.q1Open && now <= cycle.q1Close; break;
            case 'Q2': isOpen = now >= cycle.q2Open && now <= cycle.q2Close; break;
            case 'Q3': isOpen = now >= cycle.q3Open && now <= cycle.q3Close; break;
            case 'Q4': isOpen = now >= cycle.q4Open && now <= cycle.q4Close; break;
        }

        if (!isOpen) return res.status(403).json({ success: false, error: `Window for ${quarter} is currently closed` });

        const goal = await Goal.findById(goalId);
        if (!goal) return res.status(404).json({ success: false, error: 'Goal not found' });

        const score = computeScore(goal.uomType, goal.targetNumeric, goal.targetDate, actualNumeric, completionDate);

        const entry = await QuarterlyEntry.findOneAndUpdate(
            { goalId, quarter: quarter.toUpperCase() },
            { plannedValue, actualValue, actualNumeric, completionDate, status, score, enteredBy: req.user._id, isWindowOpen: isOpen },
            { new: true, upsert: true }
        );

        // Sync to shared goal if primary owner
        if (goal.isShared && goal.sharedGoalId) {
            const sharedGoal = await SharedGoal.findById(goal.sharedGoalId);
            if (sharedGoal && sharedGoal.primaryOwnerId.toString() === req.user._id.toString()) {
                sharedGoal.latestAchievement = actualNumeric;
                sharedGoal.lastSyncedAt = new Date();
                await sharedGoal.save();
                
                // Here we would sync down to other users, but per BRD:
                // "Achievement sync for shared goals flows from primary owner to all linked sheets"
                // This means when computing scores for linked sheets, they pull from `latestAchievement`.
            }
        }

        // Audit log
        const log = new AuditLog({
            actorId: req.user._id,
            actorName: req.user.name,
            actorRole: req.user.role,
            entityType: 'GOAL',
            entityId: goal._id,
            action: 'CHECK_IN',
            newValue: { quarter, actualNumeric, score },
            reason: 'Quarterly Check-In'
        });
        await log.save();

        res.json({ success: true, data: entry });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
