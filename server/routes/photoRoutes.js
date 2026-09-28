const express = require("express");
const router = express.Router();
const photoController = require("../controllers/photoController");
const { authMiddleware } = require("../middleware/auth");

router.post("/upload-photo", authMiddleware, photoController.uploadPhoto);

module.exports = router;
