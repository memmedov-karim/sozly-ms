export declare class DatabaseConfig {
    private static instance;
    private constructor();
    static getInstance(): DatabaseConfig;
    connectMongoDB(): Promise<void>;
    private closeMongoDB;
    close(): Promise<void>;
}
//# sourceMappingURL=database.d.ts.map