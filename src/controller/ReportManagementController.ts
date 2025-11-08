import { Request, Response, NextFunction } from 'express';
import ReportManagementService from '../services/ReportManagementService';

export class ReportManagementController {
  // GET /api/admin/reports?page=1&limit=20&reportedIp=&reporterIp=
  async getAllReports(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page,
        limit,
        dateFrom,
        dateTo,
        reportedIp,
        reporterIp,
        status,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await ReportManagementService.getAllReports({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        reportedIp: reportedIp as string,
        reporterIp: reporterIp as string,
        status: status as string,
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

  // GET /api/admin/reports/:reportId
  async getReportDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { reportId } = req.params;
      const details = await ReportManagementService.getReportDetails(reportId);
      res.json({
        success: true,
        data: details,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/reports/stats/overview?timeRange=week
  async getReportStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const timeRange = (req.query.timeRange as 'today' | 'week' | 'month') || 'week';
      const stats = await ReportManagementService.getReportStatistics(timeRange);
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/reports/recent?limit=50
  async getRecentReports(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const reports = await ReportManagementService.getRecentReports(limit);
      res.json({
        success: true,
        data: reports,
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/admin/reports/:reportId/status
  async updateReportStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { reportId } = req.params;
      const { status, adminNotes } = req.body;
      const adminId = (req as any).admin?.id || (req as any).admin?._id || 'admin';

      if (!status || !['pending', 'resolved'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Valid status (pending or resolved) is required',
        });
        return;
      }

      const result = await ReportManagementService.updateReportStatus(
        reportId,
        status,
        adminId,
        adminNotes
      );
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/admin/reports/:reportId
  async deleteReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { reportId } = req.params;
      const result = await ReportManagementService.deleteReport(reportId);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/reports/user/:ip?type=made|received
  async getReportsByUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { ip } = req.params;
      const type = (req.query.type as 'made' | 'received') || 'received';
      const reports = await ReportManagementService.getReportsByUser(ip, type);
      res.json({
        success: true,
        data: reports,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/reports/timeseries?days=30
  async getReportsOverTime(req: Request, res: Response, next: NextFunction) {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const data = await ReportManagementService.getReportsOverTime(days);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/admin/reports/bulk-delete
  async bulkDeleteReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportIds } = req.body;

      if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'reportIds array is required',
        });
        return;
      }

      const result = await ReportManagementService.bulkDeleteReports(reportIds);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ReportManagementController();

