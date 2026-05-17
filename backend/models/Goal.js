const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    goalSheetId: { type: mongoose.Schema.Types.ObjectId, ref: 'GoalSheet', required: true },
    title: { type: String, required: true },
    description: String,
    thrustArea: { type: String }, // Can be enum later if specific thrust areas exist
    uomType: { 
        type: String, 
        enum: ['MIN', 'MAX', 'TIMELINE', 'ZERO'], 
        required: true 
    },
    target: { type: String, required: true },
    targetNumeric: Number,
    targetDate: Date,
    weightage: { type: Number, required: true, min: 10, max: 90 },
    isShared: { type: Boolean, default: false },
    sharedGoalId: { type: mongoose.Schema.Types.ObjectId, ref: 'SharedGoal' },
    isReadOnly: { type: Boolean, default: false },
    order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);
