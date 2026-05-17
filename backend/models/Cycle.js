const mongoose = require('mongoose');

const cycleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    fiscalYear: { type: String, required: true },
    goalSettingOpens: { type: Date, required: true },
    goalSettingDeadline: { type: Date, required: true },
    q1Open: Date,
    q1Close: Date,
    q2Open: Date,
    q2Close: Date,
    q3Open: Date,
    q3Close: Date,
    q4Open: Date,
    q4Close: Date,
    maxGoalsPerEmployee: { type: Number, default: 8 },
    minWeightagePerGoal: { type: Number, default: 10 },
    isActive: { type: Boolean, default: false }
}, { timestamps: true });

// Ensure only one cycle is active at a time
cycleSchema.pre('save', async function() {
    if (this.isActive) {
        await this.constructor.updateMany({ _id: { $ne: this._id } }, { isActive: false });
    }
});

module.exports = mongoose.model('Cycle', cycleSchema);
