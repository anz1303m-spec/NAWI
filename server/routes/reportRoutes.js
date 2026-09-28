const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { authMiddleware, verifyLimiter } = require("../middleware/auth");

// Public rate-limited verification endpoint
router.get("/verify/:reportId", verifyLimiter, reportController.verifyReport);

// Protected report endpoints
router.post("/save-report", authMiddleware, reportController.saveReport);
router.get("/history", authMiddleware, reportController.getHistory);
router.get("/report/:id", authMiddleware, reportController.getReportById);

module.exports = router;
