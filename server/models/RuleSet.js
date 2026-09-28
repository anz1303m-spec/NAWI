const mongoose = require("mongoose");

const RuleSetSchema = new mongoose.Schema({
    version_name: { type: String, required: true, unique: true }, // e.g., "OIML R-76 V1"
    isActive:     { type: Boolean, default: false },
    description:  String,
    rules:        { type: mongoose.Schema.Types.Mixed, required: true }, // JSON object of limits
    createdAt:    { type: Date, default: Date.now },
    createdBy:    { type: String, default: "Admin" }
});

const RuleSet = mongoose.model("RuleSet", RuleSetSchema);
module.exports = RuleSet;
