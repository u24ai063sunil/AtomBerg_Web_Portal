const mongoose = require('mongoose');

const goalSheetSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cycleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cycle', required: true },
    status: { 
        type: String, 
        enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'RETURNED'], 
        default: 'DRAFT' 
    },
    submittedAt: Date,
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    managerComment: String,
    isLocked: { type: Boolean, default: false }
}, { timestamps: true });

// Ensure unique goal sheet per employee per cycle
goalSheetSchema.index({ employeeId: 1, cycleId: 1 }, { unique: true });

module.exports = mongoose.model('GoalSheet', goalSheetSchema);
