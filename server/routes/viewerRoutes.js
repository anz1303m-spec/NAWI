const express = require("express");
const router = express.Router();
const viewerController = require("../controllers/viewerController");
const { authMiddleware } = require("../middleware/auth");

router.get("/viewer/stats", authMiddleware, viewerController.getViewerStats);
router.get("/viewer/reports", authMiddleware, viewerController.getViewerReports);
router.post("/viewer/reports/:id/review", authMiddleware, viewerController.reviewReportByViewer);

module.exports = router;
