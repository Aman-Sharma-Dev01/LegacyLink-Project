const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    // Removed deprecated options (useNewUrlParser, useUnifiedTopology)
    // These are default in Mongoose 6+ and no longer needed
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Please check:');
    console.error('1. Your MongoDB Atlas cluster is active (not paused)');
    console.error('2. Your IP is whitelisted in MongoDB Atlas Network Access');
    console.error('3. Your MONGO_URI in .env is correct');
    process.exit(1);
  }
};

module.exports = connectDB;