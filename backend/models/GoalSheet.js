const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    thrustArea: {
        type: String,
        required: true
    },
    uom: {
        type: String,
        enum: ['numeric', 'percentage', 'timeline', 'zero-based'],
        required: true
    },
    target: {
        type: mongoose.Schema.Types.Mixed, // Can be number, string (for date), or boolean
        required: true
    },
    weightage: {
        type: Number,
        required: true,
        min: 10
    },
    achievements: {
        q1: { actual: mongoose.Schema.Types.Mixed, status: { type: String, enum: ['Not Started', 'On Track', 'Completed'], default: 'Not Started' } },
        q2: { actual: mongoose.Schema.Types.Mixed, status: { type: String, enum: ['Not Started', 'On Track', 'Completed'], default: 'Not Started' } },
        q3: { actual: mongoose.Schema.Types.Mixed, status: { type: String, enum: ['Not Started', 'On Track', 'Completed'], default: 'Not Started' } },
        q4: { actual: mongoose.Schema.Types.Mixed, status: { type: String, enum: ['Not Started', 'On Track', 'Completed'], default: 'Not Started' } }
    },
    isShared: {
        type: Boolean,
        default: false
    },
    primaryOwnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

const goalSheetSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['draft', 'submitted', 'approved', 'returned'],
        default: 'draft'
    },
    goals: [goalSchema],
    cycle: {
        type: String, // e.g., "2024-25"
        required: true
    },
    checkIns: [
        {
            quarter: String,
            comment: String,
            managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            date: { type: Date, default: Date.now }
        }
    ],
    isLocked: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Validation for total weightage
goalSheetSchema.pre('save', async function() {
    if (this.goals && this.goals.length > 0) {
        if (this.goals.length > 8) {
            throw new Error('Maximum 8 goals allowed per employee.');
        }
    }
});

module.exports = mongoose.model('GoalSheet', goalSheetSchema);
