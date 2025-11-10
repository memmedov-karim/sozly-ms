import { Request, Response, NextFunction } from 'express';
import ReportManagementService from '../services/ReportManagementService';
import { getClientIp } from '../utils/ip';

export class IPBanController {
  async checkIPBan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get uniqueUserId from cookies
      const userId = req.cookies['sozly:x-user-id'];
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'Could not determine unique user ID',
        });
        return;
      }

      const result = await ReportManagementService.checkIPBanStatus(userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkSpecificUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { uniqueUserId } = req.params;

      if (!uniqueUserId) {
        res.status(400).json({
          success: false,
          message: 'Unique User ID is required',
        });
        return;
      }

      const result = await ReportManagementService.checkIPBanStatus(uniqueUserId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new IPBanController();

