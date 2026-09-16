import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('\n[MongoDB] WARNING: MONGODB_URI is not set in backend/.env.');
    console.warn('[MongoDB] Running with in-memory fallback store for uploads & reports.\n');
    return;
  }

  try {
    console.log('[MongoDB] Connecting to MongoDB Atlas (database: soc_platform)...');
    await mongoose.connect(uri, {
      dbName: 'soc_platform',
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    console.log('[MongoDB] Successfully connected to MongoDB (database: soc_platform)');
  } catch (error: any) {
    console.error('\n[MongoDB] Connection failed:', error.message || error);
    console.error('[MongoDB] Possible causes:');
    console.error('  1. Current IP address is not whitelisted in MongoDB Atlas (Network Access -> Add IP Address: 0.0.0.0/0).');
    console.error('  2. Incorrect username/password or unescaped special characters in MONGODB_URI.');
    console.error('  3. Network/firewall blocking port 27017.');
    console.error('[MongoDB] The platform will continue operating with in-memory store fallback.\n');
  }
};
