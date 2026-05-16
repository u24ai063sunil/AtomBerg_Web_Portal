const express = require('express');
const router = express.Router();
const GoalSheet = require('../models/GoalSheet');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to protect routes and check manager role
const isManager = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'manager' && decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Manager role required.' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Get team members and their goal sheet statuses
router.get('/team', isManager, async (req, res) => {
    try {
        const team = await User.find({ managerId: req.user.id });
        const cycle = req.query.cycle || '2024-25';
        
        const teamWithGoals = await Promise.all(team.map(async (member) => {
            const goalSheet = await GoalSheet.findOne({ employeeId: member._id, cycle });
            return {
                _id: member._id,
                name: member.name,
                email: member.email,
                picture: member.picture,
                goalSheetStatus: goalSheet ? goalSheet.status : 'not_started',
                goalSheetId: goalSheet ? goalSheet._id : null
            };
        }));

        res.json(teamWithGoals);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Approve goal sheet
router.post('/approve', isManager, async (req, res) => {
    try {
        const { goalSheetId } = req.body;
        const goalSheet = await GoalSheet.findById(goalSheetId);
        
        if (!goalSheet) return res.status(404).json({ message: 'Goal sheet not found' });
        
        goalSheet.status = 'approved';
        goalSheet.isLocked = true;
        await goalSheet.save();

        res.json(goalSheet);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Return for rework
router.post('/return', isManager, async (req, res) => {
    try {
        const { goalSheetId, comment } = req.body;
        const goalSheet = await GoalSheet.findById(goalSheetId);
        
        if (!goalSheet) return res.status(404).json({ message: 'Goal sheet not found' });
        
        goalSheet.status = 'returned';
        // Add comment to audit or checkIns? Let's use a simple approach for now.
        await goalSheet.save();

        res.json(goalSheet);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
