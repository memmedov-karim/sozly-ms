"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConfig = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
class DatabaseConfig {
    constructor() { }
    static getInstance() {
        if (!DatabaseConfig.instance) {
            DatabaseConfig.instance = new DatabaseConfig();
        }
        return DatabaseConfig.instance;
    }
    async connectMongoDB() {
        try {
            await mongoose_1.default.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/voice-chat");
            console.log("MongoDB connected successfully");
        }
        catch (error) {
            console.error("MongoDB connection error:", error);
            process.exit(1);
        }
    }
    async closeMongoDB() {
        try {
            await mongoose_1.default.connection.close();
            console.log("MongoDB connection closed");
        }
        catch (error) {
            console.error("Error closing MongoDB connection:", error);
        }
    }
    async close() {
        await Promise.allSettled([
            this.closeMongoDB().catch((err) => {
                console.log("Error closing mongo connection", err);
            }),
        ]);
    }
}
exports.DatabaseConfig = DatabaseConfig;
//# sourceMappingURL=database.js.map