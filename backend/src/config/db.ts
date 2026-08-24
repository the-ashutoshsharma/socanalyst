import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MongoDB connection failed: MONGODB_URI environment variable is not defined.');
    return;
  }

  try {
    await mongoose.connect(uri, {
      dbName: 'soc_platform',
    });
    console.log('Successfully connected to MongoDB (database: soc_platform)');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
};
