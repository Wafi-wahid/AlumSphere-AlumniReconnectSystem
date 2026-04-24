import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI as string;

export async function connectMongo() {
  if (!uri) {
    console.warn('[mongo] MONGODB_URI is not set. Mongo connection will be skipped.');
    return;
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || 'echo-alum-link',
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  });
  console.log('[mongo] connected');
}

export { mongoose };
