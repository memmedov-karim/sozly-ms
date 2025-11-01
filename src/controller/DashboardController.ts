import { Request, Response, NextFunction } from 'express';
import DashboardService from '../services/DashboardService';

export class DashboardController {
  // GET /api/admin/dashboard/overview?timeRange=today|week|month|custom&startDate=2024-01-01&endDate=2024-01-31
  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const timeRange = (req.query.timeRange as 'today' | 'week' | 'month' | 'custom') || 'today';
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      const stats = await DashboardService.getOverviewStats(timeRange, startDate, endDate);
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/dashboard/server-load
  async getServerLoad(req: Request, res: Response, next: NextFunction) {
    try {
      const serverLoad = await DashboardService.getServerLoadStats();
      res.json({
        success: true,
        data: serverLoad,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/dashboard/timeseries?days=7
  async getTimeSeries(req: Request, res: Response, next: NextFunction) {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const data = await DashboardService.getTimeSeriesData(days);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DashboardController();

