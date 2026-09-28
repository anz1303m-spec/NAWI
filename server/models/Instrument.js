const mongoose = require("mongoose");

const InstrumentSchema = new mongoose.Schema({
    manufacturer:  { type: String, required: true },
    model:         { type: String, required: true },
    serialNumber:  { type: String, required: true },
    accuracyClass: { type: String, enum: ["I", "II", "III", "IIII"], required: true },
    maxCapacity:   { type: Number, required: true },
    minCapacity:   { type: Number, required: true },
    eValue:        { type: Number, required: true }, // Verification scale interval (e)
    dValue:        { type: Number }, // Actual scale interval (d)
    createdAt:     { type: Date, default: Date.now }
});

module.exports = mongoose.model("Instrument", InstrumentSchema);
