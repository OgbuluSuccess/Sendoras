const express = require("express");
const router = express.Router();
const {
  getApiKeys,
  createApiKey,
  deleteApiKey,
} = require("../controllers/apiKeyController");
const { protect } = require("../middleware/authMiddleware");
const { requireApiAccess } = require("../middleware/tierMiddleware");

// Anyone authenticated can VIEW their keys (even empty for free users)
router.get("/", protect, getApiKeys);

// Only Pro/Enterprise can CREATE keys
router.post("/", protect, requireApiAccess, createApiKey);

// Any authenticated user can revoke their own existing keys
router.delete("/:id", protect, deleteApiKey);

module.exports = router;
