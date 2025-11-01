import { createClient } from 'redis';

export class RedisConfig {
  private static instance: RedisConfig;
  private client: ReturnType<typeof createClient> | null = null;

  private constructor() {}

  static getInstance(): RedisConfig {
    if (!RedisConfig.instance) {
      RedisConfig.instance = new RedisConfig();
    }
    return RedisConfig.instance;
  }

  async connect(): Promise<void> {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://:20012912M.s@213.199.33.9:6379',
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error', err);
      });

      this.client.on('connect', () => {
        console.log('Redis client connecting...');
      });

      this.client.on('ready', () => {
        console.log('Redis client ready');
      });

      await this.client.connect();
      console.log('Redis connected successfully');
    } catch (error) {
      console.error('Redis connection error:', error);
      console.warn('Continuing without Redis connection...');
    }
  }

  getClient() {
    return this.client;
  }

  async close(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
        console.log('Redis connection closed');
      }
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
  }
}

export default RedisConfig;

