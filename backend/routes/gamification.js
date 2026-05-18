const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const Praise = require('../models/Praise');
const User = require('../models/User');

// 1. Submit Peer Praise (Continuous Peer Feedback)
router.post('/praise', authenticateJWT, async (req, res) => {
    try {
        const { receiverId, message, thrustArea } = req.body;
        if (!receiverId || !message || !thrustArea) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const senderId = req.user._id;
        
        // Prevent self praise
        if (senderId.toString() === receiverId.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot praise yourself.' });
        }

        const newPraise = new Praise({
            senderId,
            receiverId,
            message,
            thrustArea
        });

        await newPraise.save();

        // Unlock 'Feedback Friend' achievement for sender if it is their first praise!
        const existingPraiseCount = await Praise.countDocuments({ senderId });
        if (existingPraiseCount === 1) {
            const user = await User.findById(senderId);
            const hasBadge = user.achievements.some(a => a.id === 'feedback_friend');
            if (!hasBadge) {
                user.achievements.push({
                    id: 'feedback_friend',
                    name: 'Feedback Friend',
                    icon: '🤝',
                    description: 'Sent your very first peer appreciation kudos!'
                });
                await user.save();
            }
        }

        // Unlock 'Praise Magnet' achievement for receiver if they got their first praise!
        const receiver = await User.findById(receiverId);
        const hasReceiverBadge = receiver.achievements.some(a => a.id === 'praise_magnet');
        if (!hasReceiverBadge) {
            receiver.achievements.push({
                id: 'praise_magnet',
                name: 'Praise Magnet',
                icon: '🧲',
                description: 'Received public recognition from a coworker for alignment!'
            });
            await receiver.save();
        }

        res.status(201).json({ success: true, praise: newPraise });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 2. Get All Kudos / Praises
router.get('/praise', authenticateJWT, async (req, res) => {
    try {
        const praises = await Praise.find()
            .populate('senderId', 'name designation department picture')
            .populate('receiverId', 'name designation department picture')
            .sort({ createdAt: -1 });
        res.json({ success: true, praises });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 3. Get Praises Received by Specific User (Appraisal Compilation Helper)
router.get('/praise/user/:userId', authenticateJWT, async (req, res) => {
    try {
        const { userId } = req.params;
        const praises = await Praise.find({ receiverId: userId })
            .populate('senderId', 'name designation department')
            .sort({ createdAt: -1 });
        res.json({ success: true, praises });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 4. Get Current Achievements
router.get('/achievements', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({ success: true, achievements: user.achievements || [] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 5. Unlock Achievement Manually / Trigger (e.g. for Early Aligner)
router.post('/achievements/unlock', authenticateJWT, async (req, res) => {
    try {
        const { id, name, icon, description } = req.body;
        if (!id || !name) {
            return res.status(400).json({ success: false, message: 'id and name are required.' });
        }

        const user = await User.findById(req.user._id);
        const alreadyHas = user.achievements.some(a => a.id === id);
        
        if (alreadyHas) {
            return res.json({ success: true, message: 'Achievement already unlocked', achievements: user.achievements });
        }

        user.achievements.push({ id, name, icon: icon || '🏆', description: description || 'Awarded for portal milestones.' });
        await user.save();

        res.json({ success: true, message: 'Achievement unlocked successfully!', achievements: user.achievements });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
