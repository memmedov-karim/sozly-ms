import { Request, Response, NextFunction } from 'express';
import ReportManagementService from '../services/ReportManagementService';
import { getClientIp } from '../utils/ip';

export class IPBanController {
  // 🆕 GET /api/ip-ban/check - Public endpoint to check if IP is banned
  async checkIPBan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get IP from request using the utility method
      const ip = getClientIp(req);

      console.log('ip', ip);

      if (!ip) {
        res.status(400).json({
          success: false,
          message: 'Could not determine client IP',
        });
        return;
      }

      const result = await ReportManagementService.checkIPBanStatus(ip);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // 🆕 GET /api/ip-ban/check/:ip - Check specific IP (for admin or testing)
  async checkSpecificIP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ip } = req.params;

      if (!ip) {
        res.status(400).json({
          success: false,
          message: 'IP address is required',
        });
        return;
      }

      const result = await ReportManagementService.checkIPBanStatus(ip);

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

