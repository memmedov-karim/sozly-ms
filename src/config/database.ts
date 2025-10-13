import mongoose from "mongoose";

export class DatabaseConfig {
  private static instance: DatabaseConfig;

  private constructor() {}

  static getInstance(): DatabaseConfig {
    if (!DatabaseConfig.instance) {
      DatabaseConfig.instance = new DatabaseConfig();
    }
    return DatabaseConfig.instance;
  }

  async connectMongoDB(): Promise<void> {
    try {
      await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/voice-chat"
      );
      console.log("MongoDB connected successfully");
    } catch (error) {
      console.error("MongoDB connection error:", error);
      process.exit(1);
    }
  }

  private async closeMongoDB(): Promise<void> {
    try {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    } catch (error) {
      console.error("Error closing MongoDB connection:", error);
    }
  }

  async close(): Promise<void> {
    await Promise.allSettled([
      this.closeMongoDB().catch((err) => {
        console.log("Error closing mongo connection", err);
      }),
    ]);
  }
}
