const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize Workers
try { require('./workers/emailWorker'); } catch (e) { console.log('Email Worker disabled:', e.message); }

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/send', require('./routes/emailRoutes'));
app.use('/api/campaigns', require('./routes/campaignRoutes'));
app.use('/api/keys', require('./routes/apiKeyRoutes'));
app.use('/api/lists', require('./routes/listRoutes'));
app.use('/api/domains', require('./routes/domainRoutes'));
app.use('/api/proxy', require('./routes/proxyRoutes'));
app.use('/api/v1', require('./routes/v1Routes'));
app.use('/api/billing', require('./routes/billingRoutes'));
app.use('/api/validate', require('./routes/validationRoutes'));
app.use('/api/plans', require('./routes/planRoutes'));
try { app.use('/api/webhooks', require('./routes/webhookRoutes')); } catch (e) { }  // optional

app.get('/', (req, res) => {
    res.send('Sendoras API is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
