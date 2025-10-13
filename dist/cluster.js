"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cluster_1 = __importDefault(require("cluster"));
const os_1 = __importDefault(require("os"));
// Limit workers to avoid overwhelming Redis with too many connections
// Each worker creates 5 Redis connections (1 main + 2 adapter + 2 pub/sub)
const MAX_WORKERS = 4; // Reasonable limit for most use cases
const numCPUs = Math.min(os_1.default.cpus().length, MAX_WORKERS);
// Delay between worker starts to avoid connection storms
const WORKER_START_DELAY = 500; // milliseconds
if (cluster_1.default.isPrimary) {
    console.log(`Master ${process.pid} is running`);
    console.log(`Starting ${numCPUs} workers (out of ${os_1.default.cpus().length} CPUs available)...`);
    // Start workers with staggered delays to prevent Redis connection storms
    for (let i = 0; i < numCPUs; i++) {
        setTimeout(() => {
            cluster_1.default.fork();
            console.log(`Started worker ${i + 1}/${numCPUs}`);
        }, i * WORKER_START_DELAY);
    }
    cluster_1.default.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died (code: ${code}, signal: ${signal}). Restarting in 2s...`);
        // Add delay before restarting to avoid rapid restart loops
        setTimeout(() => {
            cluster_1.default.fork();
        }, 2000);
    });
    process.on('SIGTERM', () => {
        console.log('Master received SIGTERM, shutting down gracefully');
        for (const id in cluster_1.default.workers) {
            cluster_1.default.workers[id]?.kill();
        }
        process.exit(0);
    });
}
else {
    require('./server');
    console.log(`Worker ${process.pid} started`);
}
//# sourceMappingURL=cluster.js.map