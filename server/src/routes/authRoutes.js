const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const {
  register,
  login,
  getMe,
  googleCallback,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ── Google OAuth ──────────────────────────────────────────────────────────────
// Step 1: Redirect user to Google's consent screen
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

// Step 2: Google redirects back here with a code — use custom callback to avoid session issues
router.get("/google/callback", (req, res, next) => {
  passport.authenticate(
    "google",
    { session: false },
    async (err, googleUser) => {
      if (err) console.error("❌ Google Auth Error:", err);
      if (!googleUser)
        console.error("❌ No user returned. Error:", err?.message || "unknown");

      if (err || !googleUser) {
        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        return res.redirect(`${clientUrl}/auth/google/success?error=true`);
      }
      req.googleUser = googleUser;
      googleCallback(req, res);
    },
  )(req, res, next);
});

module.exports = router;
