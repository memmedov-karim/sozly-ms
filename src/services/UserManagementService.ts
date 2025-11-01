import UserSession from '../models/UserSession';
import ChatSession from '../models/ChatSession';
import Report from '../models/Report';

export class UserManagementService {
  // 👥 Get all users with pagination and filters
  async getAllUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    isOnline?: boolean;
    country?: string;
    gender?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 20,
      search,
      isOnline,
      country,
      gender,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const query: any = {};

    if (isOnline !== undefined) {
      query.isOnline = isOnline;
    }

    if (country) {
      query['location.country'] = country;
    }

    if (gender) {
      query['preferences.gender'] = gender;
    }

    if (search) {
      query.$or = [
        { ip: { $regex: search, $options: 'i' } },
        { socketId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      UserSession.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      UserSession.countDocuments(query),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get user profile details by IP or socketId
  async getUserProfile(identifier: string) {
    const user = await UserSession.findOne({
      $or: [{ ip: identifier }, { socketId: identifier }],
    }).lean();

    if (!user) {
      throw new Error('User not found');
    }

    // Get user's chat history
    const chatHistory = await ChatSession.find({
      'users.ip': user.ip,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Get reports about this user
    const reportsAgainst = await Report.find({
      reportedIp: user.ip,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Get reports made by this user
    const reportsMade = await Report.find({
      reporterIp: user.ip,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate statistics
    const totalChats = chatHistory.length;
    const completedChats = chatHistory.filter((c) => c.status === 'ended').length;
    const averageChatDuration =
      chatHistory.reduce((acc, chat) => acc + (chat.duration || 0), 0) / (completedChats || 1);

    return {
      user,
      stats: {
        totalChats,
        completedChats,
        rejectedChats: chatHistory.filter((c) => c.status === 'rejected').length,
        averageChatDuration: Math.round(averageChatDuration),
        reportsReceived: reportsAgainst.length,
        reportsMade: reportsMade.length,
      },
      chatHistory: chatHistory.slice(0, 20), // Return recent 20 chats
      reportsAgainst: reportsAgainst.slice(0, 10),
      reportsMade: reportsMade.slice(0, 10),
    };
  }

  // Get online users statistics
  async getOnlineUsersStats() {
    const onlineUsers = await UserSession.find({ isOnline: true }).lean();

    const genderDistribution = onlineUsers.reduce(
      (acc, user) => {
        const gender = user.preferences.gender;
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const countryDistribution = onlineUsers.reduce(
      (acc, user) => {
        const country = user.location?.country || 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total: onlineUsers.length,
      genderDistribution,
      countryDistribution,
      recentUsers: onlineUsers.slice(0, 50),
    };
  }

  // Get user activity by IP
  async getUserActivity(ip: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [sessions, chats, reports] = await Promise.all([
      UserSession.find({
        ip,
        createdAt: { $gte: startDate },
      })
        .sort({ createdAt: -1 })
        .lean(),
      ChatSession.find({
        'users.ip': ip,
        createdAt: { $gte: startDate },
      })
        .sort({ createdAt: -1 })
        .lean(),
      Report.find({
        $or: [{ reporterIp: ip }, { reportedIp: ip }],
        createdAt: { $gte: startDate },
      })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // Activity by day
    const activityByDay = chats.reduce(
      (acc, chat: any) => {
        const date = new Date(chat.createdAt).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      sessions,
      chats,
      reports,
      activityByDay: Object.entries(activityByDay).map(([date, count]) => ({
        date,
        count,
      })),
      summary: {
        totalSessions: sessions.length,
        totalChats: chats.length,
        totalReports: reports.length,
        period: `${days} days`,
      },
    };
  }

  // Get users by location
  async getUsersByLocation() {
    const users = await UserSession.aggregate([
      {
        $group: {
          _id: {
            country: '$location.country',
            region: '$location.region',
          },
          count: { $sum: 1 },
          onlineCount: {
            $sum: { $cond: [{ $eq: ['$isOnline', true] }, 1, 0] },
          },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return users.map((item) => ({
      country: item._id.country || 'Unknown',
      region: item._id.region || 'Unknown',
      totalUsers: item.count,
      onlineUsers: item.onlineCount,
    }));
  }

  // Get user statistics summary
  async getUserStatsSummary() {
    const [
      totalUsers,
      onlineUsers,
      genderStats,
      locationStats,
      newUsersToday,
      newUsersWeek,
    ] = await Promise.all([
      UserSession.countDocuments(),
      UserSession.countDocuments({ isOnline: true }),
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
            _id: '$location.country',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      UserSession.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      }),
      UserSession.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    return {
      totalUsers,
      onlineUsers,
      offlineUsers: totalUsers - onlineUsers,
      newUsersToday,
      newUsersWeek,
      genderDistribution: genderStats.reduce(
        (acc, item) => {
          acc[item._id] = item.count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      topCountries: locationStats.map((item) => ({
        country: item._id || 'Unknown',
        count: item.count,
      })),
    };
  }
}

export default new UserManagementService();

