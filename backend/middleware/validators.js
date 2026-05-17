const Cycle = require('../models/Cycle');

const requireActiveWindow = (windowType) => {
    return async (req, res, next) => {
        let cycle = await Cycle.findOne({ isActive: true });
        if (!cycle) {
            const now = new Date();
            const future = new Date(now.getTime() + 31536000000);
            const past = new Date(now.getTime() - 86400000);
            cycle = new Cycle({
                name: 'FY 2025-26',
                fiscalYear: '2025-26',
                startDate: past,
                endDate: future,
                isActive: true,
                maxGoalsPerEmployee: 8,
                minWeightagePerGoal: 10,
                goalSettingOpens: past,
                goalSettingDeadline: future,
                q1Open: past, q1Close: future,
                q2Open: past, q2Close: future,
                q3Open: past, q3Close: future,
                q4Open: past, q4Close: future,
            });
            await cycle.save();
        }
        
        const now = new Date();
        let isOpen = false;

        switch (windowType) {
            case 'GOAL_SETTING':
                isOpen = now >= cycle.goalSettingOpens && now <= cycle.goalSettingDeadline;
                break;
            case 'Q1':
                isOpen = now >= cycle.q1Open && now <= cycle.q1Close;
                break;
            case 'Q2':
                isOpen = now >= cycle.q2Open && now <= cycle.q2Close;
                break;
            case 'Q3':
                isOpen = now >= cycle.q3Open && now <= cycle.q3Close;
                break;
            case 'Q4':
                isOpen = now >= cycle.q4Open && now <= cycle.q4Close;
                break;
        }

        if (!isOpen) {
            return res.status(403).json({ success: false, error: `Window for ${windowType} is currently closed` });
        }
        
        req.activeCycle = cycle;
        next();
    };
};

const validateGoalSheet = (goals, cycle) => {
    const errors = [];
    if (goals.length > cycle.maxGoalsPerEmployee) {
        errors.push(`Maximum ${cycle.maxGoalsPerEmployee} goals allowed.`);
    }
    
    let totalWeightage = 0;
    goals.forEach((goal, idx) => {
        if (goal.weightage < cycle.minWeightagePerGoal) {
            errors.push(`Goal ${idx + 1} has weightage less than minimum ${cycle.minWeightagePerGoal}%.`);
        }
        totalWeightage += goal.weightage;
    });

    if (totalWeightage !== 100) {
        errors.push(`Total weightage must be exactly 100%. Current is ${totalWeightage}%.`);
    }

    return errors;
};

module.exports = { requireActiveWindow, validateGoalSheet };
