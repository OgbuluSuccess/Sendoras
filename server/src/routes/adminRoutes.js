const express = require("express");
const router = express.Router();
const {
  getSystemStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllTransactions,
  getAllCampaigns,
  getCampaignDetail,
} = require("../controllers/adminController");
const {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
} = require("../controllers/planController");
const {
  getSettings,
  updateSettings,
} = require("../controllers/settingsController");
const { protect, admin } = require("../middleware/authMiddleware");

router.get("/stats", protect, admin, getSystemStats);
router.get("/users", protect, admin, getAllUsers);
router.put("/users/:id", protect, admin, updateUser);
router.delete("/users/:id", protect, admin, deleteUser);
router.get("/transactions", protect, admin, getAllTransactions);
router.get("/campaigns", protect, admin, getAllCampaigns);
router.get("/campaigns/:id", protect, admin, getCampaignDetail);

// Plan management
router.get("/plans", protect, admin, getPlans);
router.post("/plans", protect, admin, createPlan);
router.put("/plans/:id", protect, admin, updatePlan);
router.delete("/plans/:id", protect, admin, deletePlan);

// App settings
router.get("/settings", protect, admin, getSettings);
router.put("/settings", protect, admin, updateSettings);

module.exports = router;
