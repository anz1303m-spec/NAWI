const crypto = require("crypto");

/**
 * Computes deterministic SHA-256 hash of a verification report
 */
function computeReportHash(report) {
    const payload = JSON.stringify({
        id: report._id ? report._id.toString() : "",
        instrument: report.instrument_id || "",
        form1: report.form1_results || {},
        form2: report.form2_results || {},
        form3: report.form3_results || {},
        form_zero: report.form_zero_results || {},
        form_tare: report.form_tare_results || {},
        form_tilt: report.form_tilt_results || {},
        createdBy: report.createdBy || "",
        rule_set_version: report.rule_set_version || "OIML R-76 V1"
    });
    return crypto.createHash("sha256").update(payload).digest("hex");
}

module.exports = { computeReportHash };
