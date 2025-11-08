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
    
    // Map frontend field names to database field names
    const fieldMapping: any = {
      'startTime': 'startedAt',
      'messageCount': 'messageCount' // handled specially
    };
    
    const dbSortField = fieldMapping[sortBy] || sortBy;
    
    // Handle messageCount sorting specially since it's a computed field
    const needsAggregation = sortBy === 'messageCount';
    
    if (!needsAggregation) {
      sortOptions[dbSortField] = sortOrder === 'asc' ? 1 : -1;
    }

    let chats: any[];
    let total: number;

    // Always use aggregation pipeline to calculate messageCount and map field names
    const baseAggregationStages: any[] = [
      { $match: query },
      {
        $addFields: {
          messageCount: {
            $cond: {
              if: { $isArray: '$messages' },
              then: { $size: '$messages' },
              else: 0
            }
          },
          startTime: '$startedAt', // Map startedAt to startTime for frontend
          userIp: { $arrayElemAt: ['$users.ip', 0] }, // Get first user's IP
          isActive: { $eq: ['$status', 'connected'] } // Map status to isActive
        }
      }
    ];

    if (needsAggregation) {
      // Sort by message count
      const aggregationPipeline: any[] = [
        ...baseAggregationStages,
        { $sort: { messageCount: sortOrder === 'asc' ? 1 : -1 } },
        { $skip: skip },
        { $limit: limit }
      ];

      [chats, total] = await Promise.all([
        ChatSession.aggregate(aggregationPipeline),
        ChatSession.countDocuments(query),
      ]);
    } else {
      // Sort by other fields
      const aggregationPipeline: any[] = [
        ...baseAggregationStages,
        { $sort: sortOptions },
        { $skip: skip },
        { $limit: limit }
      ];

      [chats, total] = await Promise.all([
        ChatSession.aggregate(aggregationPipeline),
        ChatSession.countDocuments(query),
      ]);
    }

    // Populate country information for all chats from UserSession
    const chatsWithCountry = await Promise.all(
      chats.map(async (chat: any) => {
        const userIps = chat.users.map((u: any) => u.ip);
        const users = await UserSession.find({
          ip: { $in: userIps },
        }).lean();
        
        // Get the first user's country for display
        const country = users.length > 0 && users[0].location?.country 
          ? users[0].location.country 
          : 'Unknown';
        
        return {
          ...chat,
          country,
        };
      })
    );

    // If country filter is specified, filter by user location
    let filteredChats = chatsWithCountry;
    if (country) {
      filteredChats = chatsWithCountry.filter((chat: any) => 
        chat.country && chat.country.toLowerCase() === country.toLowerCase()
      );
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

  // 📊 Get detailed analytics for a specific chat
  async getChatMessageAnalytics(sessionId: string) {
    const chat = await ChatSession.findOne({ sessionId })
      .select('messages users sessionId chatType startedAt endedAt duration status')
      .lean();

    if (!chat) {
      throw new Error('Chat not found');
    }

    const messages = chat.messages || [];
    
    if (messages.length === 0) {
      return {
        sessionId: chat.sessionId,
        chatType: chat.chatType,
        status: chat.status,
        totalMessages: 0,
        overview: {
          chatDuration: chat.duration || 0,
          startedAt: chat.startedAt,
          endedAt: chat.endedAt,
          totalMessages: 0,
          users: chat.users,
        },
        messageStatistics: {},
        timingAnalysis: {},
        userEngagement: {},
        conversationFlow: [],
        contentAnalysis: {},
      };
    }

    // Sort messages by timestamp
    const sortedMessages = [...messages].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // 1. MESSAGE STATISTICS
    const messageStats = {
      total: messages.length,
      byUser: {} as Record<string, number>,
      averageLength: 0,
      totalCharacters: 0,
      longestMessage: { length: 0, from: '', text: '', timestamp: new Date() },
      shortestMessage: { length: Infinity, from: '', text: '', timestamp: new Date() },
    };

    messages.forEach((msg) => {
      // Count by user
      messageStats.byUser[msg.from] = (messageStats.byUser[msg.from] || 0) + 1;
      
      // Character count
      const msgLength = msg.text?.length || 0;
      messageStats.totalCharacters += msgLength;
      
      // Longest/shortest
      if (msgLength > messageStats.longestMessage.length) {
        messageStats.longestMessage = {
          length: msgLength,
          from: msg.from,
          text: msg.text,
          timestamp: msg.timestamp,
        };
      }
      if (msgLength < messageStats.shortestMessage.length && msgLength > 0) {
        messageStats.shortestMessage = {
          length: msgLength,
          from: msg.from,
          text: msg.text,
          timestamp: msg.timestamp,
        };
      }
    });

    messageStats.averageLength = messageStats.totalCharacters / messages.length;

    // 2. TIMING ANALYSIS (Time differences between messages)
    const timingAnalysis = {
      averageResponseTime: 0, // in seconds
      responseTimeByUser: {} as Record<string, { total: number; count: number; average: number }>,
      longestGap: { duration: 0, from: null as any, to: null as any },
      shortestGap: { duration: Infinity, from: null as any, to: null as any },
      totalGaps: 0,
      messagesPerMinute: 0,
      messagesPerHour: 0,
      messageIntervals: [] as number[], // All intervals in seconds
    };

    let totalResponseTime = 0;
    let responseCount = 0;

    for (let i = 1; i < sortedMessages.length; i++) {
      const prevMsg = sortedMessages[i - 1];
      const currMsg = sortedMessages[i];
      
      const timeDiff = (new Date(currMsg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime()) / 1000; // seconds
      
      timingAnalysis.messageIntervals.push(timeDiff);
      
      // Track gaps
      if (timeDiff > timingAnalysis.longestGap.duration) {
        timingAnalysis.longestGap = {
          duration: timeDiff,
          from: prevMsg,
          to: currMsg,
        };
      }
      
      if (timeDiff < timingAnalysis.shortestGap.duration && timeDiff > 0) {
        timingAnalysis.shortestGap = {
          duration: timeDiff,
          from: prevMsg,
          to: currMsg,
        };
      }
      
      // Calculate response time (when different users reply to each other)
      if (prevMsg.from !== currMsg.from) {
        totalResponseTime += timeDiff;
        responseCount++;
        
        // Track per user
        if (!timingAnalysis.responseTimeByUser[currMsg.from]) {
          timingAnalysis.responseTimeByUser[currMsg.from] = {
            total: 0,
            count: 0,
            average: 0,
          };
        }
        timingAnalysis.responseTimeByUser[currMsg.from].total += timeDiff;
        timingAnalysis.responseTimeByUser[currMsg.from].count++;
      }
    }

    // Calculate averages
    if (responseCount > 0) {
      timingAnalysis.averageResponseTime = totalResponseTime / responseCount;
    }

    // Calculate average response time per user
    Object.keys(timingAnalysis.responseTimeByUser).forEach((userId) => {
      const userData = timingAnalysis.responseTimeByUser[userId];
      userData.average = userData.total / userData.count;
    });

    // Calculate message frequency
    if (chat.startedAt && chat.endedAt) {
      const chatDurationMs = new Date(chat.endedAt).getTime() - new Date(chat.startedAt).getTime();
      const chatDurationMinutes = chatDurationMs / (1000 * 60);
      const chatDurationHours = chatDurationMinutes / 60;
      
      timingAnalysis.messagesPerMinute = messages.length / chatDurationMinutes;
      timingAnalysis.messagesPerHour = messages.length / chatDurationHours;
    }

    timingAnalysis.totalGaps = timingAnalysis.messageIntervals.length;

    // 3. USER ENGAGEMENT ANALYSIS
    const userEngagement = {
      firstMessage: sortedMessages[0],
      lastMessage: sortedMessages[sortedMessages.length - 1],
      initiator: sortedMessages[0].from,
      closer: sortedMessages[sortedMessages.length - 1].from,
      dominance: {} as Record<string, number>, // Percentage of messages per user
      responseRate: {} as Record<string, number>, // How fast each user responds on average
      averageMessageLengthByUser: {} as Record<string, number>,
      participationScore: {} as Record<string, { messages: number; characters: number; percentage: number }>,
    };

    // Calculate dominance (% of messages)
    Object.keys(messageStats.byUser).forEach((userId) => {
      userEngagement.dominance[userId] = (messageStats.byUser[userId] / messages.length) * 100;
    });

    // Calculate average message length and participation per user
    const userCharacters: Record<string, number> = {};
    messages.forEach((msg) => {
      userCharacters[msg.from] = (userCharacters[msg.from] || 0) + (msg.text?.length || 0);
    });

    Object.keys(messageStats.byUser).forEach((userId) => {
      userEngagement.averageMessageLengthByUser[userId] = 
        userCharacters[userId] / messageStats.byUser[userId];
      
      userEngagement.participationScore[userId] = {
        messages: messageStats.byUser[userId],
        characters: userCharacters[userId],
        percentage: (messageStats.byUser[userId] / messages.length) * 100,
      };
    });

    // Response rate from timing analysis
    Object.keys(timingAnalysis.responseTimeByUser).forEach((userId) => {
      userEngagement.responseRate[userId] = timingAnalysis.responseTimeByUser[userId].average;
    });

    // 4. CONVERSATION FLOW (Timeline of activity)
    const conversationFlow: any[] = [];
    
    // Group messages by time windows (e.g., 5-minute intervals)
    const timeWindowMinutes = 5;
    let currentWindow: any = null;
    
    sortedMessages.forEach((msg, idx) => {
      const msgTime = new Date(msg.timestamp).getTime();
      
      if (!currentWindow) {
        currentWindow = {
          startTime: msg.timestamp,
          endTime: new Date(msgTime + timeWindowMinutes * 60 * 1000),
          messages: [msg],
          messageCount: 1,
          users: new Set([msg.from]),
        };
      } else {
        const windowEndTime = new Date(currentWindow.endTime).getTime();
        
        if (msgTime <= windowEndTime) {
          // Add to current window
          currentWindow.messages.push(msg);
          currentWindow.messageCount++;
          currentWindow.users.add(msg.from);
        } else {
          // Save current window and start new one
          conversationFlow.push({
            startTime: currentWindow.startTime,
            endTime: currentWindow.endTime,
            messageCount: currentWindow.messageCount,
            users: Array.from(currentWindow.users),
            intensity: currentWindow.messageCount / timeWindowMinutes, // messages per minute
          });
          
          currentWindow = {
            startTime: msg.timestamp,
            endTime: new Date(msgTime + timeWindowMinutes * 60 * 1000),
            messages: [msg],
            messageCount: 1,
            users: new Set([msg.from]),
          };
        }
      }
      
      // Push last window
      if (idx === sortedMessages.length - 1 && currentWindow) {
        conversationFlow.push({
          startTime: currentWindow.startTime,
          endTime: currentWindow.endTime,
          messageCount: currentWindow.messageCount,
          users: Array.from(currentWindow.users),
          intensity: currentWindow.messageCount / timeWindowMinutes,
        });
      }
    });

    // 5. CONTENT ANALYSIS
    const contentAnalysis = {
      totalWords: 0,
      averageWordsPerMessage: 0,
      wordsByUser: {} as Record<string, number>,
      messageDistribution: {
        veryShort: 0,  // < 10 chars
        short: 0,       // 10-50 chars
        medium: 0,      // 50-150 chars
        long: 0,        // 150-300 chars
        veryLong: 0,    // > 300 chars
      },
    };

    messages.forEach((msg) => {
      const text = msg.text || '';
      const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
      
      contentAnalysis.totalWords += wordCount;
      contentAnalysis.wordsByUser[msg.from] = (contentAnalysis.wordsByUser[msg.from] || 0) + wordCount;
      
      // Categorize by length
      const length = text.length;
      if (length < 10) contentAnalysis.messageDistribution.veryShort++;
      else if (length < 50) contentAnalysis.messageDistribution.short++;
      else if (length < 150) contentAnalysis.messageDistribution.medium++;
      else if (length < 300) contentAnalysis.messageDistribution.long++;
      else contentAnalysis.messageDistribution.veryLong++;
    });

    contentAnalysis.averageWordsPerMessage = contentAnalysis.totalWords / messages.length;

    return {
      sessionId: chat.sessionId,
      chatType: chat.chatType,
      status: chat.status,
      overview: {
        chatDuration: chat.duration || 0,
        startedAt: chat.startedAt,
        endedAt: chat.endedAt,
        totalMessages: messages.length,
        users: chat.users,
      },
      messageStatistics: messageStats,
      timingAnalysis: {
        ...timingAnalysis,
        averageResponseTimeFormatted: this.formatDuration(timingAnalysis.averageResponseTime),
        longestGapFormatted: this.formatDuration(timingAnalysis.longestGap.duration),
        shortestGapFormatted: this.formatDuration(timingAnalysis.shortestGap.duration),
      },
      userEngagement,
      conversationFlow,
      contentAnalysis,
    };
  }

  // Helper function to format duration
  private formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  }
}

export default new ChatManagementService();

