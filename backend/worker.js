require('dotenv').config();
const connectDB = require('./src/config/db');

// Environment Variable Validation
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET missing in environment variables");
}

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI missing in environment variables");
}

const startWorker = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();
    console.log('[Worker] Connected to MongoDB');

    // 2. Initialize the BullMQ Worker
    require('./src/services/workflowWorker');
    console.log('[Worker] Background worker process started and listening for jobs...');
    
  } catch (error) {
    console.error('[Worker] Failed to start:', error);
    process.exit(1);
  }
};

startWorker();
