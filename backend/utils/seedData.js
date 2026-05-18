const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Cycle = require('../models/Cycle');
const GoalSheet = require('../models/GoalSheet');
const Goal = require('../models/Goal');
const SharedGoal = require('../models/SharedGoal');
const Praise = require('../models/Praise');
const QuarterlyEntry = require('../models/QuarterlyEntry');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/atomquest';

async function seedDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected successfully!');

        // --- 0. PURGE EXISTING DATA FOR FRESH SEEDING ---
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
        console.log('✨ Database cleared successfully!');

        // --- 1. SEED CYCLES ---
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
        console.log(`🚀 Created Cycle: ${activeCycle.name}`);

        // --- 2. SEED USERS & REPORTING HIERARCHY ---
        console.log('👥 Seeding user profiles & organization hierarchy...');
        const salt = await bcrypt.genSalt(10);
        const defaultPassword = await bcrypt.hash('Atomberg123!', salt);

        // Standard Achievement Badge Definitions
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
        console.log(`👑 Admin created: ${admin.name}, Demo Admin: ${demoAdmin.name}`);

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
        console.log('👨‍💼 Managers created successfully!');

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
        console.log('👨‍💻 Employees created and assigned to reporting managers!');

        // --- 3. SEED SHARED CORPORATE TARGETS (Cascade Roots) ---
        console.log('🎯 Seeding corporate OKR shared targets...');
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
        console.log('🎯 Corporate Shared Goals created successfully!');

        // --- 4. SEED GOAL SHEETS & INDIVIDUAL GOALS ---
        console.log('📝 Initializing Goal Sheets & aligned goals...');

        // Sunil Choudhary Goal Sheet
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

        // Vijay Kumar Goal Sheet
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

        // Amit Patel Goal Sheet
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

        // Neha Sharma Goal Sheet
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
        console.log('📝 Aligned goals linked to employee sheets successfully!');

        // --- 5. SEED QUARTERLY CHECK-IN ENTRIES ---
        console.log('📈 Seeding quarterly planned vs actual check-in entries...');
        await QuarterlyEntry.create([
            // Sunil's check-ins
            { goalId: sunilGoal1._id, quarter: 'Q1', plannedValue: 'Run 3 simulations', actualValue: 'Run 4 simulations', actualNumeric: 4, status: 'COMPLETED', score: 100, enteredBy: rdEmployee1._id },
            { goalId: sunilGoal1._id, quarter: 'Q2', plannedValue: 'Run 4 simulations', actualValue: 'Run 4 simulations', actualNumeric: 4, status: 'COMPLETED', score: 100, enteredBy: rdEmployee1._id },
            { goalId: sunilGoal2._id, quarter: 'Q1', plannedValue: 'Complete stator draft CAD', actualValue: 'Completed stator draft CAD', actualNumeric: 1, status: 'COMPLETED', score: 100, enteredBy: rdEmployee1._id },
            { goalId: sunilGoal3._id, quarter: 'Q1', plannedValue: 'Conduct 4 extreme torque tests', actualValue: 'Conduct 5 extreme torque tests', actualNumeric: 5, status: 'COMPLETED', score: 100, enteredBy: rdEmployee1._id },
            // Amit's check-ins
            { goalId: amitGoal1._id, quarter: 'Q1', plannedValue: 'Audit 1 vendor', actualValue: 'Audited 1 vendor', actualNumeric: 1, status: 'ON_TRACK', score: 90, enteredBy: scEmployee1._id },
            { goalId: amitGoal2._id, quarter: 'Q1', plannedValue: 'Maintain 15 days lamination stock', actualValue: 'Maintained 14 days stock', actualNumeric: 14, status: 'COMPLETED', score: 95, enteredBy: scEmployee1._id }
        ]);
        console.log('📈 Quarterly Check-in Entries populated!');

        // --- 6. SEED COWORKER KUDOS WALL (CONTINUOUS PRAISE) ---
        console.log('🤝 Seeding coworker kudos appreciations wall feed...');
        await Praise.create([
            {
                senderId: rdEmployee1._id,
                receiverId: rdEmployee2._id,
                message: 'Outstanding help on stator balance models Vijay! Saved us days of test validations on the core 12-pole design.',
                thrustArea: 'BLDC Tech'
            },
            {
                senderId: salesEmployee1._id,
                receiverId: scEmployee1._id,
                message: 'Incredible speed in sourcing magnets Amit! Helped us fulfill the smart fans pre-order cycle in record time.',
                thrustArea: 'Supply Chain'
            },
            {
                senderId: scEmployee1._id,
                receiverId: rdEmployee1._id,
                message: 'Superb technical specifications provided for the silicon buffer sheets, Sunil. Sourcing was direct and clean.',
                thrustArea: 'BLDC Tech'
            }
        ]);
        console.log('🤝 Coworker Kudos seeded!');

        console.log('\n🌟 Seeding Operation Completed Successfully!');
        console.log('\n--- Quick Login Credentials ---');
        console.log('👑 Admin:   admin@atomberg.com     | Password: Atomberg123!');
        console.log('👨‍💼 Manager: dharmaram@atomberg.com | Password: Atomberg123!');
        console.log('👨‍💼 Manager: sanjay@atomberg.com    | Password: Atomberg123!');
        console.log('👨‍💼 Manager: priya@atomberg.com     | Password: Atomberg123!');
        console.log('👨‍💻 Employee: sunil@atomberg.com    | Password: Atomberg123!');
        console.log('👨‍💻 Employee: vijay@atomberg.com    | Password: Atomberg123!');
        console.log('👨‍💻 Employee: amit@atomberg.com     | Password: Atomberg123!');
        console.log('👨‍💻 Employee: karan@atomberg.com    | Password: Atomberg123!');
        console.log('👨‍💻 Employee: neha@atomberg.com     | Password: Atomberg123!');
        console.log('--------------------------------\n');

        mongoose.connection.close();
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        mongoose.connection.close();
    }
}

seedDatabase();
