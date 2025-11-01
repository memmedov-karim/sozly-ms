import jwt from 'jsonwebtoken';
import Admin, { IAdmin } from '../models/Admin';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export class AuthService {
  // Generate JWT token
  generateToken(adminId: string, role: string): string {
    return jwt.sign(
      { id: adminId, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  // Generate refresh token
  generateRefreshToken(adminId: string): string {
    return jwt.sign(
      { id: adminId, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );
  }

  // Verify JWT token
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Register new admin (only super_admin can create admins)
  async register(data: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    role?: 'admin' | 'moderator';
  }) {
    // Check if username or email already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ username: data.username }, { email: data.email }],
    });

    if (existingAdmin) {
      throw new Error('Username or email already exists');
    }

    // Validate password strength
    if (data.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Create new admin
    const admin = new Admin({
      username: data.username,
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      role: data.role || 'moderator',
      isActive: true,
    });

    await admin.save();

    // Generate tokens
    const token = this.generateToken(admin._id.toString(), admin.role);
    const refreshToken = this.generateRefreshToken(admin._id.toString());

    return {
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        isActive: admin.isActive,
      },
      token,
      refreshToken,
    };
  }

  // Login admin
  async login(username: string, password: string) {
    // Find admin with password field
    const admin = await Admin.findOne({
      $or: [{ username }, { email: username }],
    }).select('+password');

    if (!admin) {
      throw new Error('Invalid credentials');
    }

    // Check if admin is active
    if (!admin.isActive) {
      throw new Error('Account is deactivated. Please contact super admin.');
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate tokens
    const token = this.generateToken(admin._id.toString(), admin.role);
    const refreshToken = this.generateRefreshToken(admin._id.toString());

    return {
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin,
      },
      token,
      refreshToken,
    };
  }

  // Get admin by ID
  async getAdminById(adminId: string) {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }
    return admin;
  }

  // Refresh token
  async refreshToken(refreshToken: string) {
    try {
      const decoded = this.verifyToken(refreshToken);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      const admin = await this.getAdminById(decoded.id);
      
      // Generate new tokens
      const newToken = this.generateToken(admin._id.toString(), admin.role);
      const newRefreshToken = this.generateRefreshToken(admin._id.toString());

      return {
        token: newToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  // Change password
  async changePassword(adminId: string, oldPassword: string, newPassword: string) {
    const admin = await Admin.findById(adminId).select('+password');
    
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Verify old password
    const isPasswordValid = await admin.comparePassword(oldPassword);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    return { message: 'Password changed successfully' };
  }
}

export default new AuthService();

