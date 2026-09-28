const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

router.get("/admin/dashboard", authMiddleware, adminMiddleware, adminController.getAdminDashboard);
router.post("/admin/reports/:id/review", authMiddleware, adminMiddleware, adminController.reviewReportByAdmin);
router.post("/admin/users/add", authMiddleware, adminMiddleware, adminController.addUserByAdmin);
router.post("/admin/rules/add", authMiddleware, adminMiddleware, adminController.addRuleSetByAdmin);
router.post("/admin/rules/activate/:id", authMiddleware, adminMiddleware, adminController.activateRuleSetByAdmin);

module.exports = router;
