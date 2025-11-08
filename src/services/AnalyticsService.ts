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

  // User age analytics
  async getUserAgeAnalytics() {
    const users = await UserSession.aggregate([
      {
        $match: {
          'preferences.age.min': { $exists: true },
          'preferences.age.max': { $exists: true },
        },
      },
      {
        $project: {
          avgAge: {
            $avg: ['$preferences.age.min', '$preferences.age.max'],
          },
          ageRange: {
            min: '$preferences.age.min',
            max: '$preferences.age.max',
          },
          isOnline: 1,
        },
      },
    ]);

    // Calculate age distribution
    const ageDistribution = {
      '18-21': 0,
      '22-25': 0,
      '26-29': 0,
      '30-100': 0,
    };

    const onlineAgeDistribution = {
      '18-21': 0,
      '22-25': 0,
      '26-29': 0,
      '30-100': 0,
    };

    users.forEach((user) => {
      const age = Math.round(user.avgAge);
      let category: string;

      if (age >= 18 && age <= 21) category = '18-21';
      else if (age >= 22 && age <= 25) category = '22-25';
      else if (age >= 26 && age <= 29) category = '26-29';
      else if (age >= 30) category = '30-100';
      else return; // Skip ages below 18

      ageDistribution[category as keyof typeof ageDistribution]++;
      
      if (user.isOnline) {
        onlineAgeDistribution[category as keyof typeof onlineAgeDistribution]++;
      }
    });

    // Calculate average age
    const totalAge = users.reduce((sum, user) => sum + user.avgAge, 0);
    const averageAge = users.length > 0 ? Math.round((totalAge / users.length) * 10) / 10 : 0;

    return {
      ageDistribution,
      onlineAgeDistribution,
      averageAge,
      totalUsers: users.length,
      onlineUsers: users.filter((u) => u.isOnline).length,
    };
  }

  // Gender search preferences analytics (what genders users are looking for)
  async getGenderSearchAnalytics() {
    const [preferredGenderDistribution, preferencesByUserGender, onlinePreferences] = await Promise.all([
      // Overall preferred gender distribution
      UserSession.aggregate([
        {
          $group: {
            _id: '$preferences.preferredGender',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      // What genders are users looking for, grouped by their own gender
      UserSession.aggregate([
        {
          $group: {
            _id: {
              userGender: '$preferences.gender',
              searchingFor: '$preferences.preferredGender',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      // Online users' preferred gender
      UserSession.aggregate([
        {
          $match: { isOnline: true },
        },
        {
          $group: {
            _id: '$preferences.preferredGender',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return {
      preferredGenderDistribution: preferredGenderDistribution.reduce(
        (acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      preferencesByUserGender: preferencesByUserGender.map((item) => ({
        userGender: item._id.userGender,
        searchingFor: item._id.searchingFor,
        count: item.count,
      })),
      onlinePreferences: onlinePreferences.reduce(
        (acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  // Age search preferences analytics (what age ranges users are searching for)
  async getAgeSearchAnalytics() {
    const users = await UserSession.find({
      'preferences.preferredAgeRange': { $exists: true, $ne: [] },
    })
      .select('preferences.preferredAgeRange preferences.age isOnline')
      .lean();

    // Initialize age distribution categories
    const ageSearchDistribution = {
      '18-21': 0,
      '22-25': 0,
      '26-29': 0,
      '30-100': 0,
    };

    const onlineAgeSearchDistribution = {
      '18-21': 0,
      '22-25': 0,
      '26-29': 0,
      '30-100': 0,
    };

    const byUserAge = {
      '18-21': { '18-21': 0, '22-25': 0, '26-29': 0, '30-100': 0 },
      '22-25': { '18-21': 0, '22-25': 0, '26-29': 0, '30-100': 0 },
      '26-29': { '18-21': 0, '22-25': 0, '26-29': 0, '30-100': 0 },
      '30-100': { '18-21': 0, '22-25': 0, '26-29': 0, '30-100': 0 },
    };

    const categorizeAge = (age: number): string => {
      if (age >= 18 && age <= 21) return '18-21';
      else if (age >= 22 && age <= 25) return '22-25';
      else if (age >= 26 && age <= 29) return '26-29';
      else if (age >= 30) return '30-100';
      return '';
    };

    users.forEach((user: any) => {
      // Get user's own age category
      const userAvgAge = (user.preferences.age.min + user.preferences.age.max) / 2;
      const userAgeCategory = categorizeAge(Math.round(userAvgAge));

      // Process each preferred age range
      user.preferences.preferredAgeRange.forEach((range: { min: number; max: number }) => {
        // For each age in the range, categorize it
        for (let age = range.min; age <= range.max; age++) {
          const category = categorizeAge(age);
          if (category) {
            ageSearchDistribution[category as keyof typeof ageSearchDistribution]++;
            
            if (user.isOnline) {
              onlineAgeSearchDistribution[category as keyof typeof onlineAgeSearchDistribution]++;
            }

            // Track by user's age category
            if (userAgeCategory) {
              byUserAge[userAgeCategory as keyof typeof byUserAge][category as keyof typeof ageSearchDistribution]++;
            }
          }
        }
      });
    });

    return {
      ageSearchDistribution,
      onlineAgeSearchDistribution,
      byUserAge,
      totalUsers: users.length,
      onlineUsers: users.filter((u) => u.isOnline).length,
    };
  }

  // 🎯 Match Success Analytics - Most important metric!
  async getMatchSuccessAnalytics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [statusDistribution, rejectionAnalysis, matchQuality] = await Promise.all([
      // Overall match status distribution
      ChatSession.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      // Rejection patterns
      ChatSession.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: 'rejected',
            rejectedBy: { $exists: true },
          },
        },
        {
          $group: {
            _id: null,
            totalRejections: { $sum: 1 },
            avgTimeToReject: {
              $avg: {
                $subtract: [
                  { $ifNull: ['$endedAt', new Date()] },
                  '$startedAt',
                ],
              },
            },
          },
        },
      ]),
      // Match quality (duration + messages)
      ChatSession.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: 'ended',
            duration: { $exists: true },
          },
        },
        {
          $group: {
            _id: null,
            avgDuration: { $avg: '$duration' },
            avgMessages: { $avg: { $size: { $ifNull: ['$messages', []] } } },
            totalCompleted: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalMatches = statusDistribution.reduce((sum, item) => sum + item.count, 0);
    const statusBreakdown = statusDistribution.reduce(
      (acc, item) => {
        acc[item._id] = {
          count: item.count,
          percentage: totalMatches > 0 ? (item.count / totalMatches) * 100 : 0,
        };
        return acc;
      },
      {} as Record<string, { count: number; percentage: number }>,
    );

    return {
      totalMatches,
      statusBreakdown,
      successRate:
        statusBreakdown.connected?.percentage || statusBreakdown.ended?.percentage || 0,
      rejectionRate: statusBreakdown.rejected?.percentage || 0,
      rejectionAnalysis: rejectionAnalysis[0] || {
        totalRejections: 0,
        avgTimeToReject: 0,
      },
      matchQuality: matchQuality[0] || {
        avgDuration: 0,
        avgMessages: 0,
        totalCompleted: 0,
      },
      period: `${days} days`,
    };
  }

  // 📊 Conversation Quality Metrics
  async getConversationQualityMetrics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const qualityMetrics = await ChatSession.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['connected', 'ended'] },
          messages: { $exists: true },
        },
      },
      {
        $project: {
          messageCount: { $size: { $ifNull: ['$messages', []] } },
          duration: { $ifNull: ['$duration', 0] },
          chatType: 1,
          hasMessages: { $gt: [{ $size: { $ifNull: ['$messages', []] } }, 0] },
        },
      },
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                avgMessages: { $avg: '$messageCount' },
                avgDuration: { $avg: '$duration' },
                totalChats: { $sum: 1 },
                chatsWithMessages: {
                  $sum: { $cond: ['$hasMessages', 1, 0] },
                },
              },
            },
          ],
          byChatType: [
            {
              $group: {
                _id: '$chatType',
                avgMessages: { $avg: '$messageCount' },
                avgDuration: { $avg: '$duration' },
                count: { $sum: 1 },
              },
            },
          ],
          messageDistribution: [
            {
              $bucket: {
                groupBy: '$messageCount',
                boundaries: [0, 1, 5, 10, 20, 50, 100],
                default: '100+',
                output: {
                  count: { $sum: 1 },
                },
              },
            },
          ],
        },
      },
    ]);

    return {
      overall: qualityMetrics[0]?.overall[0] || {},
      byChatType: qualityMetrics[0]?.byChatType || [],
      messageDistribution: qualityMetrics[0]?.messageDistribution || [],
      period: `${days} days`,
    };
  }

  // 🔄 User Engagement & Retention Metrics
  async getUserEngagementMetrics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const now = new Date();

    const [activeUsers, repeatUsers, matchFrequency] = await Promise.all([
      // Daily/Weekly/Monthly Active Users
      UserSession.aggregate([
        {
          $facet: {
            dau: [
              {
                $match: {
                  lastSeen: {
                    $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
                  },
                },
              },
              { $count: 'count' },
            ],
            wau: [
              {
                $match: {
                  lastSeen: {
                    $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                  },
                },
              },
              { $count: 'count' },
            ],
            mau: [
              {
                $match: {
                  lastSeen: {
                    $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
                  },
                },
              },
              { $count: 'count' },
            ],
          },
        },
      ]),
      // Repeat users (came back after first session)
      UserSession.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $project: {
            isRepeatUser: {
              $gt: [
                { $subtract: ['$lastSeen', '$joinedAt'] },
                24 * 60 * 60 * 1000, // More than 1 day
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            repeatUsers: {
              $sum: { $cond: ['$isRepeatUser', 1, 0] },
            },
          },
        },
      ]),
      // Match frequency
      UserSession.aggregate([
        {
          $match: {
            matchHistory: { $exists: true, $ne: [] },
          },
        },
        {
          $project: {
            matchCount: { $size: { $ifNull: ['$matchHistory', []] } },
          },
        },
        {
          $group: {
            _id: null,
            avgMatchesPerUser: { $avg: '$matchCount' },
            totalUsersWithMatches: { $sum: 1 },
          },
        },
      ]),
    ]);

    const engagement = activeUsers[0] || {};
    const retention = repeatUsers[0] || { totalUsers: 0, repeatUsers: 0 };
    const frequency = matchFrequency[0] || { avgMatchesPerUser: 0, totalUsersWithMatches: 0 };

    return {
      activeUsers: {
        dau: engagement.dau?.[0]?.count || 0,
        wau: engagement.wau?.[0]?.count || 0,
        mau: engagement.mau?.[0]?.count || 0,
      },
      retention: {
        totalUsers: retention.totalUsers,
        repeatUsers: retention.repeatUsers,
        retentionRate:
          retention.totalUsers > 0
            ? (retention.repeatUsers / retention.totalUsers) * 100
            : 0,
      },
      matchFrequency: {
        avgMatchesPerUser: Math.round(frequency.avgMatchesPerUser * 100) / 100,
        totalUsersWithMatches: frequency.totalUsersWithMatches,
      },
      period: `${days} days`,
    };
  }

  // 👥 Demographic Matching Success Matrix
  async getDemographicMatchingMatrix(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const matchingData = await ChatSession.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['connected', 'ended'] },
          users: { $size: 2 },
        },
      },
      {
        $lookup: {
          from: 'usersessions',
          localField: 'users.ip',
          foreignField: 'ip',
          as: 'userDetails',
        },
      },
      {
        $match: {
          'userDetails.1': { $exists: true },
        },
      },
      {
        $project: {
          user1Gender: { $arrayElemAt: ['$userDetails.preferences.gender', 0] },
          user2Gender: { $arrayElemAt: ['$userDetails.preferences.gender', 1] },
          user1Age: {
            $avg: [
              { $arrayElemAt: ['$userDetails.preferences.age.min', 0] },
              { $arrayElemAt: ['$userDetails.preferences.age.max', 0] },
            ],
          },
          user2Age: {
            $avg: [
              { $arrayElemAt: ['$userDetails.preferences.age.min', 1] },
              { $arrayElemAt: ['$userDetails.preferences.age.max', 1] },
            ],
          },
          duration: 1,
          messageCount: { $size: { $ifNull: ['$messages', []] } },
          status: 1,
        },
      },
      {
        $group: {
          _id: {
            genderPair: {
              $concat: ['$user1Gender', '_', '$user2Gender'],
            },
          },
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          avgMessages: { $avg: '$messageCount' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return {
      genderPairings: matchingData,
      totalMatchedPairs: matchingData.reduce((sum, item) => sum + item.count, 0),
      period: `${days} days`,
    };
  }

  // ⚠️ Rejection & Report Analytics
  async getRejectionReportAnalytics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [rejections, reports, topReported] = await Promise.all([
      // Rejection analysis
      ChatSession.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: 'rejected',
          },
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
      // Report statistics
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
      // Most reported users
      Report.aggregate([
        {
          $match: { createdAt: { $gte: startDate } },
        },
        {
          $group: {
            _id: '$reportedIp',
            reportCount: { $sum: 1 },
          },
        },
        { $sort: { reportCount: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return {
      rejectionsOverTime: rejections.map((item) => ({
        date: item._id,
        count: item.count,
      })),
      reportsOverTime: reports.map((item) => ({
        date: item._id,
        count: item.count,
      })),
      topReportedUsers: topReported,
      totalRejections: rejections.reduce((sum, item) => sum + item.count, 0),
      totalReports: reports.reduce((sum, item) => sum + item.count, 0),
      period: `${days} days`,
    };
  }

  // 🎙️ Voice vs Text Analytics
  async getVoiceVsTextAnalytics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const comparison = await ChatSession.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['connected', 'ended'] },
        },
      },
      {
        $group: {
          _id: '$chatType',
          count: { $sum: 1 },
          avgDuration: { $avg: { $ifNull: ['$duration', 0] } },
          avgMessages: { $avg: { $size: { $ifNull: ['$messages', []] } } },
          completionRate: {
            $avg: {
              $cond: [{ $eq: ['$status', 'ended'] }, 1, 0],
            },
          },
        },
      },
    ]);

    return {
      comparison,
      period: `${days} days`,
    };
  }

  // 🔥 Real-Time Activity Heatmap Data
  async getActivityHeatmapData(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const heatmapData = await UserSession.aggregate([
      {
        $match: { createdAt: { $gte: startDate } },
      },
      {
        $group: {
          _id: {
            hour: { $hour: '$createdAt' },
            dayOfWeek: { $dayOfWeek: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } },
    ]);

    return {
      heatmap: heatmapData.map((item) => ({
        hour: item._id.hour,
        dayOfWeek: item._id.dayOfWeek,
        count: item.count,
      })),
      period: `${days} days`,
    };
  }
}

export default new AnalyticsService();

