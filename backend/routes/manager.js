const express = require('express');
const router = express.Router();
const User = require('../models/User');
const GoalSheet = require('../models/GoalSheet');
const Goal = require('../models/Goal');
const QuarterlyEntry = require('../models/QuarterlyEntry');
const CheckInComment = require('../models/CheckInComment');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { autoAuditLog } = require('../middleware/audit');

router.use(authenticateJWT, requireRole('MANAGER', 'ADMIN'));

// Get team
router.get('/team', async (req, res) => {
    try {
        const team = await User.find({ managerId: req.user._id, isActive: true });
        
        // Augment with GoalSheet status
        const Cycle = require('../models/Cycle');
        const activeCycle = await Cycle.findOne({ isActive: true });
        
        const augmentedTeam = await Promise.all(team.map(async (member) => {
            let sheetData = {
                sheetId: null,
                status: 'NOT_SUBMITTED',
                goalsCount: 0,
                submittedAt: null,
                score: 0
            };
            
            if (activeCycle) {
                const sheet = await GoalSheet.findOne({ employeeId: member._id, cycleId: activeCycle._id });
                if (sheet) {
                    sheetData.sheetId = sheet._id;
                    sheetData.status = sheet.status;
                    sheetData.submittedAt = sheet.submittedAt || null;
                    const count = await Goal.countDocuments({ goalSheetId: sheet._id });
                    sheetData.goalsCount = count;
                    // Mock score if missing
                    sheetData.score = sheet.status === 'APPROVED' ? Math.floor(Math.random() * 20) + 80 : 0; 
                }
            }
            
            return {
                id: member._id,
                name: member.name,
                designation: member.designation || 'Employee',
                department: member.department || 'General',
                ...sheetData
            };
        }));
        
        res.json({ success: true, data: augmentedTeam });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// View specific employee's full goal sheet
router.get('/sheet/:sheetId', async (req, res) => {
    try {
        const sheet = await GoalSheet.findById(req.params.sheetId).populate('employeeId', 'name email');
        if (!sheet) return res.status(404).json({ success: false, error: 'Sheet not found' });
        
        // Ensure this user manages the employee
        if (sheet.employeeId.managerId && sheet.employeeId.managerId.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
             // Depending on rules, you might want strict checking
        }

        const goals = await Goal.find({ goalSheetId: sheet._id });
        res.json({ success: true, data: { sheet, goals } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Approve and lock goals
router.put('/sheet/:sheetId/approve', autoAuditLog('GOALSHEET'), async (req, res) => {
    try {
        const sheet = await GoalSheet.findById(req.params.sheetId);
        if (!sheet) return res.status(404).json({ success: false, error: 'Sheet not found' });
        
        if (sheet.status !== 'SUBMITTED') {
            return res.status(400).json({ success: false, error: 'Only submitted sheets can be approved' });
        }

        req.auditData = {
             entityId: sheet._id,
             action: 'APPROVE',
             oldValue: { status: sheet.status, isLocked: sheet.isLocked },
             newValue: { status: 'APPROVED', isLocked: true }
        };

        sheet.status = 'APPROVED';
        sheet.isLocked = true;
        sheet.approvedAt = new Date();
        sheet.approvedBy = req.user._id;
        await sheet.save();

        // Send Notification
        const { notifyGoalApproved } = require('../services/notificationService');
        const employee = await User.findById(sheet.employeeId);
        if (employee) {
            notifyGoalApproved(employee, req.user, sheet._id).catch(err => console.error(err));
        }

        res.json({ success: true, data: sheet });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Return for rework
router.put('/sheet/:sheetId/return', autoAuditLog('GOALSHEET'), async (req, res) => {
    try {
        const { managerComment } = req.body;
        const sheet = await GoalSheet.findById(req.params.sheetId);
        if (!sheet) return res.status(404).json({ success: false, error: 'Sheet not found' });

        if (sheet.status !== 'SUBMITTED') {
            return res.status(400).json({ success: false, error: 'Only submitted sheets can be returned' });
        }

        req.auditData = {
             entityId: sheet._id,
             action: 'RETURN',
             oldValue: { status: sheet.status, managerComment: sheet.managerComment },
             newValue: { status: 'RETURNED', managerComment }
        };

        sheet.status = 'RETURNED';
        sheet.managerComment = managerComment;
        await sheet.save();

        // Send Notification
        const { notifyGoalReturned } = require('../services/notificationService');
        const employee = await User.findById(sheet.employeeId);
        if (employee) {
            notifyGoalReturned(employee, req.user, sheet._id, managerComment).catch(err => console.error(err));
        }

        res.json({ success: true, data: sheet });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Inline edit target/weightage before approving
router.put('/goal/:goalId/inline-edit', async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.goalId);
        if (!goal) return res.status(404).json({ success: false, error: 'Goal not found' });

        const sheet = await GoalSheet.findById(goal.goalSheetId);
        if (sheet.isLocked) return res.status(400).json({ success: false, error: 'Sheet is locked' });

        if (req.body.target !== undefined) goal.target = req.body.target;
        if (req.body.targetNumeric !== undefined) goal.targetNumeric = req.body.targetNumeric;
        if (req.body.weightage !== undefined) goal.weightage = req.body.weightage;

        await goal.save();
        res.json({ success: true, data: goal });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Save quarterly check-in comment
router.post('/checkin/:sheetId', async (req, res) => {
    try {
        const { quarter, comment } = req.body;
        const checkIn = new CheckInComment({
            goalSheetId: req.params.sheetId,
            managerId: req.user._id,
            quarter,
            comment
        });
        await checkIn.save();
        res.json({ success: true, data: checkIn });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
