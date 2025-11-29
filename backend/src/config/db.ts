import "./env.js";
import mongoose from "mongoose";

export default async function connectDB(): Promise<void> {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI!);
    const dbName = conn.connection.name || (conn as any).connection?.db?.databaseName;
    console.log(`MongoDB connected: host=${conn.connection.host} db=${dbName}`);
    console.log(`MONGODB_URI set: ${process.env.MONGODB_URI ? '[REDACTED]' : 'not-set'}, MONGODB_DB=${process.env.MONGODB_DB ?? '<none>'}`);
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};
