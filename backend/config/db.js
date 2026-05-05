const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.warn("⚠️ WARNING: MONGO_URI environment variable is missing.");
      console.warn("⚠️ The app is attempting to connect to a local database, which will fail on Render.");
      console.warn("⚠️ Please add MONGO_URI in your Render environment variables.");
    }
    
    const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookmyshow");
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error("⚠️ The backend server is still running, but data fetching will fail until MongoDB is connected.");
    // We remove process.exit(1) so the Render app doesn't crash completely.
  }
};

module.exports = connectDB;
