import { Request, Response, NextFunction } from 'express';
import AnalyticsService from '../services/AnalyticsService';

export class AnalyticsController {
  // GET /api/admin/analytics/site?days=30
  async getSiteAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const analytics = await AnalyticsService.getSiteAnalytics(days);
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/analytics/geography
  async getGeographyAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await AnalyticsService.getGeographyAnalytics();
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/analytics/devices
  async getDevicePlatformStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AnalyticsService.getDevicePlatformStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/analytics/traffic-sources
  async getTrafficSources(req: Request, res: Response, next: NextFunction) {
    try {
      const sources = await AnalyticsService.getTrafficSources();
      res.json({
        success: true,
        data: sources,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/analytics/session-duration?days=30
  async getAverageSessionDuration(req: Request, res: Response, next: NextFunction) {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const duration = await AnalyticsService.getAverageSessionDuration(days);
      res.json({
        success: true,
        data: duration,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/analytics/chat-duration-distribution
  async getChatDurationDistribution(req: Request, res: Response, next: NextFunction) {
    try {
      const distribution = await AnalyticsService.getChatDurationDistribution();
      res.json({
        success: true,
        data: distribution,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/analytics/peak-times?days=30
  async getPeakUsageTimes(req: Request, res: Response, next: NextFunction) {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const peakTimes = await AnalyticsService.getPeakUsageTimes(days);
      res.json({
        success: true,
        data: peakTimes,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/analytics/languages
  async getLanguageAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await AnalyticsService.getLanguageAnalytics();
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/analytics/gender
  async getGenderAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await AnalyticsService.getGenderAnalytics();
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/analytics/topics
  async getTopicAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await AnalyticsService.getTopicAnalytics();
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/analytics/user-age
  async getUserAgeAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await AnalyticsService.getUserAgeAnalytics();
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/analytics/gender-search
  async getGenderSearchAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await AnalyticsService.getGenderSearchAnalytics();
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/analytics/age-search
  async getAgeSearchAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await AnalyticsService.getAgeSearchAnalytics();
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/analytics/match-success?days=30
  async getMatchSuccessAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const analytics = await AnalyticsService.getMatchSuccessAnalytics(days);
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/analytics/conversation-quality?days=30
  async getConversationQualityMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const metrics = await AnalyticsService.getConversationQualityMetrics(days);
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/analytics/user-engagement?days=30
  async getUserEngagementMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const metrics = await AnalyticsService.getUserEngagementMetrics(days);
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/analytics/demographic-matching?days=30
  async getDemographicMatchingMatrix(req: Request, res: Response, next: NextFunction) {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const matrix = await AnalyticsService.getDemographicMatchingMatrix(days);
      res.json({
        success: true,
        data: matrix,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/analytics/rejection-report?days=30
  async getRejectionReportAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const analytics = await AnalyticsService.getRejectionReportAnalytics(days);
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/analytics/voice-vs-text?days=30
  async getVoiceVsTextAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const analytics = await AnalyticsService.getVoiceVsTextAnalytics(days);
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/analytics/activity-heatmap?days=30
  async getActivityHeatmapData(req: Request, res: Response, next: NextFunction) {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const data = await AnalyticsService.getActivityHeatmapData(days);
      res.json({
        success: true,
        data: data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AnalyticsController();

