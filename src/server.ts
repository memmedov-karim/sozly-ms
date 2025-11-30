import "./env";

import compression from "compression";
import cors from "cors";
import express from "express";

import cookieParser from "cookie-parser";

import helmet from "helmet";
import { createServer } from "http";
import { DatabaseConfig } from "./config/database";
import ipBanRouter from "./router/IPBanRouter";
import optionRouter from "./router/client/OptionRouter";
import reportRouter from "./router/ReportRouter";

// Admin Panel Routers
import adminManagementRouter from "./router/AdminManagementRouter";
import analyticsRouter from "./router/AnalyticsRouter";
import authRouter from "./router/AuthRouter";
import chatManagementRouter from "./router/ChatManagementRouter";
import dashboardRouter from "./router/DashboardRouter";
import reportManagementRouter from "./router/ReportManagementRouter";
import userManagementRouter from "./router/UserManagementRouter";
import turnServerRouter from "./router/client/TurnServerRouter";
import clientAuthRouter from "./router/client/ClientAuthRouter";
import { CORS_ORIGIN } from "./constants/shared";
import { globalErrorHandler } from "./middleware/errorHandler";
import { gracefulShutdown } from "./shutdown";

const app = express();
const server = createServer(app);

// Trust proxy if behind reverse proxy
app.set("trust proxy", 1);
app.use(cookieParser());
// Debug logging
console.log("Environment:", process.env.NODE_ENV);
console.log("CORS Origins:", CORS_ORIGIN);

// CORS must come BEFORE helmet and other middleware
const corsOptions = {
  origin: function (origin: any, callback: any) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if the origin is in our allowed list
    const allowedOrigins = Array.isArray(CORS_ORIGIN)
      ? CORS_ORIGIN
      : [CORS_ORIGIN];
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "x-api-key",
    "Accept",
    "x-user-id",
  ],
  exposedHeaders: ["Content-Length", "X-Request-Id"],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// app.use(validateApiKey);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    worker: process.pid,
  });
});

// Public API routes
app.use(optionRouter);
app.use(reportRouter);
app.use("/api/ban", ipBanRouter);
app.use("/api/turn", turnServerRouter);

app.use("/api/client", clientAuthRouter);
// Authentication routes (public)
app.use("/api/auth", authRouter);

// Admin Panel API routes (protected)
app.use("/api/admin/admins", adminManagementRouter);
app.use("/api/admin/dashboard", dashboardRouter);
app.use("/api/admin/users", userManagementRouter);
app.use("/api/admin/chats", chatManagementRouter);
app.use("/api/admin/reports", reportManagementRouter);
app.use("/api/admin/analytics", analyticsRouter);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(globalErrorHandler);

async function main() {
  const db = DatabaseConfig.getInstance();
  await db.connectMongoDB();
  await db.connectRedis();

  const PORT = Number(process.env.PORT) || 8080;
  const HOST = process.env.HOST || "localhost";

  server.listen(PORT, HOST, () => {
    console.log(`Server running on port ${PORT} (Worker: ${process.pid})`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });

  gracefulShutdown.add(async () => {
    await new Promise((resolve) => {
      server.close((err) => {
        if (err) {
          console.error("Error closing server:", err);
        }
        resolve(void 0);
      });
    });

    await db.close();
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
