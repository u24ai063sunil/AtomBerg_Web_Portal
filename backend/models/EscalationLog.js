const mongoose = require('mongoose');

const escalationLogSchema = new mongoose.Schema({
    ruleId: { type: mongoose.Schema.Types.ObjectId, ref: 'EscalationRule', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    escalatedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    sentAt: { type: Date, default: Date.now },
    resolvedAt: Date,
    status: { type: String, enum: ['PENDING', 'RESOLVED'], default: 'PENDING' }
}, { timestamps: true });

module.exports = mongoose.model('EscalationLog', escalationLogSchema);
