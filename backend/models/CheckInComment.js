const mongoose = require('mongoose');

const checkInCommentSchema = new mongoose.Schema({
    goalSheetId: { type: mongoose.Schema.Types.ObjectId, ref: 'GoalSheet', required: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quarter: { type: String, enum: ['Q1', 'Q2', 'Q3', 'Q4'], required: true },
    comment: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('CheckInComment', checkInCommentSchema);
