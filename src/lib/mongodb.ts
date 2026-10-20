import mongoose from "mongoose";

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!MONGODB_URI) {
    throw new Error("Please define MONGODB_URI or MONGO_URI in your environment.");
  }

  if (mongoose.connection.readyState >= 1) {
    return;
  }

  await mongoose.connect(MONGODB_URI);
}

export async function isMongoAvailable() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!MONGODB_URI) {
      return false;
    }

    if (mongoose.connection.readyState >= 1) {
      return true;
    }

    await mongoose.connect(MONGODB_URI);
    return true;
  } catch {
    return false;
  }
}

export default connectDB;
