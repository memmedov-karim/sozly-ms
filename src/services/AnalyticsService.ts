import ChatSession from '../models/ChatSession';
import UserSession from '../models/UserSession';
import Report from '../models/Report';
import SiteUsage from '../models/SiteUsage';

export class AnalyticsService {
  // 📊 Get comprehensive site analytics
  async getSiteAnalytics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      newUsersOverTime,
      chatActivityOverTime,
      messageVolumeOverTime,
      userRetention,
    ] = await Promise.all([
      this.getNewUsersOverTime(startDate),
      this.getChatActivityOverTime(startDate),
      this.getMessageVolumeOverTime(startDate),
      this.getUserRetention(startDate),
    ]);

    return {
      newUsersOverTime,
      chatActivityOverTime,
      messageVolumeOverTime,
      userRetention,
      period: `${days} days`,
      generatedAt: new Date(),
    };
  }

  // New users by date
  private async getNewUsersOverTime(startDate: Date) {
    const newUsers = await UserSession.aggregate([
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
    ]);

    return newUsers.map((item) => ({
      date: item._id,
      count: item.count,
    }));
  }

  // Chat activity over time
  private async getChatActivityOverTime(startDate: Date) {
    const chatActivity = await ChatSession.aggregate([
      {
        $match: { createdAt: { $gte: startDate } },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    return chatActivity.map((item) => ({
      date: item._id.date,
      status: item._id.status,
      count: item.count,
    }));
  }

  // Message volume over time
  private async getMessageVolumeOverTime(startDate: Date) {
    const messageVolume = await ChatSession.aggregate([
      {
        $match: { createdAt: { $gte: startDate }, messages: { $exists: true } },
      },
      {
        $project: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          messageCount: { $size: { $ifNull: ['$messages', []] } },
        },
      },
      {
        $group: {
          _id: '$date',
          totalMessages: { $sum: '$messageCount' },
          avgMessagesPerChat: { $avg: '$messageCount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return messageVolume.map((item) => ({
      date: item._id,
      totalMessages: item.totalMessages,
      avgMessagesPerChat: Math.round(item.avgMessagesPerChat * 100) / 100,
    }));
  }

  // User retention analysis
  private async getUserRetention(startDate: Date) {
    const users = await UserSession.find({
      createdAt: { $gte: startDate },
    })
      .select('ip createdAt lastSeen')
      .lean();

    const returningUsers = users.filter((user: any) => {
      const daysSinceJoined =
        (new Date(user.lastSeen).getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceJoined > 1; // Returned after at least 1 day
    });

    return {
      totalNewUsers: users.length,
      returningUsers: returningUsers.length,
      retentionRate:
        users.length > 0 ? Math.round((returningUsers.length / users.length) * 100) : 0,
    };
  }

  // Geography analytics
  async getGeographyAnalytics() {
    const [usersByCountry, chatsByCountry, onlineByCountry] = await Promise.all([
      UserSession.aggregate([
        {
          $group: {
            _id: '$location.country',
            totalUsers: { $sum: 1 },
          },
        },
        { $sort: { totalUsers: -1 } },
      ]),
      ChatSession.aggregate([
        { $unwind: '$users' },
        {
          $lookup: {
            from: 'usersessions',
            localField: 'users.ip',
            foreignField: 'ip',
            as: 'userInfo',
          },
        },
        { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$userInfo.location.country',
            totalChats: { $sum: 1 },
          },
        },
        { $sort: { totalChats: -1 } },
      ]),
      UserSession.aggregate([
        {
          $match: { isOnline: true },
        },
        {
          $group: {
            _id: '$location.country',
            onlineUsers: { $sum: 1 },
          },
        },
        { $sort: { onlineUsers: -1 } },
      ]),
    ]);

    // Merge the data
    const countryMap = new Map();

    usersByCountry.forEach((item) => {
      const country = item._id || 'Unknown';
      countryMap.set(country, {
        country,
        totalUsers: item.totalUsers,
        totalChats: 0,
        onlineUsers: 0,
      });
    });

    chatsByCountry.forEach((item) => {
      const country = item._id || 'Unknown';
      if (countryMap.has(country)) {
        countryMap.get(country).totalChats = item.totalChats;
      } else {
        countryMap.set(country, {
          country,
          totalUsers: 0,
          totalChats: item.totalChats,
          onlineUsers: 0,
        });
      }
    });

    onlineByCountry.forEach((item) => {
      const country = item._id || 'Unknown';
      if (countryMap.has(country)) {
        countryMap.get(country).onlineUsers = item.onlineUsers;
      } else {
        countryMap.set(country, {
          country,
          totalUsers: 0,
          totalChats: 0,
          onlineUsers: item.onlineUsers,
        });
      }
    });

    return Array.from(countryMap.values()).sort((a, b) => b.totalUsers - a.totalUsers);
  }

  // Device and platform statistics
  async getDevicePlatformStats() {
    // Note: You'll need to track device/platform in UserSession model
    // For now, returning mock structure based on user agent parsing
    const sessions = await UserSession.find()
      .select('ip createdAt')
      .limit(1000)
      .lean();

    // This is a placeholder - you'd need to implement device detection
    return {
      platforms: {
        web: Math.floor(sessions.length * 0.6),
        ios: Math.floor(sessions.length * 0.25),
        android: Math.floor(sessions.length * 0.15),
      },
      browsers: {
        chrome: Math.floor(sessions.length * 0.5),
        safari: Math.floor(sessions.length * 0.3),
        firefox: Math.floor(sessions.length * 0.15),
        other: Math.floor(sessions.length * 0.05),
      },
      note: 'Device tracking needs to be implemented in UserSession model',
    };
  }

  // Traffic sources (placeholder for future implementation)
  async getTrafficSources() {
    // This would require tracking referrer information
    return {
      sources: {
        direct: 0,
        search: 0,
        social: 0,
        referral: 0,
      },
      note: 'Traffic source tracking needs to be implemented',
    };
  }

  // Average session duration
  async getAverageSessionDuration(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sessions = await UserSession.find({
      createdAt: { $gte: startDate },
    })
      .select('joinedAt lastSeen')
      .lean();

    const durations = sessions.map(
      (session) =>
        (session.lastSeen.getTime() - session.joinedAt.getTime()) / (1000 * 60), // minutes
    );

    const avgDuration =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

    return {
      averageDurationMinutes: Math.round(avgDuration * 100) / 100,
      totalSessions: sessions.length,
      period: `${days} days`,
    };
  }

  // Chat duration distribution
  async getChatDurationDistribution() {
    const chats = await ChatSession.find({
      status: 'ended',
      duration: { $exists: true },
    })
      .select('duration')
      .lean();

    const distribution = {
      '0-1min': 0,
      '1-5min': 0,
      '5-15min': 0,
      '15-30min': 0,
      '30min+': 0,
    };

    chats.forEach((chat) => {
      const minutes = (chat.duration || 0) / 60;
      if (minutes < 1) distribution['0-1min']++;
      else if (minutes < 5) distribution['1-5min']++;
      else if (minutes < 15) distribution['5-15min']++;
      else if (minutes < 30) distribution['15-30min']++;
      else distribution['30min+']++;
    });

    return {
      distribution,
      totalChats: chats.length,
    };
  }

  // Peak usage times
  async getPeakUsageTimes(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [hourlyDistribution, dayOfWeekDistribution] = await Promise.all([
      UserSession.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $hour: '$createdAt' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      UserSession.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dayOfWeek: '$createdAt' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return {
      byHour: hourlyDistribution.map((item) => ({
        hour: item._id,
        count: item.count,
      })),
      byDayOfWeek: dayOfWeekDistribution.map((item) => ({
        day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
          item._id - 1
        ],
        dayNumber: item._id,
        count: item.count,
      })),
      period: `${days} days`,
    };
  }

  // Language preferences analytics
  async getLanguageAnalytics() {
    const [languagePreferences, languageByChat] = await Promise.all([
      UserSession.aggregate([
        { $unwind: '$preferences.language' },
        {
          $group: {
            _id: '$preferences.language',
            userCount: { $sum: 1 },
          },
        },
        { $sort: { userCount: -1 } },
      ]),
      ChatSession.aggregate([
        { $unwind: '$language' },
        {
          $group: {
            _id: '$language',
            chatCount: { $sum: 1 },
          },
        },
        { $sort: { chatCount: -1 } },
      ]),
    ]);

    return {
      byUserPreference: languagePreferences.map((item) => ({
        language: item._id,
        userCount: item.userCount,
      })),
      byChat: languageByChat.map((item) => ({
        language: item._id,
        chatCount: item.chatCount,
      })),
    };
  }

  // Gender distribution analytics
  async getGenderAnalytics() {
    const [genderDistribution, genderPreferences, activeByGender] = await Promise.all([
      UserSession.aggregate([
        {
          $group: {
            _id: '$preferences.gender',
            count: { $sum: 1 },
          },
        },
      ]),
      UserSession.aggregate([
        {
          $group: {
            _id: {
              gender: '$preferences.gender',
              preferredGender: '$preferences.preferredGender',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      UserSession.aggregate([
        {
          $match: { isOnline: true },
        },
        {
          $group: {
            _id: '$preferences.gender',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return {
      genderDistribution: genderDistribution.reduce(
        (acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      genderPreferences: genderPreferences.map((item) => ({
        gender: item._id.gender,
        preferredGender: item._id.preferredGender,
        count: item.count,
      })),
      activeByGender: activeByGender.reduce(
        (acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  // Topic analytics
  async getTopicAnalytics() {
    const [topicsByUser, topicsByChat] = await Promise.all([
      UserSession.aggregate([
        { $unwind: '$preferences.topics' },
        {
          $group: {
            _id: '$preferences.topics',
            userCount: { $sum: 1 },
          },
        },
        { $sort: { userCount: -1 } },
      ]),
      ChatSession.aggregate([
        { $unwind: '$topics' },
        {
          $group: {
            _id: '$topics',
            chatCount: { $sum: 1 },
          },
        },
        { $sort: { chatCount: -1 } },
      ]),
    ]);

    return {
      byUserPreference: topicsByUser.map((item) => ({
        topic: item._id,
        userCount: item.userCount,
      })),
      byChat: topicsByChat.map((item) => ({
        topic: item._id,
        chatCount: item.chatCount,
      })),
    };
  }
}

export default new AnalyticsService();

