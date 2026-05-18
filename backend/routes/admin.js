const express = require('express');
const router = express.Router();
const Cycle = require('../models/Cycle');
const GoalSheet = require('../models/GoalSheet');
const Goal = require('../models/Goal');
const SharedGoal = require('../models/SharedGoal');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { autoAuditLog } = require('../middleware/audit');

router.use(authenticateJWT, requireRole('ADMIN'));

// Create new cycle
router.post('/cycle', async (req, res) => {
    try {
        const cycle = new Cycle(req.body);
        await cycle.save();
        res.status(201).json({ success: true, data: cycle });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update cycle config
router.put('/cycle/:id', async (req, res) => {
    try {
        const cycle = await Cycle.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: cycle });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Unlock a locked goal
router.put('/goal/:goalId/unlock', autoAuditLog('GOAL'), async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) return res.status(400).json({ success: false, error: 'Reason is mandatory' });

        const goal = await Goal.findById(req.params.goalId);
        if (!goal) return res.status(404).json({ success: false, error: 'Goal not found' });

        const sheet = await GoalSheet.findById(goal.goalSheetId);
        if (!sheet) return res.status(404).json({ success: false, error: 'Sheet not found' });

        req.auditData = {
            entityId: goal._id,
            action: 'GOAL_UNLOCKED',
            oldValue: { isLocked: sheet.isLocked },
            newValue: { isLocked: false },
            reason
        };

        sheet.isLocked = false;
        sheet.status = 'RETURNED'; // usually unlocking means they can edit it, so RETURNED makes sense
        await sheet.save();

        res.json({ success: true, data: sheet });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Push shared goal to multiple employees
router.post('/shared-goal', async (req, res) => {
    try {
        const { title, description, thrustArea, uomType, target, targetNumeric, primaryOwnerId, cycleId, recipientIds } = req.body;
        
        const sharedGoal = new SharedGoal({
            title, description, thrustArea, uomType, target, targetNumeric, primaryOwnerId, cycleId, pushedBy: req.user._id
        });
        await sharedGoal.save();

        // Push to recipients: Create goals and associate them to recipients' active goal sheets
        if (recipientIds && Array.isArray(recipientIds)) {
            for (const userId of recipientIds) {
                // 1. Find or create the GoalSheet for the recipient in the current cycle
                let sheet = await GoalSheet.findOne({ employeeId: userId, cycleId });
                if (!sheet) {
                    sheet = new GoalSheet({ 
                        employeeId: userId, 
                        cycleId, 
                        status: 'DRAFT',
                        isLocked: false
                    });
                    await sheet.save();
                }

                // 2. Check if a goal pointing to this SharedGoal already exists on this sheet
                const existingGoal = await Goal.findOne({ goalSheetId: sheet._id, sharedGoalId: sharedGoal._id });
                if (!existingGoal) {
                    const newGoal = new Goal({
                        goalSheetId: sheet._id,
                        title,
                        description,
                        thrustArea,
                        uomType: uomType || 'numeric',
                        target,
                        targetNumeric,
                        isShared: true,
                        sharedGoalId: sharedGoal._id,
                        isReadOnly: true,
                        weightage: 10 // Starting default contribution weightage
                    });
                    await newGoal.save();
                }
            }
        }
        
        res.json({ success: true, data: sharedGoal });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Audit Log
router.get('/audit-log', async (req, res) => {
    try {
        const { page = 1, entityType, actorId } = req.query;
        const query = {};
        if (entityType) query.entityType = entityType;
        if (actorId) query.actorId = actorId;

        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * 20)
            .limit(20);
        res.json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// List all users with hierarchy
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}).populate('managerId', 'name email').select('-passwordHash');
        res.json({ success: true, data: users });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update user role and manager (Admin only)
router.put('/users/:userId', async (req, res) => {
    try {
        const { role, managerId } = req.body;
        const updateData = {};
        if (role) updateData.role = role.toUpperCase();
        if (managerId !== undefined) {
            updateData.managerId = managerId === "" ? null : managerId;
        }
        
        const user = await User.findByIdAndUpdate(req.params.userId, updateData, { new: true })
            .populate('managerId', 'name email')
            .select('-passwordHash');
            
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
