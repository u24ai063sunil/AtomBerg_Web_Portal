const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const router = express.Router();

// Nodemailer Config
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Multer Storage Config
const storage = multer.diskStorage({
    destination: './uploads/profiles/',
    filename: (req, file, cb) => {
        cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

// Helper to generate verification code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// --- Auth Routes ---

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;
        
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = generateCode();

        user = new User({
            email,
            password: hashedPassword,
            name,
            role: role || 'employee',
            verificationCode,
            verificationCodeExpires: Date.now() + 3600000 // 1 hour
        });

        await user.save();

        // Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'AtomQuest - Verify Your Email',
            text: `Your verification code is: ${verificationCode}`
        };
        
        // Non-blocking email send
        transporter.sendMail(mailOptions).catch(err => console.error('Email send failed', err));

        res.status(201).json({ message: 'Signup successful. Please check your email for verification code.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await User.findOne({ email, verificationCode: code });

        if (!user || user.verificationCodeExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired code' });
        }

        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login (Normal)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !user.password) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(401).json({ message: 'Please verify your email first' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Google Auth - Callback (Keep existing logic)
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    async (req, res) => {
        const token = jwt.sign({ id: req.user._id, role: req.user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${token}`);
    }
);

// --- Profile Routes ---

const auth = (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) { res.status(401).json({ message: 'Invalid token' }); }
};

// Update Profile
router.patch('/profile', auth, async (req, res) => {
    try {
        const { name, designation, department } = req.body;
        const user = await User.findByIdAndUpdate(req.user.id, { name, designation, department }, { new: true });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Change Password
router.post('/change-password', auth, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user.password) return res.status(400).json({ message: 'Google users cannot change password this way' });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect old password' });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Upload Profile Picture
router.post('/profile-picture', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        
        const pictureUrl = `/uploads/profiles/${req.file.filename}`;
        await User.findByIdAndUpdate(req.user.id, { picture: pictureUrl });
        
        res.json({ picture: pictureUrl });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

// Get Me
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all managers
router.get('/managers', auth, async (req, res) => {
    try {
        const managers = await User.find({ role: 'manager' }).select('name email _id picture');
        res.json(managers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
