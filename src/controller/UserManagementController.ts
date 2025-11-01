import { Request, Response, NextFunction } from 'express';
import UserManagementService from '../services/UserManagementService';

export class UserManagementController {
  // GET /api/admin/users?page=1&limit=20&search=&isOnline=true&country=&gender=
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page,
        limit,
        search,
        isOnline,
        country,
        gender,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await UserManagementService.getAllUsers({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        isOnline: isOnline === 'true' ? true : isOnline === 'false' ? false : undefined,
        country: country as string,
        gender: gender as string,
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

  // GET /api/admin/users/:identifier
  async getUserProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier } = req.params;
      const profile = await UserManagementService.getUserProfile(identifier);
      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/users/online/stats
  async getOnlineUsersStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await UserManagementService.getOnlineUsersStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/users/:ip/activity?days=30
  async getUserActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { ip } = req.params;
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const activity = await UserManagementService.getUserActivity(ip, days);
      res.json({
        success: true,
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/users/location/distribution
  async getUsersByLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const distribution = await UserManagementService.getUsersByLocation();
      res.json({
        success: true,
        data: distribution,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/users/stats/summary
  async getUserStatsSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await UserManagementService.getUserStatsSummary();
      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserManagementController();

