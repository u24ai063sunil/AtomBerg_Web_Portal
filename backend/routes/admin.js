const express = require('express');
const router = express.Router();
const User = require('../models/User');
const GoalSheet = require('../models/GoalSheet');
const jwt = require('jsonwebtoken');

// Middleware to protect routes and check admin role
const isAdmin = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Get all users
router.get('/users', isAdmin, async (req, res) => {
    try {
        const users = await User.find().populate('managerId', 'name');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update user role or manager
router.patch('/users/:id', isAdmin, async (req, res) => {
    try {
        const { role, managerId } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, { role, managerId }, { new: true });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get completion stats
router.get('/stats', isAdmin, async (req, res) => {
    try {
        const cycle = req.query.cycle || '2024-25';
        const totalEmployees = await User.countDocuments({ role: 'employee' });
        const submittedCount = await GoalSheet.countDocuments({ cycle, status: 'submitted' });
        const approvedCount = await GoalSheet.countDocuments({ cycle, status: 'approved' });
        
        res.json({
            totalEmployees,
            submittedCount,
            approvedCount,
            pendingCount: totalEmployees - (submittedCount + approvedCount)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
