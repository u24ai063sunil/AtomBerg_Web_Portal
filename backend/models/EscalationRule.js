const mongoose = require('mongoose');

const escalationRuleSchema = new mongoose.Schema({
    cycleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cycle', required: true },
    triggerEvent: { 
        type: String, 
        enum: ['NO_SUBMISSION', 'NO_APPROVAL', 'NO_CHECKIN'], 
        required: true 
    },
    daysThreshold: { type: Number, required: true },
    notifyEmployee: { type: Boolean, default: true },
    notifyManager: { type: Boolean, default: true },
    notifySkipLevel: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('EscalationRule', escalationRuleSchema);
