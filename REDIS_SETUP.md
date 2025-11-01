# Redis Integration for Online Users Count

## What's Been Updated

### 1. Redis Configuration (`src/config/redis.ts`)
- Created Redis client configuration
- Automatic connection and error handling
- Graceful shutdown support

### 2. Database Config (`src/config/database.ts`)
- Integrated Redis connection with MongoDB
- Added `connectRedis()` method
- Added `getRedisClient()` method for accessing Redis
- Graceful shutdown for both MongoDB and Redis

### 3. Server (`src/server.ts`)
- Redis connection is now initialized on server start
- Proper cleanup on shutdown

### 4. Dashboard Service (`src/services/DashboardService.ts`)
- **Online users count now comes from Redis key `online_users`**
- Fallback to MongoDB if Redis is unavailable
- Used in both:
  - `getOverviewStats()` - Dashboard overview
  - `getServerLoadStats()` - Server load statistics

## Environment Variables

Add to your `.env` file:

```env
REDIS_URL=redis://localhost:6379
```

Or for production with authentication:

```env
REDIS_URL=redis://username:password@your-redis-host:6379
```

## How It Works

1. The Dashboard API requests online users count
2. Service tries to get value from Redis key `online_users`
3. If Redis is available: Returns the Redis value
4. If Redis is unavailable: Falls back to MongoDB query
5. This ensures the admin panel always shows data

## Redis Key Structure

```
Key: online_users
Type: String
Value: Number (e.g., "42")
```

Your application should update this key when:
- A user connects (increment)
- A user disconnects (decrement)
- Using `INCR` and `DECR` commands for atomic operations

## Example: Updating Online Users

```typescript
// When user connects
await redisClient.incr('online_users');

// When user disconnects
await redisClient.decr('online_users');

// Set directly
await redisClient.set('online_users', '100');

// Get current count
const count = await redisClient.get('online_users');
```

## Testing

### Start Redis locally:
```bash
# Using Docker
docker run -d -p 6379:6379 redis:latest

# Or using Homebrew (macOS)
brew install redis
brew services start redis
```

### Test the connection:
```bash
redis-cli
> SET online_users 50
> GET online_users
```

### Start your server:
```bash
npm run dev
```

You should see:
```
Redis client connecting...
Redis client ready
Redis connected successfully
```

## Benefits

✅ **Performance**: Redis is much faster than MongoDB for counters
✅ **Real-time**: Instant updates without database lag
✅ **Scalability**: Redis handles high-frequency updates easily
✅ **Reliability**: Falls back to MongoDB if Redis is down

## Next Steps

Make sure your WebSocket/Socket.IO server updates the `online_users` key in Redis when users connect/disconnect.

Example in your socket connection handler:
```typescript
io.on('connection', async (socket) => {
  // Increment online users
  await redisClient.incr('online_users');
  
  socket.on('disconnect', async () => {
    // Decrement online users
    await redisClient.decr('online_users');
  });
});
```
