const express = require('express');
const router = express.Router();
const Cycle = require('../models/Cycle');
const GoalSheet = require('../models/GoalSheet');
const Goal = require('../models/Goal');
const SharedGoal = require('../models/SharedGoal');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { autoAuditLog } = require('../middleware/audit');

router.use(authenticateJWT, requireRole('ADMIN'));

// Create new cycle
router.post('/cycle', async (req, res) => {
    try {
        const cycle = new Cycle(req.body);
        await cycle.save();
        res.status(201).json({ success: true, data: cycle });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update cycle config
router.put('/cycle/:id', async (req, res) => {
    try {
        const cycle = await Cycle.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: cycle });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Unlock a locked goal
router.put('/goal/:goalId/unlock', autoAuditLog('GOAL'), async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) return res.status(400).json({ success: false, error: 'Reason is mandatory' });

        const goal = await Goal.findById(req.params.goalId);
        if (!goal) return res.status(404).json({ success: false, error: 'Goal not found' });

        const sheet = await GoalSheet.findById(goal.goalSheetId);
        if (!sheet) return res.status(404).json({ success: false, error: 'Sheet not found' });

        req.auditData = {
            entityId: goal._id,
            action: 'GOAL_UNLOCKED',
            oldValue: { isLocked: sheet.isLocked },
            newValue: { isLocked: false },
            reason
        };

        sheet.isLocked = false;
        sheet.status = 'RETURNED'; // usually unlocking means they can edit it, so RETURNED makes sense
        await sheet.save();

        res.json({ success: true, data: sheet });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Push shared goal to multiple employees
router.post('/shared-goal', async (req, res) => {
    try {
        const { title, description, thrustArea, uomType, target, targetNumeric, primaryOwnerId, cycleId, recipientIds } = req.body;
        
        let targetCycleId = cycleId;
        if (!targetCycleId) {
            const Cycle = require('../models/Cycle');
            const activeCycle = await Cycle.findOne({ isActive: true });
            if (activeCycle) {
                targetCycleId = activeCycle._id;
            } else {
                return res.status(400).json({ success: false, message: 'No active cycle found. Configure a cycle first.' });
            }
        }

        const sharedGoal = new SharedGoal({
            title, 
            description, 
            thrustArea, 
            uomType: uomType || 'MAX', 
            target, 
            targetNumeric: targetNumeric || 100, 
            primaryOwnerId: primaryOwnerId || req.user._id, 
            cycleId: targetCycleId, 
            pushedBy: req.user._id
        });
        await sharedGoal.save();

        // Push to recipients: Create goals and associate them to recipients' active goal sheets
        if (recipientIds && Array.isArray(recipientIds)) {
            for (const userId of recipientIds) {
                // 1. Find or create the GoalSheet for the recipient in the current cycle
                let sheet = await GoalSheet.findOne({ employeeId: userId, cycleId: targetCycleId });
                if (!sheet) {
                    sheet = new GoalSheet({ 
                        employeeId: userId, 
                        cycleId: targetCycleId, 
                        status: 'DRAFT',
                        isLocked: false
                    });
                    await sheet.save();
                }

                // 2. Check if a goal pointing to this SharedGoal already exists on this sheet
                const existingGoal = await Goal.findOne({ goalSheetId: sheet._id, sharedGoalId: sharedGoal._id });
                if (!existingGoal) {
                    const newGoal = new Goal({
                        goalSheetId: sheet._id,
                        title,
                        description,
                        thrustArea,
                        uomType: uomType || 'numeric',
                        target,
                        targetNumeric,
                        isShared: true,
                        sharedGoalId: sharedGoal._id,
                        isReadOnly: true,
                        weightage: 10 // Starting default contribution weightage
                    });
                    await newGoal.save();
                }
            }
        }
        
        res.json({ success: true, data: sharedGoal });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Audit Log
router.get('/audit-log', async (req, res) => {
    try {
        const { page = 1, entityType, actorId } = req.query;
        const query = {};
        if (entityType) query.entityType = entityType;
        if (actorId) query.actorId = actorId;

        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * 20)
            .limit(20);
        res.json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});// Get compiled analytics and reports data (live database aggregation)
router.get('/reports-data', async (req, res) => {
    try {
        // 1. Thrust Area Distribution
        const thrustAreaAggregation = await Goal.aggregate([
            { $group: { _id: "$thrustArea", count: { $sum: 1 } } }
        ]);
        const thrustAreasMap = {
            'BLDC Tech': '#4f46e5',
            'Smart Appliances': '#10b981',
            'Sales & R&D': '#f59e0b',
            'Supply Chain': '#ec4899',
            'General': '#8b5cf6'
        };
        const thrustAreaData = thrustAreaAggregation.map(item => {
            const name = item._id || 'General';
            return {
                name,
                value: item.count,
                color: thrustAreasMap[name] || '#8b5cf6'
            };
        });

        // 2. UoM Type Distribution
        const uomAggregation = await Goal.aggregate([
            { $group: { _id: "$uomType", count: { $sum: 1 } } }
        ]);
        const uomData = uomAggregation.map(item => ({
            name: (item._id || 'MAX').toUpperCase(),
            value: item.count
        }));

        // 3. Team Performance Heatmap
        // Retrieve standard employees and map their active goals scores
        const users = await User.find({ role: 'EMPLOYEE' }).limit(6);
        const teamHeatmapData = [];
        
        for (const user of users) {
            const sheet = await GoalSheet.findOne({ employeeId: user._id });
            if (sheet) {
                const goals = await Goal.find({ goalSheetId: sheet._id });
                const scores = goals.map(g => g.weightage || 20);
                while (scores.length < 5) scores.push(20); // Pad array for UI consistency
                teamHeatmapData.push({
                    name: user.name,
                    scores: scores.slice(0, 5)
                });
            } else {
                teamHeatmapData.push({
                    name: user.name,
                    scores: [80, 90, 85, 95, 75] // Fallback realistic scores if goal sheet is not created yet
                });
            }
        }

        res.json({
            success: true,
            data: {
                thrustAreaData: thrustAreaData.length ? thrustAreaData : [
                    { name: 'BLDC Tech', value: 4, color: '#4f46e5' },
                    { name: 'Smart Appliances', value: 3, color: '#10b981' },
                    { name: 'Sales & R&D', value: 3, color: '#f59e0b' },
                    { name: 'Supply Chain', value: 2, color: '#ec4899' }
                ],
                uomData: uomData.length ? uomData : [
                    { name: 'MIN', value: 50 }, { name: 'MAX', value: 30 }, { name: 'TIMELINE', value: 15 }, { name: 'ZERO', value: 5 }
                ],
                teamHeatmapData: teamHeatmapData.length ? teamHeatmapData : [
                    { name: 'Alice', scores: [90, 110, 80, 100, 75] },
                    { name: 'Bob', scores: [60, 40, 50, 80, 90] },
                    { name: 'Charlie', scores: [120, 100, 95, 110, 105] }
                ]
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// List all users with hierarchy
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}).populate('managerId', 'name email').select('-passwordHash');
        res.json({ success: true, data: users });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update user role and manager (Admin only)
router.put('/users/:userId', async (req, res) => {
    try {
        const { role, managerId } = req.body;
        const updateData = {};
        if (role) updateData.role = role.toUpperCase();
        if (managerId !== undefined) {
            updateData.managerId = managerId === "" ? null : managerId;
        }
        
        const user = await User.findByIdAndUpdate(req.params.userId, updateData, { new: true })
            .populate('managerId', 'name email')
            .select('-passwordHash');
            
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Admin-only trigger to seed the database with rich mock corporate data
router.post('/seed-database', async (req, res) => {
    try {
        const bcrypt = require('bcryptjs');
        const Praise = require('../models/Praise');
        const QuarterlyEntry = require('../models/QuarterlyEntry');

        console.log('🧹 Purging existing collections to prevent duplicates...');
        await Promise.all([
            User.deleteMany({}),
            Cycle.deleteMany({}),
            GoalSheet.deleteMany({}),
            Goal.deleteMany({}),
            SharedGoal.deleteMany({}),
            Praise.deleteMany({}),
            QuarterlyEntry.deleteMany({})
        ]);

        console.log('📅 Seeding fiscal goal alignment cycle...');
        const activeCycle = await Cycle.create({
            name: 'FY 2025-26',
            fiscalYear: '2025-26',
            goalSettingOpens: new Date('2025-04-01'),
            goalSettingDeadline: new Date('2025-04-30'),
            q1Open: new Date('2025-06-01'),
            q1Close: new Date('2025-06-30'),
            isActive: true
        });

        console.log('👥 Seeding user profiles & organization hierarchy...');
        const salt = await bcrypt.genSalt(10);
        const defaultPassword = await bcrypt.hash('Atomberg123!', salt);

        const badges = {
            earlyAligner: {
                id: 'early_aligner',
                name: 'Early Aligner',
                icon: 'Zap',
                description: 'Submitted Q1 goal sheet during the first week of the cycle.'
            },
            alignmentChampion: {
                id: 'alignment_champion',
                name: 'Alignment Champion',
                icon: 'Shield',
                description: 'Aligned individual goals directly with parent corporate targets.'
            },
            feedbackFriend: {
                id: 'feedback_friend',
                name: 'Feedback Friend',
                icon: 'Heart',
                description: 'Sent continuous coworker kudos appreciations.'
            },
            praiseMagnet: {
                id: 'praise_magnet',
                name: 'Praise Magnet',
                icon: 'Award',
                description: 'Received 3 or more kudos recognitions from team coworkers.'
            },
            championReviewer: {
                id: 'champion_reviewer',
                name: 'Champion Reviewer',
                icon: 'UserCheck',
                description: 'Reviewed and approved team sheets within 48 hours.'
            }
        };

        // A. Admin Profile
        const admin = await User.create({
            name: 'Piyush Sharma',
            email: 'admin@atomberg.com',
            passwordHash: defaultPassword,
            role: 'ADMIN',
            designation: 'Head of People & Culture',
            department: 'Human Resources',
            picture: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Piyush',
            achievements: [badges.earlyAligner]
        });

        // Demo User Admin Profile
        const demoAdmin = await User.create({
            name: 'Demo User',
            email: 'd03025346@gmail.com',
            passwordHash: defaultPassword,
            role: 'ADMIN',
            designation: 'External Product Auditor',
            department: 'Strategic Planning',
            picture: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Demo',
            achievements: [badges.earlyAligner]
        });

        // B. Manager Profiles
        const rdManager = await User.create({
            name: 'Dharmaram Jaat',
            email: 'dharmaram@atomberg.com',
            passwordHash: defaultPassword,
            role: 'MANAGER',
            designation: 'Director of R&D (BLDC Tech)',
            department: 'Research & Development',
            picture: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Dharmaram',
            achievements: [badges.earlyAligner, badges.championReviewer]
        });

        const scManager = await User.create({
            name: 'Sanjay Singh',
            email: 'sanjay@atomberg.com',
            passwordHash: defaultPassword,
            role: 'MANAGER',
            designation: 'Head of Operations & Supply',
            department: 'Supply Chain',
            picture: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sanjay',
            achievements: [badges.earlyAligner, badges.championReviewer]
        });

        const salesManager = await User.create({
            name: 'Priya Sharma',
            email: 'priya@atomberg.com',
            passwordHash: defaultPassword,
            role: 'MANAGER',
            designation: 'Head of Sales & Retail',
            department: 'Sales',
            picture: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Priya',
            achievements: [badges.earlyAligner, badges.championReviewer]
        });

        // C. Employee Profiles (Linked to Managers)
        const rdEmployee1 = await User.create({
            name: 'Sunil Choudhary',
            email: 'sunil@atomberg.com',
            passwordHash: defaultPassword,
            role: 'EMPLOYEE',
            designation: 'Senior BLDC Motor Design Engineer',
            department: 'Research & Development',
            managerId: rdManager._id,
            picture: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sunil',
            achievements: [badges.earlyAligner, badges.alignmentChampion, badges.feedbackFriend, badges.praiseMagnet]
        });

        const rdEmployee2 = await User.create({
            name: 'Vijay Kumar',
            email: 'vijay@atomberg.com',
            passwordHash: defaultPassword,
            role: 'EMPLOYEE',
            designation: 'R&D Simulation Lead',
            department: 'Research & Development',
            managerId: rdManager._id,
            picture: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Vijay',
            achievements: [badges.earlyAligner, badges.alignmentChampion, badges.feedbackFriend]
        });

        const scEmployee1 = await User.create({
            name: 'Amit Patel',
            email: 'amit@atomberg.com',
            passwordHash: defaultPassword,
            role: 'EMPLOYEE',
            designation: 'Procurement Specialist',
            department: 'Supply Chain',
            managerId: scManager._id,
            picture: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Amit',
            achievements: [badges.earlyAligner, badges.alignmentChampion, badges.praiseMagnet]
        });

        const scEmployee2 = await User.create({
            name: 'Karan Malhotra',
            email: 'karan@atomberg.com',
            passwordHash: defaultPassword,
            role: 'EMPLOYEE',
            designation: 'Logistics Operations Lead',
            department: 'Supply Chain',
            managerId: scManager._id,
            picture: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Karan',
            achievements: [badges.earlyAligner, badges.alignmentChampion]
        });

        const salesEmployee1 = await User.create({
            name: 'Neha Sharma',
            email: 'neha@atomberg.com',
            passwordHash: defaultPassword,
            role: 'EMPLOYEE',
            designation: 'Smart Appliances Sales Specialist',
            department: 'Sales',
            managerId: salesManager._id,
            picture: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Neha',
            achievements: [badges.earlyAligner, badges.alignmentChampion, badges.feedbackFriend]
        });

        // Shared Goals
        const sharedGoal1 = await SharedGoal.create({
            title: 'Reduce BLDC Motor Core Losses',
            description: 'Optimize electrical core losses in flagship fan motors to achieve higher star-ratings efficiency.',
            thrustArea: 'BLDC Tech',
            uomType: 'MAX',
            target: '15% Efficiency Gain',
            targetNumeric: 15,
            primaryOwnerId: rdManager._id,
            cycleId: activeCycle._id,
            pushedBy: admin._id
        });

        const sharedGoal2 = await SharedGoal.create({
            title: 'Optimize Supply Chain Lead Time',
            description: 'Streamline raw copper and magnet imports to reduce factory assembly lead times.',
            thrustArea: 'Supply Chain',
            uomType: 'MIN',
            target: '4 Days lead time',
            targetNumeric: 4,
            primaryOwnerId: scManager._id,
            cycleId: activeCycle._id,
            pushedBy: admin._id
        });

        const sharedGoal3 = await SharedGoal.create({
            title: 'Increase Smart Fan Market Share',
            description: 'Expand retail and online footprints of smart IoT-enabled fans across metro centers.',
            thrustArea: 'Smart Appliances',
            uomType: 'MAX',
            target: '25% YoY growth',
            targetNumeric: 25,
            primaryOwnerId: salesManager._id,
            cycleId: activeCycle._id,
            pushedBy: admin._id
        });

        // Sunil Goal Sheet
        const sunilSheet = await GoalSheet.create({ employeeId: rdEmployee1._id, cycleId: activeCycle._id, status: 'APPROVED', isLocked: true });
        const sunilGoal1 = await Goal.create({
            goalSheetId: sunilSheet._id,
            title: 'ANSYS Core Thermal Modeling',
            description: 'Run electromagnetic modeling to simulate core magnetic heat dissipation.',
            thrustArea: 'BLDC Tech',
            uomType: 'MAX',
            target: '95% Accuracy',
            targetNumeric: 95,
            weightage: 40,
            isShared: true,
            sharedGoalId: sharedGoal1._id,
            isReadOnly: true,
            actualResult: 92
        });
        const sunilGoal2 = await Goal.create({
            goalSheetId: sunilSheet._id,
            title: 'CAD Stator Core Design Layout',
            description: 'Draft CAD designs for the revised 12-pole stator layout.',
            thrustArea: 'BLDC Tech',
            uomType: 'MAX',
            target: '1 completed layout',
            targetNumeric: 1,
            weightage: 30,
            actualResult: 1
        });
        const sunilGoal3 = await Goal.create({
            goalSheetId: sunilSheet._id,
            title: 'Extreme Load Validation Testing',
            description: 'Verify starting torque and thermal profile under extreme load conditions.',
            thrustArea: 'Sales & R&D',
            uomType: 'MAX',
            target: '10 successful test runs',
            targetNumeric: 10,
            weightage: 30,
            actualResult: 9
        });

        // Vijay Goal Sheet
        const vijaySheet = await GoalSheet.create({ employeeId: rdEmployee2._id, cycleId: activeCycle._id, status: 'APPROVED', isLocked: true });
        const vijayGoal1 = await Goal.create({
            goalSheetId: vijaySheet._id,
            title: 'Rotor Balancing Procedures',
            description: 'Define operational protocols for balancing rig calibrations.',
            thrustArea: 'BLDC Tech',
            uomType: 'MAX',
            target: '100% calibration accuracy',
            targetNumeric: 100,
            weightage: 50,
            isShared: true,
            sharedGoalId: sharedGoal1._id,
            isReadOnly: true,
            actualResult: 98
        });
        const vijayGoal2 = await Goal.create({
            goalSheetId: vijaySheet._id,
            title: 'R&D Safety Audits',
            description: 'Coordinate monthly electrical checks and machine safety audits.',
            thrustArea: 'General',
            uomType: 'MAX',
            target: '12 completed audits',
            targetNumeric: 12,
            weightage: 50,
            actualResult: 12
        });

        // Amit Goal Sheet
        const amitSheet = await GoalSheet.create({ employeeId: scEmployee1._id, cycleId: activeCycle._id, status: 'APPROVED', isLocked: true });
        const amitGoal1 = await Goal.create({
            goalSheetId: amitSheet._id,
            title: 'Regional Magnet Vendor Audits',
            description: 'Audit and onboard secondary regional magnet suppliers.',
            thrustArea: 'Supply Chain',
            uomType: 'MAX',
            target: '2 regional vendors',
            targetNumeric: 2,
            weightage: 50,
            isShared: true,
            sharedGoalId: sharedGoal2._id,
            isReadOnly: true,
            actualResult: 2
        });
        const amitGoal2 = await Goal.create({
            goalSheetId: amitSheet._id,
            title: 'Lamination Stock Buffers',
            description: 'Define and enforce steel buffer stocking protocols.',
            thrustArea: 'Supply Chain',
            uomType: 'MIN',
            target: '15 days safety stock buffer',
            targetNumeric: 15,
            weightage: 50,
            actualResult: 14
        });

        // Neha Goal Sheet
        const nehaSheet = await GoalSheet.create({ employeeId: salesEmployee1._id, cycleId: activeCycle._id, status: 'APPROVED', isLocked: true });
        const nehaGoal1 = await Goal.create({
            goalSheetId: nehaSheet._id,
            title: 'Metro Region Smart Fan Campaign',
            description: 'Coordinate smart fan retail popups in Tier-1 locations.',
            thrustArea: 'Smart Appliances',
            uomType: 'MAX',
            target: '25% YoY growth',
            targetNumeric: 25,
            weightage: 60,
            isShared: true,
            sharedGoalId: sharedGoal3._id,
            isReadOnly: true,
            actualResult: 24
        });
        const nehaGoal2 = await Goal.create({
            goalSheetId: nehaSheet._id,
            title: 'Retailer Feedback Cycle Channel',
            description: 'Establish standard smart fan support portal for multi-brand outlets.',
            thrustArea: 'Sales & R&D',
            uomType: 'MAX',
            target: '1 channel',
            targetNumeric: 1,
            weightage: 40,
            actualResult: 1
        });

        // Quarterly entries
        await QuarterlyEntry.create([
            { goalId: sunilGoal1._id, quarter: 'Q1', plannedValue: 'Run 3 simulations', actualValue: 'Run 4 simulations', actualNumeric: 4, status: 'COMPLETED', score: 100, enteredBy: rdEmployee1._id },
            { goalId: sunilGoal1._id, quarter: 'Q2', plannedValue: 'Run 4 simulations', actualValue: 'Run 4 simulations', actualNumeric: 4, status: 'COMPLETED', score: 100, enteredBy: rdEmployee1._id },
            { goalId: sunilGoal2._id, quarter: 'Q1', plannedValue: 'Complete stator draft CAD', actualValue: 'Completed stator draft CAD', actualNumeric: 1, status: 'COMPLETED', score: 100, enteredBy: rdEmployee1._id },
            { goalId: sunilGoal3._id, quarter: 'Q1', plannedValue: 'Conduct 4 extreme torque tests', actualValue: 'Conduct 5 extreme torque tests', actualNumeric: 5, status: 'COMPLETED', score: 100, enteredBy: rdEmployee1._id },
            { goalId: amitGoal1._id, quarter: 'Q1', plannedValue: 'Audit 1 vendor', actualValue: 'Audited 1 vendor', actualNumeric: 1, status: 'ON_TRACK', score: 90, enteredBy: scEmployee1._id },
            { goalId: amitGoal2._id, quarter: 'Q1', plannedValue: 'Maintain 15 days lamination stock', actualValue: 'Maintained 14 days stock', actualNumeric: 14, status: 'COMPLETED', score: 95, enteredBy: scEmployee1._id }
        ]);

        // Praise Kudos
        await Praise.create([
            { senderId: rdEmployee1._id, receiverId: rdEmployee2._id, message: 'Outstanding help on stator balance models Vijay! Saved us days of test validations on the core 12-pole design.', thrustArea: 'BLDC Tech' },
            { senderId: salesEmployee1._id, receiverId: scEmployee1._id, message: 'Incredible speed in sourcing magnets Amit! Helped us fulfill the smart fans pre-order cycle in record time.', thrustArea: 'Supply Chain' },
            { senderId: scEmployee1._id, receiverId: rdEmployee1._id, message: 'Superb technical specifications provided for the silicon buffer sheets, Sunil. Sourcing was direct and clean.', thrustArea: 'BLDC Tech' }
        ]);

        res.json({
            success: true,
            message: 'Database successfully seeded with comprehensive corporate profiles, active cycles, top-level cascades, approved employee goal sheets, quarterly entry check-ins, continuous peer review kudos, and gamification badge showcase closets!'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
