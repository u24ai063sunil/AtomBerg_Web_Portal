const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const SharedGoal = require('../models/SharedGoal');
const Goal = require('../models/Goal');
const GoalSheet = require('../models/GoalSheet');

// GET /api/goals/cascade
// Compiles corporate Shared Goals and traces individual mapped goals for visual cascading OKR tree.
router.get('/cascade', authenticateJWT, async (req, res) => {
    try {
        // 1. Fetch all corporate level Shared Goals
        const sharedGoals = await SharedGoal.find()
            .populate('primaryOwnerId', 'name designation department picture')
            .lean();

        // 2. Fetch all individual level goals mapping to those corporate shared goals
        const individualGoals = await Goal.find({ sharedGoalId: { $in: sharedGoals.map(sg => sg._id) } })
            .populate({
                path: 'goalSheetId',
                populate: {
                    path: 'employeeId',
                    select: 'name designation department picture managerId'
                }
            })
            .lean();

        // 3. Structure cascade tree
        const cascadeTree = sharedGoals.map(sg => {
            const children = individualGoals
                .filter(ig => ig.sharedGoalId.toString() === sg._id.toString() && ig.goalSheetId && ig.goalSheetId.employeeId)
                .map(ig => {
                    const employee = ig.goalSheetId.employeeId;
                    return {
                        id: ig._id,
                        title: ig.title,
                        weightage: ig.weightage,
                        target: ig.target,
                        employee: {
                            id: employee._id,
                            name: employee.name,
                            designation: employee.designation,
                            department: employee.department,
                            picture: employee.picture
                        }
                    };
                });

            return {
                id: sg._id,
                title: sg.title,
                thrustArea: sg.thrustArea,
                target: sg.target,
                latestAchievement: sg.latestAchievement,
                primaryOwner: sg.primaryOwnerId ? {
                    name: sg.primaryOwnerId.name,
                    designation: sg.primaryOwnerId.designation,
                    department: sg.primaryOwnerId.department
                } : null,
                children: children
            };
        });

        res.json({ success: true, cascade: cascadeTree });
    } catch (err) {
        console.error("Cascade compile error:", err);
        res.status(500).json({ success: false, message: 'Server error compiling OKR tree.' });
    }
});

module.exports = router;
