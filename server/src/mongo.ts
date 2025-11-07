import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI as string;

if (!uri) {
  console.warn('[mongo] MONGODB_URI is not set. Mongo connection will be skipped.');
} else {
  mongoose.set('strictQuery', true);
  mongoose
    .connect(uri, {
      dbName: process.env.MONGODB_DB || 'echo-alum-link',
    })
    .then(() => console.log('[mongo] connected'))
    .catch((err: unknown) => console.error('[mongo] connection error', err));
}

export { mongoose };
