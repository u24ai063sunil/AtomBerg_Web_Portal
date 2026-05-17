const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorName: String,
    actorRole: String,
    entityType: { type: String, enum: ['GOAL', 'GOALSHEET', 'SHARED_GOAL', 'CYCLE', 'USER'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    action: { type: String, required: true },
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    reason: String
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
