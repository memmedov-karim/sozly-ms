import ChatSession from '../models/ChatSession';
import UserSession from '../models/UserSession';
import Report from '../models/Report';
import SiteUsage from '../models/SiteUsage';

import { DatabaseConfig } from '../config/database';

export class DashboardService {
  // 🧭 1. Dashboard Overview
  async getOverviewStats(
    timeRange: 'today' | 'week' | 'month' | 'custom' = 'today',
    customStartDate?: string,
    customEndDate?: string
  ) {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (timeRange === 'custom' && customStartDate && customEndDate) {
      // Parse custom date range
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      // Set end date to end of day
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Predefined time ranges
      switch (timeRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }
    }

    // Get online users from Redis
    const redisClient = DatabaseConfig.getInstance().getRedisClient();
    let onlineUsers = 0;
    
    if (redisClient && redisClient.isOpen) {
      try {
        const onlineUsersData = await redisClient.get('online_users');
        onlineUsers = onlineUsersData ? parseInt(onlineUsersData, 10) : 0;
      } catch (error) {
        console.error('Error getting online users from Redis:', error);
        // Fallback to MongoDB if Redis fails
        onlineUsers = await UserSession.countDocuments({ isOnline: true });
      }
    } else {
      // Fallback to MongoDB if Redis is not connected
      onlineUsers = await UserSession.countDocuments({ isOnline: true });
    }

    // Build date filter based on time range
    const dateFilter = timeRange === 'custom' && customStartDate && customEndDate
      ? { createdAt: { $gte: startDate, $lte: endDate } }
      : { createdAt: { $gte: startDate } };

    const [
      totalUsers,
      activeChats,
      totalChats,
      totalMessages,
      pendingReports,
      totalReports,
    ] = await Promise.all([
      UserSession.countDocuments(dateFilter),
      ChatSession.countDocuments({ status: 'connected' }),
      ChatSession.countDocuments(dateFilter),
      ChatSession.aggregate([
        { $match: dateFilter },
        { $unwind: '$messages' },
        { $count: 'totalMessages' },
      ]),
      Report.countDocuments(dateFilter),
      Report.countDocuments(),
    ]);

    // Calculate average chat duration
    const durationMatchFilter = timeRange === 'custom' && customStartDate && customEndDate
      ? {
          status: 'ended',
          duration: { $exists: true },
          createdAt: { $gte: startDate, $lte: endDate },
        }
      : {
          status: 'ended',
          duration: { $exists: true },
          createdAt: { $gte: startDate },
        };

    const chatDurations = await ChatSession.aggregate([
      {
        $match: durationMatchFilter,
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$duration' },
          maxDuration: { $max: '$duration' },
          minDuration: { $min: '$duration' },
        },
      },
    ]);

    // Get recent activities
    const recentChats = await ChatSession.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('sessionId users startedAt endedAt status chatType duration');

    const recentReports = await Report.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('reporterIp reportedIp message createdAt');

    return {
      overview: {
        totalUsers,
        onlineUsers,
        activeChats,
        totalChats,
        totalMessages: totalMessages[0]?.totalMessages || 0,
        pendingReports,
        totalReports,
        averageChatDuration: chatDurations[0]?.avgDuration || 0,
        maxChatDuration: chatDurations[0]?.maxDuration || 0,
        minChatDuration: chatDurations[0]?.minDuration || 0,
      },
      recentActivity: {
        recentChats,
        recentReports,
      },
      timeRange,
      generatedAt: new Date(),
    };
  }

  // Server load statistics
  async getServerLoadStats() {
    // Get online users from Redis
    const redisClient = DatabaseConfig.getInstance().getRedisClient();
    let activeConnections = 0;
    
    if (redisClient && redisClient.isOpen) {
      try {
        const onlineUsersData = await redisClient.get('online_users');
        activeConnections = onlineUsersData ? parseInt(onlineUsersData, 10) : 0;
      } catch (error) {
        console.error('Error getting online users from Redis:', error);
        activeConnections = await UserSession.countDocuments({ isOnline: true });
      }
    } else {
      activeConnections = await UserSession.countDocuments({ isOnline: true });
    }

    const [memoryUsage, chatsByStatus] = await Promise.all([
      SiteUsage.find({ metricType: 'memory' })
        .sort({ createdAt: -1 })
        .limit(100),
      ChatSession.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return {
      memoryUsage: memoryUsage.map((m) => ({
        value: m.count,
        timestamp: m.timestamp,
      })),
      activeConnections,
      chatsByStatus: chatsByStatus.reduce(
        (acc, item) => {
          acc[item._id] = item.count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      timestamp: new Date(),
    };
  }

  // Daily/Weekly analytics for charts
  async getTimeSeriesData(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [chatsOverTime, usersOverTime, reportsOverTime] = await Promise.all([
      ChatSession.aggregate([
        {
          $match: { createdAt: { $gte: startDate } },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      UserSession.aggregate([
        {
          $match: { createdAt: { $gte: startDate } },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Report.aggregate([
        {
          $match: { createdAt: { $gte: startDate } },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return {
      chatsOverTime: chatsOverTime.map((item) => ({
        date: item._id,
        count: item.count,
      })),
      usersOverTime: usersOverTime.map((item) => ({
        date: item._id,
        count: item.count,
      })),
      reportsOverTime: reportsOverTime.map((item) => ({
        date: item._id,
        count: item.count,
      })),
      period: `${days} days`,
    };
  }
}

export default new DashboardService();

