const express = require("express");
const router = express.Router();
const ruleController = require("../controllers/ruleController");

router.get("/rules/active", ruleController.getActiveRule);

module.exports = router;
