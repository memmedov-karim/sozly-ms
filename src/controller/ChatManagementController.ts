import { Request, Response, NextFunction } from 'express';
import ChatManagementService from '../services/ChatManagementService';

export class ChatManagementController {
  // GET /api/admin/chats?page=1&limit=20&status=&chatType=&language=&country=
  async getAllChats(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page,
        limit,
        status,
        chatType,
        language,
        country,
        dateFrom,
        dateTo,
        minDuration,
        maxDuration,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await ChatManagementService.getAllChats({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as string,
        chatType: chatType as string,
        language: language as string,
        country: country as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        minDuration: minDuration ? parseInt(minDuration as string) : undefined,
        maxDuration: maxDuration ? parseInt(maxDuration as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/chats/:sessionId
  async getChatDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const details = await ChatManagementService.getChatDetails(sessionId);
      res.json({
        success: true,
        data: details,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/chats/stats/overview?timeRange=week
  async getChatStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const timeRange = (req.query.timeRange as 'today' | 'week' | 'month') || 'week';
      const stats = await ChatManagementService.getChatStatistics(timeRange);
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/chats/country/distribution
  async getChatsByCountry(req: Request, res: Response, next: NextFunction) {
    try {
      const distribution = await ChatManagementService.getChatsByCountry();
      res.json({
        success: true,
        data: distribution,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/chats/peak-hours?days=7
  async getChatPeakHours(req: Request, res: Response, next: NextFunction) {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const peakHours = await ChatManagementService.getChatPeakHours(days);
      res.json({
        success: true,
        data: peakHours,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/chats/active
  async getActiveChats(req: Request, res: Response, next: NextFunction) {
    try {
      const activeChats = await ChatManagementService.getActiveChats();
      res.json({
        success: true,
        data: activeChats,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/chats/:sessionId/messages
  async getChatMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const messages = await ChatManagementService.getChatMessages(sessionId);
      res.json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/chats/:sessionId/analytics
  async getChatMessageAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const analytics = await ChatManagementService.getChatMessageAnalytics(sessionId);
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ChatManagementController();

