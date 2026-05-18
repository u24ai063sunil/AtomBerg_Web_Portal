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

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/atomquest';

async function seedDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected successfully!');

        // 1. Create Active Goal Alignment Cycle
        console.log('📅 Seeding Active Goal alignment cycles...');
        let activeCycle = await Cycle.findOne({ isActive: true });
        if (!activeCycle) {
            activeCycle = await Cycle.create({
                name: 'FY 2026-27 Q1',
                startDate: new Date('2026-04-01'),
                endDate: new Date('2026-06-30'),
                isActive: true,
                description: 'Q1 Goal Setting and Thrust Area Cascade for Atomberg Technologies'
            });
            console.log(`🚀 Created Cycle: ${activeCycle.name}`);
        } else {
            console.log(`ℹ️ Existing Active Cycle found: ${activeCycle.name}`);
        }

        // 2. Create Corporate Roles & Hierarchy
        console.log('👥 Seeding user profiles and reporting hierarchy...');
        const salt = await bcrypt.genSalt(10);
        const defaultPassword = await bcrypt.hash('Atomberg123!', salt);

        // A. Admin Profile
        let admin = await User.findOne({ email: 'admin@atomberg.com' });
        if (!admin) {
            admin = await User.create({
                name: 'Piyush Sharma',
                email: 'admin@atomberg.com',
                passwordHash: defaultPassword,
                role: 'ADMIN',
                designation: 'Head of People & Culture',
                department: 'Human Resources',
                picture: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Piyush'
            });
            console.log(`👑 Created Admin: ${admin.name}`);
        }

        // B. Manager Profiles
        let rdManager = await User.findOne({ email: 'dharmaram@atomberg.com' });
        if (!rdManager) {
            rdManager = await User.create({
                name: 'Dharmaram Jaat',
                email: 'dharmaram@atomberg.com',
                passwordHash: defaultPassword,
                role: 'MANAGER',
                designation: 'Director of R&D (BLDC Tech)',
                department: 'Research & Development',
                picture: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Dharmaram'
            });
            console.log(`👨‍💼 Created R&D Manager: ${rdManager.name}`);
        }

        let scManager = await User.findOne({ email: 'sanjay@atomberg.com' });
        if (!scManager) {
            scManager = await User.create({
                name: 'Sanjay Singh',
                email: 'sanjay@atomberg.com',
                passwordHash: defaultPassword,
                role: 'MANAGER',
                designation: 'Head of Operations & Supply',
                department: 'Supply Chain',
                picture: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sanjay'
            });
            console.log(`👨‍💼 Created Operations Manager: ${scManager.name}`);
        }

        // C. Employee Profiles (Linked to Managers)
        let rdEmployee = await User.findOne({ email: 'sunil@atomberg.com' });
        if (!rdEmployee) {
            rdEmployee = await User.create({
                name: 'Sunil Choudhary',
                email: 'sunil@atomberg.com',
                passwordHash: defaultPassword,
                role: 'EMPLOYEE',
                designation: 'Senior BLDC Motor Design Engineer',
                department: 'Research & Development',
                managerId: rdManager._id,
                picture: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sunil'
            });
            console.log(`👨‍💻 Created R&D Engineer: ${rdEmployee.name} -> Manager: ${rdManager.name}`);
        }

        let scEmployee = await User.findOne({ email: 'amit@atomberg.com' });
        if (!scEmployee) {
            scEmployee = await User.create({
                name: 'Amit Patel',
                email: 'amit@atomberg.com',
                passwordHash: defaultPassword,
                role: 'EMPLOYEE',
                designation: 'Procurement Specialist',
                department: 'Supply Chain',
                managerId: scManager._id,
                picture: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Amit'
            });
            console.log(`👨‍💻 Created SC Officer: ${scEmployee.name} -> Manager: ${scManager.name}`);
        }

        // 3. Create Aligned Corporate Shared Goals (Cascade Roots)
        console.log('🎯 Seeding top-level corporate shared targets...');
        
        let sharedGoal1 = await SharedGoal.findOne({ title: 'Reduce BLDC Motor Core Losses' });
        if (!sharedGoal1) {
            sharedGoal1 = await SharedGoal.create({
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
            console.log(`🎯 Created Shared Goal: ${sharedGoal1.title}`);
        }

        let sharedGoal2 = await SharedGoal.findOne({ title: 'Optimize Supply Chain Lead Time' });
        if (!sharedGoal2) {
            sharedGoal2 = await SharedGoal.create({
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
            console.log(`🎯 Created Shared Goal: ${sharedGoal2.title}`);
        }

        // 4. Automatically Populate Goal Sheets with Goals
        console.log('📝 Initializing Goal Sheets for employees...');

        // A. R&D Employee Goal Sheet
        let rdSheet = await GoalSheet.findOne({ employeeId: rdEmployee._id, cycleId: activeCycle._id });
        if (!rdSheet) {
            rdSheet = await GoalSheet.create({
                employeeId: rdEmployee._id,
                cycleId: activeCycle._id,
                status: 'APPROVED',
                isLocked: true
            });

            // Seed dynamic aligned goals
            await Goal.create([
                {
                    goalSheetId: rdSheet._id,
                    title: 'Core Loss Optimization Simulation',
                    description: 'Run ANSYS electromagnetic modeling to simulate core magnetic heat dissipation.',
                    thrustArea: 'BLDC Tech',
                    uomType: 'MAX',
                    target: '95% Simulation Accuracy',
                    targetNumeric: 95,
                    weightage: 40,
                    isShared: true,
                    sharedGoalId: sharedGoal1._id,
                    isReadOnly: true,
                    actualResult: 90
                },
                {
                    goalSheetId: rdSheet._id,
                    title: 'Stator Core Prototype Design',
                    description: 'Draft CAD designs for the revised 12-pole stator layout.',
                    thrustArea: 'BLDC Tech',
                    uomType: 'MAX',
                    target: '1 completed layout',
                    targetNumeric: 1,
                    weightage: 30,
                    actualResult: 1
                },
                {
                    goalSheetId: rdSheet._id,
                    title: 'Factory Validation Testing',
                    description: 'Verify starting torque and thermal profile under extreme load conditions.',
                    thrustArea: 'Sales & R&D',
                    uomType: 'MAX',
                    target: '10 successful test runs',
                    targetNumeric: 10,
                    weightage: 30,
                    actualResult: 8
                }
            ]);
            console.log(`📝 Generated APPROVED Goal Sheet & 3 Aligned Goals for Sunil Choudhary`);
        }

        // B. Supply Chain Employee Goal Sheet
        let scSheet = await GoalSheet.findOne({ employeeId: scEmployee._id, cycleId: activeCycle._id });
        if (!scSheet) {
            scSheet = await GoalSheet.create({
                employeeId: scEmployee._id,
                cycleId: activeCycle._id,
                status: 'APPROVED',
                isLocked: true
            });

            await Goal.create([
                {
                    goalSheetId: scSheet._id,
                    title: 'Magnet Vendor Onboarding',
                    description: 'Audit and onboard secondary regional magnet suppliers to mitigate international delays.',
                    thrustArea: 'Supply Chain',
                    uomType: 'MAX',
                    target: '2 regional vendors',
                    targetNumeric: 2,
                    weightage: 50,
                    isShared: true,
                    sharedGoalId: sharedGoal2._id,
                    isReadOnly: true,
                    actualResult: 2
                },
                {
                    goalSheetId: scSheet._id,
                    title: 'Inventory Buffer Optimization',
                    description: 'Define and implement safety stock targets for silicon steel laminations.',
                    thrustArea: 'Supply Chain',
                    uomType: 'MIN',
                    target: '15 days safety stock buffer',
                    targetNumeric: 15,
                    weightage: 50,
                    actualResult: 12
                }
            ]);
            console.log(`📝 Generated APPROVED Goal Sheet & 2 Aligned Goals for Amit Patel`);
        }

        console.log('\n🌟 Seeding Operation Completed Successfully!');
        console.log('\n--- Quick Login Credentials ---');
        console.log('👑 Admin:   admin@atomberg.com     | Password: Atomberg123!');
        console.log('👨‍💼 Manager: dharmaram@atomberg.com | Password: Atomberg123!');
        console.log('👨‍💻 Employee: sunil@atomberg.com    | Password: Atomberg123!');
        console.log('--------------------------------\n');

        mongoose.connection.close();
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        mongoose.connection.close();
    }
}

seedDatabase();
