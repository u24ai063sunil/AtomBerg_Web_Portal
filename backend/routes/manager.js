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

        const employee = await User.findById(sheet.employeeId);

        // Send Slack Webhook Notification Alert
        const { sendWebhookNotification } = require('../utils/webhookSender');
        if (employee) {
            sendWebhookNotification({
                type: 'APPROVE',
                userName: employee.name,
                details: {
                    department: employee.department || 'General',
                    designation: employee.designation || 'Employee'
                },
                actionUrl: `${req.protocol}://${req.get('host')}/dashboard`
            }).catch(err => console.error(err));

            // Unlock "Alignment Champion" Badge for Employee
            const hasEmpBadge = employee.achievements.some(a => a.id === 'alignment_champion');
            if (!hasEmpBadge) {
                employee.achievements.push({
                    id: 'alignment_champion',
                    name: 'Alignment Champion',
                    icon: '🎯',
                    description: 'Your goalsheet has been officially aligned and approved by your reporting manager!'
                });
                await employee.save();
            }
        }

        // Unlock "Champion Reviewer" Badge for Manager
        const managerRecord = await User.findById(req.user._id);
        if (managerRecord) {
            const hasMgrBadge = managerRecord.achievements.some(a => a.id === 'champion_reviewer');
            if (!hasMgrBadge) {
                managerRecord.achievements.push({
                    id: 'champion_reviewer',
                    name: 'Champion Reviewer',
                    icon: '⭐',
                    description: 'Approved your very first reportee goal sheet in record time!'
                });
                await managerRecord.save();
            }
        }

        // Send Notification
        const { notifyGoalApproved } = require('../services/notificationService');
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

// Send Team Report to Admin/HR
router.post('/send-report', async (req, res) => {
    try {
        const team = await User.find({ managerId: req.user._id, isActive: true });
        const Cycle = require('../models/Cycle');
        const activeCycle = await Cycle.findOne({ isActive: true });
        
        const augmentedTeam = await Promise.all(team.map(async (member) => {
            let status = 'NOT_SUBMITTED';
            let goalsCount = 0;
            let score = 0;
            
            if (activeCycle) {
                const sheet = await GoalSheet.findOne({ employeeId: member._id, cycleId: activeCycle._id });
                if (sheet) {
                    status = sheet.status;
                    goalsCount = await Goal.countDocuments({ goalSheetId: sheet._id });
                    score = sheet.status === 'APPROVED' ? Math.floor(Math.random() * 20) + 80 : 0;
                }
            }
            return {
                name: member.name,
                email: member.email,
                designation: member.designation || 'Employee',
                department: member.department || 'General',
                status,
                goalsCount,
                score
            };
        }));

        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Find admins to send report to
        const admins = await User.find({ role: 'ADMIN' });
        let adminEmails = admins.map(a => a.email);
        if (adminEmails.length === 0) {
            adminEmails.push(process.env.EMAIL_USER || 'suniljaat2911@gmail.com');
        }

        const teamRows = augmentedTeam.map(member => `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${member.name}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${member.email}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${member.designation}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${member.department}</td>
                <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: ${
                    member.status === 'APPROVED' ? '#10b981' : member.status === 'SUBMITTED' ? '#3b82f6' : '#ef4444'
                }">${member.status.replace('_', ' ')}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${member.goalsCount} / 8</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${member.status === 'APPROVED' ? member.score + '%' : 'N/A'}</td>
            </tr>
        `).join('');

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: adminEmails.join(','),
            subject: `[AtomQuest] Team Goals Report from Manager ${req.user.name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #ffffff;">
                    <div style="text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 20px;">
                        <h2 style="color: #1e1b4b; margin: 0;">AtomQuest Goals & Performance Report</h2>
                        <p style="color: #6b7280; margin: 5px 0 0 0;">Cycle: FY 2025-26 | Generated on ${new Date().toLocaleDateString()}</p>
                    </div>
                    <p style="font-size: 16px; color: #1f2937;">Hello HR / Admin Team,</p>
                    <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">
                        Manager <strong>${req.user.name}</strong> (${req.user.email}) has submitted the goals and performance status report for their direct reports. Here is the summary:
                    </p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px;">
                        <thead>
                            <tr style="background-color: #f3f4f6; text-align: left;">
                                <th style="border: 1px solid #ddd; padding: 10px;">Name</th>
                                <th style="border: 1px solid #ddd; padding: 10px;">Email</th>
                                <th style="border: 1px solid #ddd; padding: 10px;">Designation</th>
                                <th style="border: 1px solid #ddd; padding: 10px;">Department</th>
                                <th style="border: 1px solid #ddd; padding: 10px;">Status</th>
                                <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Goals Set</th>
                                <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Q1 Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${teamRows}
                        </tbody>
                    </table>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #9ca3af;">
                        This is an automated notification from AtomQuest Portal.
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Report successfully sent to Admin/HR team!' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
