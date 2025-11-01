import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/AuthService';

// Extend Request interface to include admin
export interface AuthRequest extends Request {
  admin?: {
    id: string;
    role: string;
  };
}

// Authentication middleware
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = AuthService.verifyToken(token);
    
    // Attach admin info to request
    req.admin = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please login again.',
    });
  }
};

// Authorization middleware - check admin roles
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
      });
    }

    next();
  };
};

// Super admin only middleware
export const superAdminOnly = authorize('super_admin');

// Admin and super admin middleware
export const adminAndAbove = authorize('super_admin', 'admin');

