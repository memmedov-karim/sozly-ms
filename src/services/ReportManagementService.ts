import Report from '../models/Report';
import ChatSession from '../models/ChatSession';
import UserSession from '../models/UserSession';

export class ReportManagementService {
  // 🚨 Get all reports with pagination and filters
  async getAllReports(params: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    reportedIp?: string;
    reporterIp?: string;
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
}

export default new ReportManagementService();

