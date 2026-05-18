const express = require('express');
const router = express.Router();
const GoalSheet = require('../models/GoalSheet');
const Goal = require('../models/Goal');
const Cycle = require('../models/Cycle');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { requireActiveWindow, validateGoalSheet } = require('../middleware/validators');

// Get my sheet for active cycle
router.get('/my-sheet', authenticateJWT, requireRole('EMPLOYEE', 'MANAGER', 'ADMIN'), async (req, res) => {
    try {
        const { cycleId } = req.query;
        let cycle = null;
        if (cycleId) {
            cycle = await Cycle.findById(cycleId);
        } else {
            cycle = await Cycle.findOne({ isActive: true });
        }
        
        if (!cycle) {
            // Auto-bootstrap a default cycle for production readiness
            cycle = new Cycle({
                name: 'FY 2025-26',
                fiscalYear: '2025-26',
                startDate: new Date(),
                endDate: new Date(Date.now() + 31536000000), // +1 year
                isActive: true,
                maxGoalsPerEmployee: 8,
                minWeightagePerGoal: 10,
                activeWindow: 'GOAL_SETTING'
            });
            await cycle.save();
        }

        let sheet = await GoalSheet.findOne({ employeeId: req.user._id, cycleId: cycle._id });
        if (!sheet) {
             sheet = new GoalSheet({ employeeId: req.user._id, cycleId: cycle._id });
             await sheet.save();
        }

        const goals = await Goal.find({ goalSheetId: sheet._id }).sort('order');
        res.json({ success: true, data: { sheet, goals } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create a new goal
router.post('/', authenticateJWT, requireRole('EMPLOYEE', 'MANAGER', 'ADMIN'), requireActiveWindow('GOAL_SETTING'), async (req, res) => {
    try {
        const { title, description, thrustArea, uomType, target, targetNumeric, targetDate, weightage } = req.body;
        const cycle = req.activeCycle;
        
        let sheet = await GoalSheet.findOne({ employeeId: req.user._id, cycleId: cycle._id });
        if (!sheet) {
            sheet = new GoalSheet({ employeeId: req.user._id, cycleId: cycle._id });
            await sheet.save();
        }
        
        if (sheet.isLocked) {
             return res.status(403).json({ success: false, error: 'Goal sheet is locked.' });
        }

        const goalsCount = await Goal.countDocuments({ goalSheetId: sheet._id });
        if (goalsCount >= cycle.maxGoalsPerEmployee) {
            return res.status(400).json({ success: false, error: `Maximum ${cycle.maxGoalsPerEmployee} goals allowed.` });
        }
        
        if (weightage < cycle.minWeightagePerGoal) {
             return res.status(400).json({ success: false, error: `Minimum weightage is ${cycle.minWeightagePerGoal}%.` });
        }

        const goal = new Goal({
            goalSheetId: sheet._id,
            title, description, thrustArea, uomType, target, targetNumeric, targetDate, weightage
        });
        await goal.save();
        
        res.status(201).json({ success: true, data: goal });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Edit goal
router.put('/:id', authenticateJWT, requireRole('EMPLOYEE', 'MANAGER', 'ADMIN'), requireActiveWindow('GOAL_SETTING'), async (req, res) => {
    try {
        const goalId = req.params.id;
        const goal = await Goal.findById(goalId);
        if (!goal) return res.status(404).json({ success: false, error: 'Goal not found.' });

        const sheet = await GoalSheet.findById(goal.goalSheetId);
        if (sheet.employeeId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Unauthorized.' });
        }
        if (sheet.isLocked || (sheet.status !== 'DRAFT' && sheet.status !== 'RETURNED')) {
            return res.status(403).json({ success: false, error: 'Cannot edit goals in current sheet status.' });
        }
        
        if (goal.isReadOnly) {
            // Only update weightage
            if (req.body.weightage !== undefined) {
                 if (req.body.weightage < req.activeCycle.minWeightagePerGoal) {
                      return res.status(400).json({ success: false, error: `Minimum weightage is ${req.activeCycle.minWeightagePerGoal}%.` });
                 }
                 goal.weightage = req.body.weightage;
                 await goal.save();
                 return res.json({ success: true, data: goal });
            }
            return res.status(403).json({ success: false, error: 'Shared goals are read-only except for weightage.' });
        }

        const updatableFields = ['title', 'description', 'thrustArea', 'uomType', 'target', 'targetNumeric', 'targetDate', 'weightage'];
        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) goal[field] = req.body[field];
        });
        
        if (goal.weightage < req.activeCycle.minWeightagePerGoal) {
            return res.status(400).json({ success: false, error: `Minimum weightage is ${req.activeCycle.minWeightagePerGoal}%.` });
        }

        await goal.save();
        res.json({ success: true, data: goal });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete goal
router.delete('/:id', authenticateJWT, requireRole('EMPLOYEE', 'MANAGER', 'ADMIN'), requireActiveWindow('GOAL_SETTING'), async (req, res) => {
    try {
        const goalId = req.params.id;
        const goal = await Goal.findById(goalId);
        if (!goal) return res.status(404).json({ success: false, error: 'Goal not found.' });

        const sheet = await GoalSheet.findById(goal.goalSheetId);
        if (sheet.employeeId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Unauthorized.' });
        }
        if (sheet.isLocked || (sheet.status !== 'DRAFT' && sheet.status !== 'RETURNED')) {
            return res.status(403).json({ success: false, error: 'Cannot delete goals in current sheet status.' });
        }

        await Goal.findByIdAndDelete(goalId);
        res.json({ success: true, data: null });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Bulk save goals
router.post('/bulk-save', authenticateJWT, requireRole('EMPLOYEE', 'MANAGER', 'ADMIN'), requireActiveWindow('GOAL_SETTING'), async (req, res) => {
    try {
        const { goals } = req.body;
        const cycle = req.activeCycle;
        
        let sheet = await GoalSheet.findOne({ employeeId: req.user._id, cycleId: cycle._id });
        if (!sheet) {
            sheet = new GoalSheet({ employeeId: req.user._id, cycleId: cycle._id });
            await sheet.save();
        }

        if (sheet.isLocked || (sheet.status !== 'DRAFT' && sheet.status !== 'RETURNED')) {
            return res.status(403).json({ success: false, error: 'Cannot edit goals in current sheet status.' });
        }

        // Wipe existing goals and re-insert for simplicity, OR update existing.
        // For production UI where we hold state locally and "Save Draft", wiping and replacing is easiest if we don't care about ID preservation on drafts.
        // Actually, let's update by ID or create if no ID.
        const currentGoals = await Goal.find({ goalSheetId: sheet._id });
        const existingIds = currentGoals.map(g => g._id.toString());
        
        const incomingIds = goals.filter(g => g._id).map(g => g._id.toString());
        
        // Delete goals not in incoming
        const toDelete = existingIds.filter(id => !incomingIds.includes(id));
        await Goal.deleteMany({ _id: { $in: toDelete } });

        for (let i = 0; i < goals.length; i++) {
            let g = goals[i];
            if (g._id && existingIds.includes(g._id.toString())) {
                await Goal.findByIdAndUpdate(g._id, { ...g, order: i });
            } else {
                delete g._id; // Remove temporary ID from frontend
                delete g.id;
                g.goalSheetId = sheet._id;
                g.order = i;
                await Goal.create(g);
            }
        }
        
        const updatedGoals = await Goal.find({ goalSheetId: sheet._id }).sort('order');
        res.json({ success: true, data: updatedGoals });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Submit sheet
router.post('/submit', authenticateJWT, requireRole('EMPLOYEE', 'MANAGER', 'ADMIN'), requireActiveWindow('GOAL_SETTING'), async (req, res) => {
    try {
        const cycle = req.activeCycle;
        const sheet = await GoalSheet.findOne({ employeeId: req.user._id, cycleId: cycle._id });
        if (!sheet) return res.status(404).json({ success: false, error: 'Goal sheet not found.' });
        
        if (sheet.isLocked || (sheet.status !== 'DRAFT' && sheet.status !== 'RETURNED')) {
            return res.status(400).json({ success: false, error: 'Goal sheet cannot be submitted in current state.' });
        }

        const goals = await Goal.find({ goalSheetId: sheet._id });
        const errors = validateGoalSheet(goals, cycle);
        
        if (errors.length > 0) {
            return res.status(400).json({ success: false, error: 'Validation failed', fields: { errors } });
        }

        sheet.status = 'SUBMITTED';
        sheet.submittedAt = new Date();
        await sheet.save();

        // Send Webhook Alert (Slack/Teams)
        const { sendWebhookNotification } = require('../utils/webhookSender');
        sendWebhookNotification({
            type: 'SUBMIT',
            userName: req.user.name,
            details: {
                department: req.user.department,
                designation: req.user.designation
            },
            actionUrl: `${req.protocol}://${req.get('host')}/dashboard/team-review`
        }).catch(err => console.error(err));

        // Unlock "Early Aligner" Achievement Badge
        const employeeRecord = await User.findById(req.user._id);
        if (employeeRecord) {
            const hasEarlyAligner = employeeRecord.achievements.some(a => a.id === 'early_aligner');
            if (!hasEarlyAligner) {
                employeeRecord.achievements.push({
                    id: 'early_aligner',
                    name: 'Early Aligner',
                    icon: '⚡',
                    description: 'Successfully aligned and submitted your Goal Sheet ahead of the deadline!'
                });
                await employeeRecord.save();
            }
        }

        // Send Email & Teams Notifications
        const { notifyGoalSubmitted } = require('../services/notificationService');
        const User = require('../models/User');
        const employee = await User.findById(req.user._id);
        if (employee && employee.managerId) {
            const manager = await User.findById(employee.managerId);
            if (manager) {
                notifyGoalSubmitted(employee, manager, goals, sheet._id).catch(err => console.error(err));
            }
        }

        res.json({ success: true, data: sheet });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
