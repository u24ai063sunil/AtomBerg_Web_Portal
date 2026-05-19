const cron = require('node-cron');
const mongoose = require('mongoose');
const Cycle = require('../models/Cycle');
const User = require('../models/User');
const GoalSheet = require('../models/GoalSheet');
const EscalationRule = require('../models/EscalationRule');
const EscalationLog = require('../models/EscalationLog');
const { sendEmail: unifiedSendEmail } = require('../utils/emailSender');

const sendEmail = async (to, subject, text) => {
    try {
        console.log(`[ESCALATION] Sending email to ${to}: ${subject}`);
        await unifiedSendEmail({ to, subject, text });
    } catch (err) {
        console.error('Email error:', err.message);
    }
};

const checkEscalations = async () => {
    console.log('[CRON] Starting daily escalation check at 8:00 AM...');
    try {
        const activeCycle = await Cycle.findOne({ isActive: true });
        if (!activeCycle) return console.log('[CRON] No active cycle found.');

        const rules = await EscalationRule.find({ cycleId: activeCycle._id, isActive: true });
        if (!rules.length) return console.log('[CRON] No active rules found.');

        const today = new Date();
        const users = await User.find({ isActive: true });
        const sheets = await GoalSheet.find({ cycleId: activeCycle._id });

        for (const rule of rules) {
            const thresholdMs = rule.daysThreshold * 24 * 60 * 60 * 1000;
            
            if (rule.triggerEvent === 'NO_SUBMISSION') {
                const deadlineMs = new Date(activeCycle.goalSettingOpens).getTime() + thresholdMs;
                if (today.getTime() > deadlineMs) {
                    for (const user of users) {
                        const hasSheet = sheets.find(s => s.employeeId.toString() === user._id.toString() && s.status !== 'DRAFT');
                        if (!hasSheet) {
                            // Check if already logged to avoid spam
                            const exists = await EscalationLog.findOne({ ruleId: rule._id, userId: user._id });
                            if (!exists) {
                                await EscalationLog.create({
                                    ruleId: rule._id, userId: user._id,
                                    message: `Overdue goal submission by ${rule.daysThreshold} days.`
                                });
                                
                                const emails = [user.email];
                                if (rule.notifyManager && user.managerId) {
                                    const mgr = await User.findById(user.managerId);
                                    if (mgr) emails.push(mgr.email);
                                }
                                if (rule.notifySkipLevel) emails.push('hr-admin@atomberg.com'); // mock HR email

                                await sendEmail(emails.join(','), 
                                    `Action Required: Goal Setting — ${activeCycle.name}`, 
                                    `You are overdue for goal submission by ${rule.daysThreshold} days. Please visit the portal to complete your goal sheet.`
                                );
                            }
                        }
                    }
                }
            }

            if (rule.triggerEvent === 'NO_APPROVAL') {
                for (const sheet of sheets) {
                    if (sheet.status === 'SUBMITTED') {
                        const submitDate = new Date(sheet.submittedAt || sheet.createdAt).getTime();
                        if (today.getTime() > submitDate + thresholdMs) {
                            const emp = await User.findById(sheet.employeeId);
                            const mgr = emp ? await User.findById(emp.managerId) : null;
                            if (mgr) {
                                const exists = await EscalationLog.findOne({ ruleId: rule._id, userId: mgr._id });
                                if (!exists) {
                                    await EscalationLog.create({
                                        ruleId: rule._id, userId: mgr._id,
                                        message: `Overdue goal approval for ${emp.name} by ${rule.daysThreshold} days.`
                                    });
                                    
                                    const emails = [mgr.email];
                                    if (rule.notifySkipLevel && mgr.managerId) {
                                        const skipLevel = await User.findById(mgr.managerId);
                                        if (skipLevel) emails.push(skipLevel.email);
                                    }
                                    
                                    await sendEmail(emails.join(','), 
                                        `Action Required: Goal Approval — ${activeCycle.name}`, 
                                        `You are overdue to approve goals for ${emp.name} by ${rule.daysThreshold} days. Please review them immediately.`
                                    );
                                }
                            }
                        }
                    }
                }
            }
        }
        console.log('[CRON] Escalation check completed successfully.');
    } catch (err) {
        console.error('[CRON] Error in escalation job:', err);
    }
};

const startCron = () => {
    // Run at 8:00 AM every day
    cron.schedule('0 8 * * *', checkEscalations, {
        timezone: "Asia/Kolkata"
    });
    console.log('[CRON] Escalation engine initialized.');
};

module.exports = { startCron, checkEscalations };
