import { Request, Response, NextFunction } from 'express';
import AdminManagementService from '../services/AdminManagementService';

export class AdminManagementController {
  // GET /api/admin/admins
  async getAllAdmins(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;

      const result = await AdminManagementService.getAllAdmins(page, limit, search);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch admins',
      });
    }
  }

  // GET /api/admin/admins/stats
  async getAdminStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminManagementService.getAdminStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch admin statistics',
      });
    }
  }

  // GET /api/admin/admins/:id
  async getAdminById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const admin = await AdminManagementService.getAdminById(id);

      res.json({
        success: true,
        data: { admin },
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Admin not found',
      });
    }
  }

  // POST /api/admin/admins
  async createAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, email, password, fullName, role } = req.body;

      // Validate required fields
      if (!username || !email || !password || !fullName || !role) {
        return res.status(400).json({
          success: false,
          message: 'Please provide all required fields',
        });
      }

      const admin = await AdminManagementService.createAdmin({
        username,
        email,
        password,
        fullName,
        role,
      });

      res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        data: { admin },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create admin',
      });
    }
  }

  // PUT /api/admin/admins/:id
  async updateAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { username, email, fullName, role, isActive } = req.body;

      const admin = await AdminManagementService.updateAdmin(id, {
        username,
        email,
        fullName,
        role,
        isActive,
      });

      res.json({
        success: true,
        message: 'Admin updated successfully',
        data: { admin },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update admin',
      });
    }
  }

  // DELETE /api/admin/admins/:id
  async deleteAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await AdminManagementService.deleteAdmin(id);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete admin',
      });
    }
  }

  // PATCH /api/admin/admins/:id/toggle-status
  async toggleAdminStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const admin = await AdminManagementService.toggleAdminStatus(id);

      res.json({
        success: true,
        message: `Admin ${admin.isActive ? 'activated' : 'deactivated'} successfully`,
        data: { admin },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to toggle admin status',
      });
    }
  }

  // POST /api/admin/admins/:id/reset-password
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password required',
        });
      }

      const result = await AdminManagementService.resetAdminPassword(id, newPassword);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reset password',
      });
    }
  }
}

export default new AdminManagementController();

