import ChatSession from '../models/ChatSession';
import UserSession from '../models/UserSession';

export class ChatManagementService {
  // 💬 Get all chats with pagination and filters
  async getAllChats(params: {
    page?: number;
    limit?: number;
    status?: string;
    chatType?: string;
    language?: string;
    country?: string;
    dateFrom?: string;
    dateTo?: string;
    minDuration?: number;
    maxDuration?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 20,
      status,
      chatType,
      language,
      country,
      dateFrom,
      dateTo,
      minDuration,
      maxDuration,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (chatType) {
      query.chatType = chatType;
    }

    if (language) {
      query.language = language;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    if (minDuration !== undefined || maxDuration !== undefined) {
      query.duration = {};
      if (minDuration !== undefined) query.duration.$gte = minDuration;
      if (maxDuration !== undefined) query.duration.$lte = maxDuration;
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [chats, total] = await Promise.all([
      ChatSession.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      ChatSession.countDocuments(query),
    ]);

    // If country filter is specified, filter by user location
    let filteredChats = chats;
    if (country) {
      const chatsWithLocation = await Promise.all(
        chats.map(async (chat) => {
          const userIps = chat.users.map((u) => u.ip);
          const users = await UserSession.find({
            ip: { $in: userIps },
            'location.country': country,
          });
          return users.length > 0 ? chat : null;
        }),
      );
      filteredChats = chatsWithLocation.filter((c) => c !== null) as any[];
    }

    return {
      chats: filteredChats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get chat details by sessionId
  async getChatDetails(sessionId: string) {
    const chat = await ChatSession.findOne({ sessionId }).lean();

    if (!chat) {
      throw new Error('Chat not found');
    }

    // Get user details for this chat
    const userIps = chat.users.map((u) => u.ip);
    const users = await UserSession.find({ ip: { $in: userIps } }).lean();

    return {
      chat,
      users,
    };
  }

  // Get chat statistics
  async getChatStatistics(timeRange: 'today' | 'week' | 'month' = 'week') {
    const now = new Date();
    let startDate = new Date();

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

    const [
      totalChats,
      activeChats,
      chatsByStatus,
      chatsByType,
      chatsByLanguage,
      averageDuration,
      messageStats,
    ] = await Promise.all([
      ChatSession.countDocuments({ createdAt: { $gte: startDate } }),
      ChatSession.countDocuments({ status: 'connected' }),
      ChatSession.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      ChatSession.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$chatType',
            count: { $sum: 1 },
          },
        },
      ]),
      ChatSession.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $unwind: '$language' },
        {
          $group: {
            _id: '$language',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      ChatSession.aggregate([
        {
          $match: {
            status: 'ended',
            duration: { $exists: true },
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: null,
            avgDuration: { $avg: '$duration' },
            maxDuration: { $max: '$duration' },
            minDuration: { $min: '$duration' },
            totalDuration: { $sum: '$duration' },
          },
        },
      ]),
      ChatSession.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $project: {
            messageCount: {
              $cond: {
                if: { $isArray: '$messages' },
                then: { $size: '$messages' },
                else: 0,
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalMessages: { $sum: '$messageCount' },
            avgMessagesPerChat: { $avg: '$messageCount' },
          },
        },
      ]),
    ]);

    return {
      totalChats,
      activeChats,
      statusDistribution: chatsByStatus.reduce(
        (acc, item) => {
          acc[item._id] = item.count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      typeDistribution: chatsByType.reduce(
        (acc, item) => {
          acc[item._id] = item.count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      languageDistribution: chatsByLanguage.map((item) => ({
        language: item._id,
        count: item.count,
      })),
      durationStats: {
        average: averageDuration[0]?.avgDuration || 0,
        max: averageDuration[0]?.maxDuration || 0,
        min: averageDuration[0]?.minDuration || 0,
        total: averageDuration[0]?.totalDuration || 0,
      },
      messageStats: {
        total: messageStats[0]?.totalMessages || 0,
        averagePerChat: messageStats[0]?.avgMessagesPerChat || 0,
      },
      timeRange,
    };
  }

  // Get chats by country
  async getChatsByCountry() {
    // Get all chats
    const chats = await ChatSession.find().select('users createdAt').lean();

    // Get unique IPs
    const allIps = new Set<string>();
    chats.forEach((chat) => {
      chat.users.forEach((user) => allIps.add(user.ip));
    });

    // Get user locations
    const users = await UserSession.find({
      ip: { $in: Array.from(allIps) },
    })
      .select('ip location')
      .lean();

    const ipToCountry = new Map<string, string>();
    users.forEach((user) => {
      if (user.location?.country) {
        ipToCountry.set(user.ip, user.location.country);
      }
    });

    // Count chats by country
    const countryStats: Record<string, number> = {};
    chats.forEach((chat) => {
      chat.users.forEach((user) => {
        const country = ipToCountry.get(user.ip) || 'Unknown';
        countryStats[country] = (countryStats[country] || 0) + 1;
      });
    });

    return Object.entries(countryStats)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Get peak hours for chats
  async getChatPeakHours(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const hourlyDistribution = await ChatSession.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dayOfWeekDistribution = await ChatSession.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
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

  // Get active chats (currently connected)
  async getActiveChats() {
    const activeChats = await ChatSession.find({ status: 'connected' })
      .sort({ startedAt: -1 })
      .lean();

    // Get user info for active chats
    const allIps = new Set<string>();
    activeChats.forEach((chat) => {
      chat.users.forEach((user) => allIps.add(user.ip));
    });

    const users = await UserSession.find({
      ip: { $in: Array.from(allIps) },
    }).lean();

    const ipToUser = new Map();
    users.forEach((user) => {
      ipToUser.set(user.ip, user);
    });

    const enrichedChats = activeChats.map((chat) => ({
      ...chat,
      users: chat.users.map((user) => ({
        ...user,
        details: ipToUser.get(user.ip),
      })),
      currentDuration: chat.startedAt
        ? Math.floor((Date.now() - chat.startedAt.getTime()) / 1000)
        : 0,
    }));

    return enrichedChats;
  }

  // Get chat messages by sessionId
  async getChatMessages(sessionId: string) {
    const chat = await ChatSession.findOne({ sessionId })
      .select('messages users sessionId chatType startedAt endedAt')
      .lean();

    if (!chat) {
      throw new Error('Chat not found');
    }

    return {
      sessionId: chat.sessionId,
      chatType: chat.chatType,
      startedAt: chat.startedAt,
      endedAt: chat.endedAt,
      messages: chat.messages || [],
      totalMessages: chat.messages?.length || 0,
    };
  }
}

export default new ChatManagementService();

