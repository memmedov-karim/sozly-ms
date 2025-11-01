import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/AuthService';
import { AuthRequest } from '../middleware/authMiddleware';

export class AuthController {
  // POST /api/auth/register
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, email, password, fullName, role } = req.body;

      // Validate required fields
      if (!username || !email || !password || !fullName) {
        return res.status(400).json({
          success: false,
          message: 'Please provide all required fields',
        });
      }

      const result = await AuthService.register({
        username,
        email,
        password,
        fullName,
        role,
      });

      res.status(201).json({
        success: true,
        message: 'Admin registered successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
      });
    }
  }

  // POST /api/auth/login
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { usernameOrEmail, password } = req.body;

      // Validate required fields
      if (!usernameOrEmail || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide username and password',
        });
      }

      const result = await AuthService.login(usernameOrEmail, password);

      res.json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
      });
    }
  }

  // GET /api/auth/me
  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
      }

      const admin = await AuthService.getAdminById(req.admin.id);

      res.json({
        success: true,
        data: {
          admin: {
            id: admin._id,
            username: admin.username,
            email: admin.email,
            fullName: admin.fullName,
            role: admin.role,
            isActive: admin.isActive,
            lastLogin: admin.lastLogin,
            createdAt: admin.createdAt,
          },
        },
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Admin not found',
      });
    }
  }

  // POST /api/auth/refresh
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token required',
        });
      }

      const result = await AuthService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Token refresh failed',
      });
    }
  }

  // POST /api/auth/change-password
  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
      }

      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Please provide old and new passwords',
        });
      }

      const result = await AuthService.changePassword(
        req.admin.id,
        oldPassword,
        newPassword
      );

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Password change failed',
      });
    }
  }

  // POST /api/auth/logout
  async logout(req: Request, res: Response, next: NextFunction) {
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}

export default new AuthController();

