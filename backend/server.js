require('dotenv').config();
const connectDB = require('./src/config/db');
const app = require('./src/app');

// Environment Variable Validation
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET missing in environment variables");
}
if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI missing in environment variables");
}

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
