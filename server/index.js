require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./src/config/db");
const { APP_NAME } = require("./src/config/brand");

// Initialize App
const app = express();

// Database Connection
connectDB();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Initialize Workers
require("./src/workers/emailWorker");

// Routes (updated to force nodemon reload)
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/keys", require("./src/routes/apiKeyRoutes"));
app.use("/api/campaigns", require("./src/routes/campaignRoutes"));
app.use("/api/lists", require("./src/routes/listRoutes"));
app.use("/api/billing", require("./src/routes/billingRoutes"));
app.use("/api/admin", require("./src/routes/adminRoutes"));
app.use("/api/webhooks", require("./src/routes/webhookRoutes"));

app.get("/", (req, res) => {
  res.send(`${APP_NAME} API is running...`);
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
