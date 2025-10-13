export type TShutdownTask = () => void;
declare class GracefulShutdown {
    private tasks;
    private readonly events;
    constructor();
    add(task: TShutdownTask): void;
    private setup;
    private shutdown;
}
export declare const gracefulShutdown: GracefulShutdown;
export {};
//# sourceMappingURL=shutdown.d.ts.map