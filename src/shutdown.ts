export type TShutdownTask = () => void;

class GracefulShutdown {
  private tasks: TShutdownTask[] = [];
  private readonly events = ["SIGTERM", "SIGINT", "SIGHUP", "SIGQUIT"];

  constructor() {
    this.setup();
  }

  add(task: TShutdownTask) {
    this.tasks.push(task);
  }

  private setup() {
    this.events.forEach((event) => {
      process.on(event, this.shutdown.bind(this, event));
    });
  }

  private async shutdown(event: string) {
    try {
      console.log(`Received ${event}, shutting down gracefully...`);
      await Promise.race([
        Promise.allSettled(this.tasks.map((task) => task())),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Shutdown timeout")), 10000)
        ),
      ]);
      console.log(`Shutdown complete after ${event} signal`);
      process.exit(0);
    } catch (error) {
      console.error("Error shutting down:", error);
      console.log(`Force closing server after ${event} signal`);
      process.exit(1);
    }
  }
}

export const gracefulShutdown = new GracefulShutdown();
