const User = require("../models/User");
const Report = require("../models/Report");
const RuleSet = require("../models/RuleSet");
const AuditLog = require("../models/AuditLog");
const { computeReportHash } = require("../utils/hashReport");

const getAdminDashboard = async (req, res) => {
    try {
        const [allReports, users, rulesets, logs] = await Promise.all([
            Report.find({}).sort({ createdAt: -1 }).lean(),
            User.find().select("name email role createdAt").lean(),
            RuleSet.find().sort({ createdAt: -1 }).lean(),
            AuditLog.find().sort({ createdAt: -1 }).limit(150).lean()
        ]);

        let passed = 0, failed = 0, pending = 0, certified = 0;
        const processedReports = allReports.map(r => {
            let isPass = true;
            const results = [r.form1_results, r.form2_results, r.form3_results, r.form_zero_results, r.form_tare_results, r.form_tilt_results];
            for (const res of results) {
                if (res && JSON.stringify(res).includes('"FAIL"')) { isPass = false; break; }
            }
            if (isPass) passed++; else failed++;

            if (r.workflow_status === 'PENDING_ADMIN_APPROVAL') pending++;
            if (['APPROVED', 'CERTIFIED', 'ISSUED'].includes(r.workflow_status)) certified++;

            return { ...r, status: isPass ? "PASS" : "FAIL" };
        });

        const testers = users.map(u => ({
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role === "admin" ? "Administrator" : u.role === "viewer" ? "Viewer Officer" : "Tester Officer",
            rawRole: u.role,
            tests: allReports.filter(r => r.createdBy === u.name).length,
            status: "Active",
            createdAt: u.createdAt
        }));

        const activeRule = rulesets.find(r => r.isActive) || rulesets[0] || null;

        const stats = {
            total: allReports.length,
            passed,
            failed,
            pending,
            certified,
            users: testers.length
        };

        res.json({ stats, reports: processedReports, testers, rulesets, activeRule, logs });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: "Error loading admin dashboard: " + err.message });
    }
};

const reviewReportByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, general_comment } = req.body; // action: "APPROVE" | "REJECT"

        if (!action || !["APPROVE", "REJECT"].includes(action)) {
            return res.status(400).json({ error: "Invalid action. Must be 'APPROVE' or 'REJECT'." });
        }

        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).json({ error: "Report not found." });
        }

        if (action === "REJECT" && (!general_comment || general_comment.trim().length === 0)) {
            return res.status(400).json({ error: "Admin rejection requires an explanatory comment for the tester and viewer." });
        }

        const adminName = req.username || (req.user && req.user.name) || "Admin Authority";
        const newStatus = action === "APPROVE" ? "CERTIFIED" : "REJECTED_BY_ADMIN";

        report.workflow_status = newStatus;
        report.approvedBy = adminName;
        if (action === "APPROVE") {
            report.report_status = "ISSUED";
        }

        // Seal report with deterministic SHA-256 hash
        report.sha256_hash = computeReportHash(report);

        const historyItem = {
            reviewer: adminName,
            role: "Admin",
            action: action === "APPROVE" ? "APPROVED_AND_CERTIFIED_BY_ADMIN" : "REJECTED_BY_ADMIN",
            general_comment: general_comment || (action === "APPROVE" ? "Approved by Admin Authority. Official Verification Certificate Generated & Published." : ""),
            timestamp: new Date()
        };

        if (!Array.isArray(report.review_history)) {
            report.review_history = [];
        }
        report.review_history.push(historyItem);

        await report.save();

        await AuditLog.create({
            user: adminName,
            action: action === "APPROVE" ? "Admin Approved Application & Issued Certificate" : "Admin Rejected Application",
            details: `Report ID: ${id} -> Status: ${newStatus}, Hash: ${report.sha256_hash ? report.sha256_hash.substring(0, 16) : ''}...`
        });

        res.json({
            success: true,
            message: action === "APPROVE"
                ? "Application approved! Official Certificate generated and publicly published."
                : "Application rejected by Admin and returned with comments.",
            report
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const addUserByAdmin = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email, and password are required." });
        }

        const validRoles = ["admin", "tester", "viewer"];
        const userRole = validRoles.includes(role) ? role : "viewer";

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(400).json({ error: "An officer account with this email already exists." });
        }

        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            role: userRole
        });

        await user.save();

        await AuditLog.create({
            user: req.username,
            action: `Registered New Officer (${userRole.toUpperCase()})`,
            details: `Created account for ${user.name} <${user.email}>`
        });

        res.status(201).json({
            success: true,
            message: `Registered new ${userRole} officer successfully!`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error("Add user error:", err);
        res.status(500).json({ error: err.message });
    }
};

const addRuleSetByAdmin = async (req, res) => {
    try {
        const { version_name, description, rules, setActive, adminPassword } = req.body;
        let parsedRules;
        try {
            parsedRules = typeof rules === 'string' ? JSON.parse(rules) : rules;
        } catch(e) {
            return res.status(400).json({ error: "Invalid JSON in rules field." });
        }

        const isSetDefaultActive = Boolean(setActive);
        if (isSetDefaultActive) {
            if (!adminPassword) {
                return res.status(400).json({ error: "Admin password is required to set a rule set as active for testing." });
            }
            const adminUser = await User.findById(req.user.id);
            if (!adminUser || !(await adminUser.comparePassword(adminPassword))) {
                return res.status(401).json({ error: "Invalid admin password. Authorization failed." });
            }
            await RuleSet.updateMany({}, { isActive: false });
        }

        const newRule = new RuleSet({
            version_name,
            description,
            rules: parsedRules,
            isActive: isSetDefaultActive,
            createdBy: req.username
        });
        await newRule.save();

        await AuditLog.create({
            user: req.username,
            action: `Added Rule Set ${version_name}`,
            details: isSetDefaultActive ? `Status: ACTIVE (Set for testing)` : `Status: DRAFT`
        });

        res.json({
            success: true,
            message: isSetDefaultActive
                ? `Rule set '${version_name}' created and set as ACTIVE for testing!`
                : `Rule set '${version_name}' created successfully.`
        });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
};

const activateRuleSetByAdmin = async (req, res) => {
    try {
        const { adminPassword } = req.body;
        if (!adminPassword) {
            return res.status(400).json({ error: "Admin password is required to activate a rule set for testing." });
        }

        const adminUser = await User.findById(req.user.id);
        if (!adminUser || !(await adminUser.comparePassword(adminPassword))) {
            return res.status(401).json({ error: "Invalid admin password. Authorization failed." });
        }

        const ruleId = (req.params.id || "").trim();
        const targetRule = await RuleSet.findById(ruleId);
        if (!targetRule) return res.status(404).json({ error: "Rule set not found" });

        const previousRule = await RuleSet.findOne({ isActive: true });
        
        await RuleSet.updateMany({}, { isActive: false });
        targetRule.isActive = true;
        await targetRule.save();

        await AuditLog.create({
            user: req.username,
            action: `Activated Rule Set ${targetRule.version_name}`,
            details: `Authorized with admin password verification. Previous: ${previousRule ? previousRule.version_name : 'None'}`
        });

        res.json({ success: true, message: `Successfully activated '${targetRule.version_name}' for testing!` });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAdminDashboard,
    reviewReportByAdmin,
    addUserByAdmin,
    addRuleSetByAdmin,
    activateRuleSetByAdmin
};
