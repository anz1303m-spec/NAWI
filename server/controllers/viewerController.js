const User = require("../models/User");
const Report = require("../models/Report");
const AuditLog = require("../models/AuditLog");

const getViewerStats = async (req, res) => {
    try {
        const [
            labsCount,
            pendingReviewCount,
            sentForApprovalCount,
            certificatesIssuedCount
        ] = await Promise.all([
            User.countDocuments({}),
            Report.countDocuments({
                $or: [
                    { workflow_status: { $in: ["SUBMITTED", "RESUBMITTED"] } },
                    { workflow_status: { $exists: false } }
                ]
            }),
            Report.countDocuments({
                workflow_status: "PENDING_ADMIN_APPROVAL"
            }),
            Report.countDocuments({
                $or: [
                    { sha256_hash: { $exists: true, $ne: null } },
                    { workflow_status: { $in: ["APPROVED", "ISSUED"] } }
                ]
            })
        ]);

        res.json({
            labsCount,
            pendingReviewCount,
            sentForApprovalCount,
            certificatesIssuedCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getViewerReports = async (req, res) => {
    try {
        const { tab = "pending" } = req.query;
        let query = {};
        let sortOrder = { createdAt: 1 };

        if (tab === "pending") {
            query = {
                $or: [
                    { workflow_status: { $in: ["SUBMITTED", "RESUBMITTED", "UNDER_VIEWER_REVIEW"] } },
                    { workflow_status: { $exists: false } }
                ]
            };
            sortOrder = { createdAt: 1 };
        } else if (tab === "sent") {
            query = { workflow_status: { $in: ["PENDING_ADMIN_APPROVAL", "APPROVED", "CERTIFIED", "ISSUED"] } };
            sortOrder = { createdAt: -1 };
        } else if (tab === "rejected") {
            query = { workflow_status: { $in: ["REJECTED_BY_VIEWER", "REJECTED_BY_ADMIN", "SENT_BACK_TO_TESTER"] } };
            sortOrder = { createdAt: -1 };
        }

        const reports = await Report.find(query)
            .select("-instrument_photo -administrative_evidence -reading_proofs -evidence_register")
            .sort(sortOrder)
            .lean();

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
            r.accuracy_class = (r.instrument_data && r.instrument_data.Class_value) ? r.instrument_data.Class_value : (r.accuracy_class || "III");
            r.instrument_type = (r.instrument_data && r.instrument_data.instrument_type) ? r.instrument_data.instrument_type : "NAWI Instrument";
            r.model = (r.instrument_data && (r.instrument_data.model || r.instrument_data.instrument_type)) || r.instrument_id || "NAWI Model";
            r.workflow_status = r.workflow_status || "SUBMITTED";
        });

        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const reviewReportByViewer = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, comments, general_comment, modified_results } = req.body; // action: "APPROVE" | "REJECT"

        if (!action || !["APPROVE", "REJECT"].includes(action)) {
            return res.status(400).json({ error: "Invalid action. Must be 'APPROVE' or 'REJECT'." });
        }

        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).json({ error: "Report not found." });
        }

        // Guardrail: Rejection requires at least one row-level comment or explanation
        const hasComments = Array.isArray(comments) ? comments.some(c => c && c.comment && c.comment.trim().length > 0) : (general_comment && general_comment.trim().length > 0);
        if (action === "REJECT" && !hasComments) {
            return res.status(400).json({ error: "Rejection requires at least one test comment explaining what the tester needs to fix." });
        }

        // If viewer modified results (cross-check overrides), save them to report
        if (modified_results && typeof modified_results === 'object') {
            if (modified_results.form1_results) { report.form1_results = modified_results.form1_results; report.markModified('form1_results'); }
            if (modified_results.form2_results) { report.form2_results = modified_results.form2_results; report.markModified('form2_results'); }
            if (modified_results.form3_results) { report.form3_results = modified_results.form3_results; report.markModified('form3_results'); }
            if (modified_results.form_zero_results) { report.form_zero_results = modified_results.form_zero_results; report.markModified('form_zero_results'); }
            if (modified_results.form_tare_results) { report.form_tare_results = modified_results.form_tare_results; report.markModified('form_tare_results'); }
            if (modified_results.form_tilt_results) { report.form_tilt_results = modified_results.form_tilt_results; report.markModified('form_tilt_results'); }
        }

        const reviewerName = req.username || (req.user && req.user.name) || "Quality Reviewer";
        const newStatus = action === "APPROVE" ? "PENDING_ADMIN_APPROVAL" : "REJECTED_BY_VIEWER";

        report.workflow_status = newStatus;
        report.reviewedBy = reviewerName;
        if (Array.isArray(comments) && comments.length > 0) {
            report.test_comments = comments;
        }

        const historyItem = {
            reviewer: reviewerName,
            role: "Viewer",
            action: action === "APPROVE" ? "FORWARDED_TO_ADMIN" : "REJECTED_BY_VIEWER",
            comments: comments || [],
            general_comment: general_comment || "",
            timestamp: new Date()
        };

        if (!Array.isArray(report.review_history)) {
            report.review_history = [];
        }
        report.review_history.push(historyItem);

        // Recompute SHA-256 seal for tamper verification
        const { computeReportHash } = require("../utils/hashReport");
        report.sha256_hash = computeReportHash(report);

        await report.save();

        await AuditLog.create({
            user: reviewerName,
            action: action === "APPROVE" ? "Viewer Approved Report" : "Viewer Rejected Report",
            details: `Report ID: ${id} (${report.instrument_id}) -> Moved to status: ${newStatus}`
        });

        res.json({
            success: true,
            message: action === "APPROVE" 
                ? "Report successfully verified and sent to Admin for final certification approval." 
                : "Report rejected by Viewer with comments and returned to Tester for re-testing.",
            report
        });
    } catch (err) {
        console.error("Viewer review error:", err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getViewerStats,
    getViewerReports,
    reviewReportByViewer
};
