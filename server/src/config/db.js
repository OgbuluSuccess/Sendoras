const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('Database Connection Error:', err.message);
        console.log('Retrying MongoDB connection in 10 seconds...');
        // Don't crash the server — retry after a delay
        setTimeout(connectDB, 10000);
    }
};

module.exports = connectDB;
