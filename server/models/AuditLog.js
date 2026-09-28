const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema({
    user:      { type: String, required: true },
    action:    { type: String, required: true }, // e.g., "Created test T-1024", "Added Rule Set V2"
    details:   { type: String }, // Optional extra info
    createdAt: { type: Date, default: Date.now }
});

AuditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", AuditLogSchema);
module.exports = AuditLog;
