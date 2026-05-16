const express = require('express');
const router = express.Router();
const GoalSheet = require('../models/GoalSheet');
const jwt = require('jsonwebtoken');

// Middleware to protect routes
const auth = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Create or update goal sheet (Draft)
router.post('/', auth, async (req, res) => {
    try {
        const { goals, cycle, status } = req.body;
        
        // Fetch user's managerId from User model
        const User = require('../models/User');
        const user = await User.findById(req.user.id);
        const managerId = user.managerId;

        let goalSheet = await GoalSheet.findOne({ employeeId: req.user.id, cycle });

        if (goalSheet) {
            if (goalSheet.isLocked) {
                return res.status(403).json({ message: 'Goal sheet is locked. Contact Admin to unlock.' });
            }
            goalSheet.goals = goals;
            goalSheet.status = status || 'draft';
            goalSheet.managerId = managerId;
            await goalSheet.save();
        } else {
            goalSheet = new GoalSheet({
                employeeId: req.user.id,
                managerId,
                goals,
                cycle,
                status: status || 'draft'
            });
            await goalSheet.save();
        }

        res.json(goalSheet);
    } catch (err) {
        console.error('Error in POST /goals:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get current user's goal sheet
router.get('/me', auth, async (req, res) => {
    try {
        const { cycle } = req.query;
        const goalSheet = await GoalSheet.findOne({ employeeId: req.user.id, cycle })
            .populate('managerId', 'name email');
        
        // Return 200 with null if not found, avoids frontend error logging
        if (!goalSheet) return res.json(null);
        res.json(goalSheet);
    } catch (err) {
        console.error('Error in /goals/me:', err);
        res.status(500).json({ message: err.message });
    }
});

// Submit goal sheet for approval
router.post('/submit', auth, async (req, res) => {
    try {
        const { cycle } = req.body;
        const goalSheet = await GoalSheet.findOne({ employeeId: req.user.id, cycle });

        if (!goalSheet) return res.status(404).json({ message: 'Goal sheet not found' });
        
        // Validation rules
        const totalWeight = goalSheet.goals.reduce((sum, g) => sum + g.weightage, 0);
        if (totalWeight !== 100) {
            return res.status(400).json({ message: 'Total weightage must be 100%' });
        }

        if (goalSheet.goals.length === 0) {
            return res.status(400).json({ message: 'At least one goal is required' });
        }

        goalSheet.status = 'submitted';
        await goalSheet.save();

        res.json(goalSheet);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Calculate progress scores
router.get('/scores/:id', auth, async (req, res) => {
    try {
        const goalSheet = await GoalSheet.findById(req.params.id);
        if (!goalSheet) return res.status(404).json({ message: 'Goal sheet not found' });

        const scores = goalSheet.goals.map(goal => {
            const achievement = goal.achievements?.[req.query.quarter || 'q1']?.actual;
            if (!achievement) return { goalId: goal._id, score: 0 };

            let score = 0;
            switch (goal.uom) {
                case 'numeric':
                case 'percentage':
                    // Assuming "Higher is better" as default for numeric/%
                    score = (parseFloat(achievement) / parseFloat(goal.target)) * 100;
                    break;
                case 'timeline':
                    // Simple boolean for now: if achievement date <= target date, 100%
                    score = new Date(achievement) <= new Date(goal.target) ? 100 : 0;
                    break;
                case 'zero-based':
                    score = parseFloat(achievement) === 0 ? 100 : 0;
                    break;
            }
            return { goalId: goal._id, score: Math.min(score, 100) };
        });

        res.json(scores);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
