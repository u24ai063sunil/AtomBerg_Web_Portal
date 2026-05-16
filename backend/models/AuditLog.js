const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    goalSheetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GoalSheet',
        required: true
    },
    changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    changeType: {
        type: String,
        required: true
    },
    previousData: mongoose.Schema.Types.Mixed,
    newData: mongoose.Schema.Types.Mixed,
    reason: String
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
