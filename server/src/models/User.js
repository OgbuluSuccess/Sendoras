const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false,
    default: null,
  },
  googleId: {
    type: String,
    default: null,
  },
  avatar: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ["admin", "b2b", "b2c"],
    default: "b2c",
  },
  tier: {
    type: String,
    default: "free",
  },
  // Email quota tracking
  emailsSentThisMonth: {
    type: Number,
    default: 0,
  },
  emailsResetDate: {
    type: Date,
    default: () => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1, 1);
      d.setHours(0, 0, 0, 0);
      return d; // 1st of next month
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpire: {
    type: Date,
    default: null,
  },
});

// Encrypt password before save
UserSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) {
    return; // In async pre-hooks, Mongoose handles continuation via the promise — never call next()
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
