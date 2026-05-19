const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/emailSender');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');

// Multer Storage Config
const storage = multer.diskStorage({
    destination: './uploads/profiles/',
    filename: (req, file, cb) => {
        cb(null, `${req.user.id || req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
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
            passwordHash: hashedPassword,
            name,
            role: role ? role.toUpperCase() : 'EMPLOYEE',
            verificationCode,
            verificationCodeExpires: Date.now() + 3600000 // 1 hour
        });

        await user.save();

        // Send Email via Unified Sender (Resend / SMTP)
        sendEmail({
            to: email,
            subject: 'AtomQuest - Verify Your Email',
            text: `Your verification code is: ${verificationCode}`
        }).catch(err => console.error('Email send failed', err));

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

        if (!user || !user.passwordHash) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Removed email verification check to simplify for the hackathon
        // if (!user.isVerified) {
        //     return res.status(401).json({ message: 'Please verify your email first' });
        // }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user._id, role: user.role, name: user.name, email: user.email },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.json({ token, user: { id: user._id, name: user.name, role: user.role, email: user.email }, success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Google Auth - Entry
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google Auth - Callback
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    async (req, res) => {
        const token = jwt.sign({ id: req.user._id, role: req.user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth-success?token=${token}`);
    }
);

// Update Profile
router.patch('/profile', authenticateJWT, async (req, res) => {
    try {
        const { name, designation, department, managerId, role } = req.body;
        const updateData = { name, designation, department };
        
        // Prevent non-admins from changing their role or reporting manager
        if (req.user.role !== 'ADMIN') {
            if (role && role.toUpperCase() !== req.user.role) {
                return res.status(403).json({ message: 'Only Admins can change user roles' });
            }
            const currentUser = await User.findById(req.user._id);
            if (managerId !== undefined && currentUser.managerId && currentUser.managerId.toString() !== managerId) {
                return res.status(403).json({ message: 'Only Admins can change reporting manager lines once assigned' });
            }
        }
        
        if (managerId !== undefined) {
            updateData.managerId = managerId === "" ? null : managerId;
        }
        
        if (role && req.user.role === 'ADMIN') {
            updateData.role = role.toUpperCase();
        }
        
        const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Change Password
router.post('/change-password', authenticateJWT, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        if (!user.passwordHash) return res.status(400).json({ message: 'Google users cannot change password this way' });

        const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect old password' });

        user.passwordHash = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Upload Profile Picture
router.post('/profile-picture', authenticateJWT, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        
        const pictureUrl = `/uploads/profiles/${req.file.filename}`;
        await User.findByIdAndUpdate(req.user._id, { picture: pictureUrl });
        
        res.json({ picture: pictureUrl });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully', success: true });
});

// Get Me
router.get('/me', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-passwordHash');
        // Return both for compatibility
        res.json({ ...user.toObject(), id: user._id, success: true, data: user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all managers
router.get('/managers', authenticateJWT, async (req, res) => {
    try {
        const managers = await User.find({ role: { $in: ['MANAGER', 'ADMIN'] } }).select('name email _id picture');
        res.json(managers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all active users (to select coworkers for kudos/praise)
router.get('/users', authenticateJWT, async (req, res) => {
    try {
        const users = await User.find({ isActive: true }).select('name email designation department picture');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Request manager assignment
router.post('/request-manager', authenticateJWT, async (req, res) => {
    try {
        const employee = await User.findById(req.user.id || req.user._id);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const admins = await User.find({ role: 'ADMIN' }).select('email');
        if (admins.length === 0) {
            return res.status(404).json({ message: 'No administrators found' });
        }

        const adminEmails = admins.map(a => a.email);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: adminEmails,
            subject: `[AtomQuest] Reporting Manager Assignment Request - ${employee.name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background: #ffffff;">
                    <div style="text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 20px;">
                        <h2 style="color: #6366f1; margin: 0; font-size: 24px;">Reporting Manager Assignment Request</h2>
                        <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">AtomQuest Goal Portal</p>
                    </div>
                    
                    <p style="font-size: 16px; color: #374151;">Dear Admin,</p>
                    <p style="font-size: 15px; color: #374151; line-height: 1.6;">
                        An employee has requested to be assigned a reporting manager in the AtomQuest portal.
                    </p>
                    
                    <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #f3f4f6;">
                        <h3 style="margin-top: 0; color: #111827; font-size: 16px;">Employee Details:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 6px 0; font-weight: bold; color: #6b7280; width: 140px;">Name:</td>
                                <td style="padding: 6px 0; color: #111827;">${employee.name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; font-weight: bold; color: #6b7280;">Email:</td>
                                <td style="padding: 6px 0; color: #111827;">${employee.email}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; font-weight: bold; color: #6b7280;">Designation:</td>
                                <td style="padding: 6px 0; color: #111827;">${employee.designation || 'Not Set'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; font-weight: bold; color: #6b7280;">Department:</td>
                                <td style="padding: 6px 0; color: #111827;">${employee.department || 'Not Set'}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <p style="font-size: 15px; color: #374151; line-height: 1.6; margin-bottom: 25px;">
                        Please log in to the Admin Console to assign a reporting manager to this employee:
                    </p>
                    
                    <div style="text-align: center; margin-bottom: 25px;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/admin" 
                           style="background: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.2);">
                           Go to Admin Console →
                        </a>
                    </div>
                    
                    <p style="font-size: 13px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 15px; margin-top: 30px;">
                        This is an automated notification from AtomQuest.
                    </p>
                </div>
            `
        };

        try {
            await sendEmail({
                to: adminEmails,
                subject: `[AtomQuest] Reporting Manager Assignment Request - ${employee.name}`,
                html: mailOptions.html
            });
        } catch (mailErr) {
            console.error('Failed to send manager request email', mailErr);
        }

        res.json({ message: 'Request sent to administrators successfully', adminEmails });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
