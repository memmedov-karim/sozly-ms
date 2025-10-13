"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./env");
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = require("http");
const database_1 = require("./config/database");
const OptionRouter_1 = __importDefault(require("./router/OptionRouter"));
const ReportRouter_1 = __importDefault(require("./router/ReportRouter"));
const shared_1 = require("./constants/shared");
const errorHandler_1 = require("./middleware/errorHandler");
const shutdown_1 = require("./shutdown");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Trust proxy if behind reverse proxy
app.set('trust proxy', 1);
// Debug logging
console.log('Environment:', process.env.NODE_ENV);
console.log('CORS Origins:', shared_1.CORS_ORIGIN);
// CORS must come BEFORE helmet and other middleware
const corsOptions = {
    origin: shared_1.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 86400, // 24 hours
};
app.use((0, cors_1.default)(corsOptions));
app.options('*', (0, cors_1.default)(corsOptions)); // Handle preflight
app.use((0, helmet_1.default)({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
}));
app.use((0, compression_1.default)());
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        worker: process.pid,
    });
});
app.use(OptionRouter_1.default);
app.use(ReportRouter_1.default);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
app.use(errorHandler_1.globalErrorHandler);
async function main() {
    const db = database_1.DatabaseConfig.getInstance();
    await db.connectMongoDB();
    const PORT = Number(process.env.PORT) || 8080;
    const HOST = process.env.HOST || 'localhost';
    server.listen(PORT, HOST, () => {
        console.log(`Server running on port ${PORT} (Worker: ${process.pid})`);
        console.log(`Health check: http://localhost:${PORT}/health`);
    });
    shutdown_1.gracefulShutdown.add(async () => {
        await new Promise((resolve) => {
            server.close((err) => {
                if (err) {
                    console.error('Error closing server:', err);
                }
                resolve(void 0);
            });
        });
        await db.close();
    });
}
main().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map