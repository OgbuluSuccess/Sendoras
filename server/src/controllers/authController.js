const User = require("../models/User");
const Plan = require("../models/Plan");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendEmail } = require("../services/emailService");
const { getAppSettings } = require("./settingsController");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    user = await User.create({
      name,
      email,
      password,
      role: role || "b2c", // Default to b2c if not specified
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tier: user.tier,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    // Check password matching
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tier: user.tier,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -resetPasswordToken -resetPasswordExpire",
    );
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Look up the plan so the frontend can display quota details
    const plan = await Plan.findOne({ slug: user.tier, isActive: true })
      .select(
        "name slug monthlyEmails maxContactsPerList maxSenderIdentities apiAccess analyticsAccess support color isPopular",
      )
      .lean();

    const emailsUsed = user.emailsSentThisMonth || 0;
    const emailsLimit = plan?.monthlyEmails ?? null;
    const emailsRemaining =
      emailsLimit !== null ? Math.max(0, emailsLimit - emailsUsed) : null;

    res.json({
      ...user.toObject(),
      plan: plan || null,
      emailsUsed,
      emailsLimit,
      emailsRemaining,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Handle Google OAuth callback — find or create user, return JWT
// @access  Public (called by passport after Google verifies)
exports.googleCallback = async (req, res) => {
  try {
    const { googleId, email, name, avatar } = req.googleUser;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      user = await User.create({ name, email, googleId, avatar });
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.avatar = avatar;
      await user.save();
    }

    const token = generateToken(user._id);
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    // Redirect to the frontend success page — it handles postMessage + popup close
    res.redirect(`${clientUrl}/auth/google/success?token=${token}`);
  } catch (err) {
    console.error("Google callback error:", err.message);
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    res.redirect(`${clientUrl}/auth/google/success?error=true`);
  }
};

// @desc    Send password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ msg: "Email is required" });

  try {
    const user = await User.findOne({ email });
    // Always respond 200 to prevent email enumeration
    if (!user)
      return res.json({
        success: true,
        msg: "If that email exists, a reset link has been sent.",
      });

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const appSettings = await getAppSettings();
    const baseUrl = process.env.CLIENT_URL || appSettings.appBaseUrl;
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const html = `
            <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:2rem;">
                <h2 style="font-size:1.4rem;font-weight:800;color:#0f172a;margin-bottom:0.5rem">Reset your password</h2>
                <p style="color:#64748b;margin-bottom:1.5rem">We received a request to reset your password. Click the button below to choose a new one. The link expires in 1 hour.</p>
                <a href="${resetUrl}" style="display:inline-block;background:#f97316;color:#fff;font-weight:700;padding:0.75rem 1.5rem;border-radius:999px;text-decoration:none;margin-bottom:1.5rem">Reset Password</a>
                <p style="font-size:0.8rem;color:#94a3b8">If you didn't request this, you can safely ignore this email.</p>
            </div>
        `;

    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      html,
    });

    res.json({
      success: true,
      msg: "If that email exists, a reset link has been sent.",
    });
  } catch (err) {
    console.error("forgotPassword error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password)
    return res.status(400).json({ msg: "Token and new password are required" });
  if (password.length < 8)
    return res
      .status(400)
      .json({ msg: "Password must be at least 8 characters" });

  try {
    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user)
      return res
        .status(400)
        .json({ msg: "Reset link is invalid or has expired" });

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    res.json({ success: true, msg: "Password updated successfully" });
  } catch (err) {
    console.error("resetPassword error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};
