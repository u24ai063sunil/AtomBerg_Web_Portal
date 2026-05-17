const mongoose = require('mongoose');

const quarterlyEntrySchema = new mongoose.Schema({
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', required: true },
    quarter: { type: String, enum: ['Q1', 'Q2', 'Q3', 'Q4'], required: true },
    plannedValue: String,
    actualValue: String,
    actualNumeric: Number,
    completionDate: Date,
    status: { type: String, enum: ['NOT_STARTED', 'ON_TRACK', 'COMPLETED'], default: 'NOT_STARTED' },
    score: { type: Number, default: 0 },
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    enteredAt: { type: Date, default: Date.now },
    isWindowOpen: { type: Boolean, default: true }
}, { timestamps: true });

// unique constraint to prevent duplicate entries per goal per quarter
quarterlyEntrySchema.index({ goalId: 1, quarter: 1 }, { unique: true });

module.exports = mongoose.model('QuarterlyEntry', quarterlyEntrySchema);
