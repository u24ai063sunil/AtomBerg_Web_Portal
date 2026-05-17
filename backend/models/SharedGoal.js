const mongoose = require('mongoose');

const sharedGoalSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    thrustArea: String,
    uomType: { 
        type: String, 
        enum: ['MIN', 'MAX', 'TIMELINE', 'ZERO'], 
        required: true 
    },
    target: { type: String, required: true },
    targetNumeric: Number,
    primaryOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cycleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cycle', required: true },
    pushedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    latestAchievement: { type: Number, default: 0 },
    lastSyncedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('SharedGoal', sharedGoalSchema);
