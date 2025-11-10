import Report from '../models/Report';
import ChatSession from '../models/ChatSession';
import UserSession from '../models/UserSession';
import IPBan from '../models/IPBan';

export class ReportManagementService {
  async getAllReports(params: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    reportedIp?: string;
    reporterIp?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 20,
      dateFrom,
      dateTo,
      reportedIp,
      reporterIp,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const query: any = {};

    if (reportedIp) {
      query.reportedIp = reportedIp;
    }

    if (reporterIp) {
      query.reporterIp = reporterIp;
    }

    if (status) {
      query.status = status;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [reports, total] = await Promise.all([
      Report.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
      Report.countDocuments(query),
    ]);

    return {
      reports,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get report details
  async getReportDetails(reportId: string) {
    const report = await Report.findById(reportId).lean();

    if (!report) {
      throw new Error('Report not found');
    }

    // Get chat session details
    const chatSession = await ChatSession.findOne({
      sessionId: report.sessionId,
    }).lean();

    // Get reporter and reported user details
    const [reporter, reportedUser] = await Promise.all([
      UserSession.findOne({ ip: report.reporterIp }).lean(),
      UserSession.findOne({ ip: report.reportedIp }).lean(),
    ]);

    // Get previous reports by and against these users
    const [reportsByReporter, reportsAgainstReported] = await Promise.all([
      Report.find({ reporterIp: report.reporterIp })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Report.find({ reportedIp: report.reportedIp })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    return {
      report,
      chatSession,
      reporter,
      reportedUser,
      reporterHistory: {
        totalReportsMade: reportsByReporter.length,
        recentReports: reportsByReporter.slice(0, 5),
      },
      reportedUserHistory: {
        totalReportsReceived: reportsAgainstReported.length,
        recentReports: reportsAgainstReported.slice(0, 5),
      },
    };
  }

  // Get reports statistics
  async getReportStatistics(timeRange: 'today' | 'week' | 'month' = 'week') {
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
      totalReports,
      topReportedUsers,
      topReporters,
    ] = await Promise.all([
      Report.countDocuments({ createdAt: { $gte: startDate } }),
      Report.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$reportedIp',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Report.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$reporterIp',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return {
      totalReports,
      topReportedUsers: topReportedUsers.map((item) => ({
        ip: item._id,
        reportCount: item.count,
      })),
      topReporters: topReporters.map((item) => ({
        ip: item._id,
        reportCount: item.count,
      })),
      timeRange,
    };
  }

  // Get recent reports (for moderation queue)
  async getRecentReports(limit: number = 50) {
    const reports = await Report.find()
      .sort({ createdAt: -1 }) // Most recent first
      .limit(limit)
      .lean();

    // Enrich with user info
    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        const [chatSession, reporter, reportedUser] = await Promise.all([
          ChatSession.findOne({ sessionId: report.sessionId })
            .select('chatType startedAt messages')
            .lean(),
          UserSession.findOne({ ip: report.reporterIp })
            .select('preferences location')
            .lean(),
          UserSession.findOne({ ip: report.reportedIp })
            .select('preferences location')
            .lean(),
        ]);

        return {
          ...report,
          chatSession,
          reporter,
          reportedUser,
        };
      }),
    );

    return enrichedReports;
  }

  // Get reports by user IP
  async getReportsByUser(ip: string, type: 'made' | 'received' = 'received') {
    const query = type === 'made' ? { reporterIp: ip } : { reportedIp: ip };

    const reports = await Report.find(query).sort({ createdAt: -1 }).lean();

    return {
      type,
      ip,
      totalReports: reports.length,
      reports,
    };
  }

  // Get reports over time (for charts)
  async getReportsOverTime(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const reportsOverTime = await Report.aggregate([
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

    return {
      reportsOverTime: reportsOverTime.map((item) => ({
        date: item._id,
        count: item.count,
      })),
      period: `${days} days`,
    };
  }

  // Update report status
  async updateReportStatus(
    reportId: string,
    status: 'pending' | 'resolved',
    adminId: string,
    adminNotes?: string
  ) {
    const updateData: any = {
      status,
      resolvedBy: adminId,
    };

    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    }

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    const report = await Report.findByIdAndUpdate(
      reportId,
      updateData,
      { new: true }
    );

    if (!report) {
      throw new Error('Report not found');
    }

    return {
      success: true,
      message: `Report status updated to ${status}`,
      report,
    };
  }

  // Delete report (admin action)
  async deleteReport(reportId: string) {
    const result = await Report.findByIdAndDelete(reportId);
    
    if (!result) {
      throw new Error('Report not found');
    }

    return {
      success: true,
      message: 'Report deleted successfully',
    };
  }

  // Bulk delete reports
  async bulkDeleteReports(reportIds: string[]) {
    const result = await Report.deleteMany({
      _id: { $in: reportIds },
    });

    return {
      deletedCount: result.deletedCount,
      success: result.deletedCount > 0,
    };
  }

  // 🆕 Get grouped reports by uniqueUserId with count
  async getGroupedReports(params: {
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: 'reportCount' | 'lastReportedAt';
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 20,
      status,
      sortBy = 'reportCount',
      sortOrder = 'desc',
    } = params;

    const matchStage: any = {};
    if (status) {
      matchStage.status = status;
    }

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $group: {
          _id: '$reportedUniqueUserId',
          reportedIp: { $first: '$reportedIp' }, // Keep IP for reference
          reportCount: { $sum: 1 },
          lastReportedAt: { $max: '$createdAt' },
          firstReportedAt: { $min: '$createdAt' },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          resolvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
          },
          reportIds: { $push: '$_id' },
          messages: { $push: '$message' },
        },
      },
      {
        $sort: {
          [sortBy === 'reportCount' ? 'reportCount' : 'lastReportedAt']:
            sortOrder === 'asc' ? 1 : -1,
        },
      },
    ];

    // Get total count
    const totalPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = await Report.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Add pagination
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: limit });

    const groupedReports = await Report.aggregate(pipeline);

    // Check if each uniqueUserId is banned
    const userIdList = groupedReports.map((group) => group._id).filter(id => id);
    const bans = await IPBan.find({
      uniqueUserId: { $in: userIdList },
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).lean();

    const banMap = new Map(bans.map((ban) => [ban.uniqueUserId, ban]));

    const enrichedReports = groupedReports.map((group) => ({
      uniqueUserId: group._id,
      reportedIp: group.reportedIp, // Include IP for display
      reportCount: group.reportCount,
      pendingCount: group.pendingCount,
      resolvedCount: group.resolvedCount,
      lastReportedAt: group.lastReportedAt,
      firstReportedAt: group.firstReportedAt,
      isBanned: banMap.has(group._id),
      banDetails: banMap.get(group._id) || null,
    }));

    return {
      groupedReports: enrichedReports,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 🆕 Get all reports for a specific uniqueUserId with messages
  async getReportsByUniqueUserId(uniqueUserId: string) {
    const reports = await Report.find({ reportedUniqueUserId: uniqueUserId })
      .sort({ createdAt: -1 })
      .lean();

    if (reports.length === 0) {
      throw new Error('No reports found for this user');
    }

    // Get all chat sessions for these reports
    const sessionIds = reports.map((r) => r.sessionId);
    const chatSessions = await ChatSession.find({
      sessionId: { $in: sessionIds },
    }).lean();

    const sessionMap = new Map(
      chatSessions.map((session) => [session.sessionId, session]),
    );

    // Get user info (use the first report's IP as fallback)
    const reportedIp = reports[0].reportedIp;
    const reportedUser = reportedIp ? await UserSession.findOne({ ip: reportedIp }).lean() : null;

    // Check if user is currently banned
    const activeBan = await IPBan.findOne({
      uniqueUserId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).lean();

    // Enrich reports with chat messages
    const enrichedReports = reports.map((report) => {
      const session = sessionMap.get(report.sessionId);
      return {
        ...report,
        chatMessages: session?.messages || [],
        chatType: session?.chatType,
        sessionStartedAt: session?.startedAt,
        sessionEndedAt: session?.endedAt,
      };
    });

    return {
      uniqueUserId,
      reportedIp,
      reportedUser,
      totalReports: reports.length,
      reports: enrichedReports,
      isBanned: !!activeBan,
      activeBan,
    };
  }

  // 🆕 Ban a user by uniqueUserId
  async banUser(params: {
    uniqueUserId: string;
    ip?: string; // Optional: for reference
    adminId: string;
    banDuration: number; // in minutes
    reason?: string;
    reportedIp?: string;
    relatedReportIds?: string[];
  }) {
    const { uniqueUserId, ip, adminId, banDuration, reason, reportedIp, relatedReportIds } =
      params;

    // Check if user is already banned and active
    const existingBan = await IPBan.findOne({
      uniqueUserId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (existingBan) {
      throw new Error('User is already banned');
    }

    const bannedAt = new Date();
    const expiresAt = new Date(bannedAt.getTime() + banDuration * 60 * 1000);

    const ban = await IPBan.create({
      uniqueUserId,
      ip: ip || '', // Store IP for reference if provided
      bannedBy: adminId,
      reason,
      banDuration,
      bannedAt,
      expiresAt,
      isActive: true,
      reportedIp,
      relatedReportIds,
    });

    return {
      success: true,
      message: 'User banned successfully',
      ban,
    };
  }

  async checkIPBanStatus(uniqueUserId: string) {
    const now = new Date();

    // Find active ban
    const activeBan = await IPBan.findOne({
      uniqueUserId,
      isActive: true,
      expiresAt: { $gt: now },
    }).lean();

    if (!activeBan) {
      return {
        isBanned: false,
        userId: uniqueUserId,
      };
    }

    // Calculate time remaining
    const timeLeftMs = activeBan.expiresAt.getTime() - now.getTime();
    const timeLeftSeconds = Math.floor(timeLeftMs / 1000);
    const timeLeftMinutes = Math.floor(timeLeftSeconds / 60);
    const timeLeftHours = Math.floor(timeLeftMinutes / 60);
    const timeLeftDays = Math.floor(timeLeftHours / 24);

    let timeLeftFormatted: string;
    if (timeLeftDays > 0) {
      timeLeftFormatted = `${timeLeftDays} day${timeLeftDays > 1 ? 's' : ''}`;
    } else if (timeLeftHours > 0) {
      timeLeftFormatted = `${timeLeftHours} hour${timeLeftHours > 1 ? 's' : ''}`;
    } else if (timeLeftMinutes > 0) {
      timeLeftFormatted = `${timeLeftMinutes} minute${timeLeftMinutes > 1 ? 's' : ''}`;
    } else {
      timeLeftFormatted = `${timeLeftSeconds} second${timeLeftSeconds > 1 ? 's' : ''}`;
    }

    return {
      isBanned: true,
      userId:uniqueUserId,
      banDetails: {
        bannedAt: activeBan.bannedAt,
        expiresAt: activeBan.expiresAt,
        reason: activeBan.reason,
        bannedBy: activeBan.bannedBy,
        timeLeftSeconds,
        timeLeftMinutes,
        timeLeftFormatted,
      },
    };
  }

  // 🆕 Get all active bans
  async getActiveBans(params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;

    const query = {
      isActive: true,
      expiresAt: { $gt: new Date() },
    };

    const skip = (page - 1) * limit;

    const [bans, total] = await Promise.all([
      IPBan.find(query).sort({ bannedAt: -1 }).skip(skip).limit(limit).lean(),
      IPBan.countDocuments(query),
    ]);

    return {
      bans,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 🆕 Unban an IP
  async unbanIP(uniqueUserId: string, adminId: string) {
    const ban = await IPBan.findOneAndUpdate(
      { uniqueUserId, isActive: true, expiresAt: { $gt: new Date() } },
      { isActive: false },
      { new: true },
    );

    if (!ban) {
      throw new Error('No active ban found for this user');
    }

    return {
      success: true,
      message: 'IP unbanned successfully',
      ban,
    };
  }
}

export default new ReportManagementService();

