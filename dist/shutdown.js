"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gracefulShutdown = void 0;
class GracefulShutdown {
    constructor() {
        this.tasks = [];
        this.events = ["SIGTERM", "SIGINT", "SIGHUP", "SIGQUIT"];
        this.setup();
    }
    add(task) {
        this.tasks.push(task);
    }
    setup() {
        this.events.forEach((event) => {
            process.on(event, this.shutdown.bind(this, event));
        });
    }
    async shutdown(event) {
        try {
            console.log(`Received ${event}, shutting down gracefully...`);
            await Promise.race([
                Promise.allSettled(this.tasks.map((task) => task())),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Shutdown timeout")), 10000)),
            ]);
            console.log(`Shutdown complete after ${event} signal`);
            process.exit(0);
        }
        catch (error) {
            console.error("Error shutting down:", error);
            console.log(`Force closing server after ${event} signal`);
            process.exit(1);
        }
    }
}
exports.gracefulShutdown = new GracefulShutdown();
//# sourceMappingURL=shutdown.js.map