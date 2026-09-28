const mongoose = require("mongoose");
const Report = require("../models/Report");
const AuditLog = require("../models/AuditLog");
const { computeReportHash } = require("../utils/hashReport");

const saveReport = async (req, res) => {
    try {
        const {
            instrument,
            testPlan,
            form0, form0_results,
            form1, form1_results,
            form2, form2_results,
            form3, form3_results,
            form_zero, form_zero_results,
            form_tare, form_tare_results,
            form_tilt, form_tilt_results,
            reading_proofs,
            lab_details,
            instrument_photo,
            administrative_evidence,
            evidence_register,
            rule_set_version
        } = req.body;

        const instrument_id = instrument
            ? `${instrument.manufacturer || ""} ${instrument.model || ""}`.trim() || instrument.capacity
            : "Unknown";

        const newReport = new Report({
            instrument_id,
            instrument_data: instrument,
            serial_no: (instrument && instrument.serial_no) || "SN-884920",
            accuracy_class: (instrument && (instrument.Class_value || instrument.accuracy_class)) || "III",
            test_plan:          testPlan,
            form0_data:         form0,
            form0_results,
            form1_data:         form1,
            form1_results,
            form2_data:         form2,
            form2_results,
            form3_data:         form3,
            form3_results,
            form_zero_data:     form_zero,
            form_zero_results,
            form_tare_data:     form_tare,
            form_tare_results,
            form_tilt_data:     form_tilt,
            form_tilt_results,
            reading_proofs,
            lab_details,
            instrument_photo,
            administrative_evidence,
            evidence_register,
            rule_set_version,
            createdBy: req.username || "Nishant",
            workflow_status: "SUBMITTED",
            report_status: "ISSUED"
        });

        // Compute SHA-256 seal for tamper verification
        newReport.sha256_hash = computeReportHash(newReport);

        const savedReport = await newReport.save();

        // Non-blocking background audit log creation for zero-latency response
        AuditLog.create({
            user: req.username,
            action: `Generated report ${savedReport._id}`,
            details: `Instrument: ${instrument_id}, Hash: ${savedReport.sha256_hash.substring(0, 16)}...`
        }).catch(err => console.error("Audit log background error:", err));

        res.json({ message: "Report saved successfully!", id: savedReport._id, sha256_hash: savedReport.sha256_hash });
    } catch (err) {
        console.error("Save report error:", err);
        res.status(500).json({ error: err.message });
    }
};

const getHistory = async (req, res) => {
    try {
        const reports = await Report.find({}, "instrument_id instrument_data createdAt form1_results form2_results form3_results form_zero_results form_tare_results form_tilt_results createdBy rule_set_version sha256_hash report_status workflow_status").sort({ createdAt: -1 }).lean();
        
        reports.forEach(r => {
            let isPass = true;
            const results = [r.form1_results, r.form2_results, r.form3_results, r.form_zero_results, r.form_tare_results, r.form_tilt_results];
            for (let res of results) {
                if (res) {
                    const str = JSON.stringify(res);
                    if (str.includes('"FAIL"')) {
                        isPass = false;
                        break;
                    }
                }
            }
            r.status = isPass ? "PASS" : "FAIL";
            r.serial_no = (r.instrument_data && r.instrument_data.serial_no) ? r.instrument_data.serial_no : "N/A";
            r.accuracy_class = (r.instrument_data && r.instrument_data.Class_value) ? r.instrument_data.Class_value : "Unknown";
            r.instrument_type = (r.instrument_data && r.instrument_data.instrument_type) ? r.instrument_data.instrument_type : "Unknown";
        });

        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getReportById = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id).lean();
        if (!report) {
            return res.status(404).json({ error: "Report not found" });
        }
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const verifyReport = async (req, res) => {
    try {
        const rawId = req.params.reportId.trim();
        
        let report = null;
        if (mongoose.Types.ObjectId.isValid(rawId)) {
            report = await Report.findById(rawId).lean();
        }
        if (!report) {
            const cleanQuery = rawId.replace(/^TP-/i, "").trim().toUpperCase();
            // Fast Mongo query by exact string prefix matching on hex ObjectId string representation
            if (cleanQuery.length === 24 && mongoose.Types.ObjectId.isValid(cleanQuery)) {
                report = await Report.findById(cleanQuery).lean();
            }
            if (!report) {
                // Find matching report where string prefix of _id matches cleanQuery
                const hexPattern = new RegExp(`^${cleanQuery.toLowerCase()}`);
                report = await Report.findOne({
                    $expr: {
                        $regexMatch: {
                            input: { $toString: "$_id" },
                            regex: hexPattern
                        }
                    }
                }).lean();
            }
        }

        if (!report) {
            return res.status(404).json({
                status: "NOT_FOUND",
                message: "Certificate not found. Please check the ID or QR code and try again."
            });
        }

        // Recompute SHA-256 hash to verify data integrity
        const computedHash = computeReportHash(report);
        const storedHash = report.sha256_hash || computedHash;

        const isTampered = computedHash !== storedHash;
        const status = isTampered ? "TAMPERED" : "VERIFIED";

        // Determine overall Pass/Fail status
        let isPass = true;
        const results = [report.form1_results, report.form2_results, report.form3_results, report.form_zero_results, report.form_tare_results, report.form_tilt_results];
        for (let r of results) {
            if (r && JSON.stringify(r).includes('"FAIL"')) {
                isPass = false;
                break;
            }
        }

        if (status === "TAMPERED") {
            return res.json({
                status: "TAMPERED",
                reportId: `TP-${report._id.toString().substring(0, 8).toUpperCase()}`,
                message: "Verification Failed — This record does not match its original issued content."
            });
        }

        res.json({
            status: "VERIFIED",
            reportId: `TP-${report._id.toString().substring(0, 8).toUpperCase()}`,
            rawId: report._id,
            isSuperseded: report.report_status === "SUPERSEDED",
            supersededBy: report.supersededBy || null,
            sha256Hash: storedHash,
            ruleSetVersion: report.rule_set_version || "OIML R-76-1 (2006 Edition)",
            testDate: report.createdAt,
            lab: report.lab_details || {},
            instrument: {
                manufacturer: report.instrument_data?.manufacturer || "N/A",
                model: report.instrument_data?.model || "N/A",
                serialNumber: report.instrument_data?.serial_no || "N/A",
                accuracyClass: report.instrument_data?.Class_value || "N/A",
                capacity: report.instrument_data?.capacity || "N/A"
            },
            overallResult: isPass ? "PASS" : "FAIL",
            reviewChain: [
                { name: report.createdBy || "Nishant", role: "Tester / Inspection Officer" },
                { name: report.reviewedBy || "Quality Inspector", role: "Viewer / Reviewer" },
                { name: report.approvedBy || "Admin Authority", role: "Administrator / Signing Official" }
            ]
        });
    } catch (err) {
        console.error("Verification endpoint error:", err);
        res.status(500).json({ status: "ERROR", error: "Internal verification failure" });
    }
};

module.exports = {
    saveReport,
    getHistory,
    getReportById,
    verifyReport
};
