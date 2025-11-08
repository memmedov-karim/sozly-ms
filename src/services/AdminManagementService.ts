import Admin from '../models/Admin';

export class AdminManagementService {
  // Get all admins with pagination
  async getAllAdmins(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
      ];
    }

    const [admins, total] = await Promise.all([
      Admin.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Admin.countDocuments(query),
    ]);

    return {
      admins,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get admin by ID
  async getAdminById(id: string) {
    const admin = await Admin.findById(id);
    if (!admin) {
      throw new Error('Admin not found');
    }
    return admin;
  }

  // Create new admin
  async createAdmin(data: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    role: 'admin' | 'moderator';
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

    const admin = new Admin(data);
    await admin.save();

    return admin;
  }

  // Update admin
  async updateAdmin(
    id: string,
    data: {
      username?: string;
      email?: string;
      fullName?: string;
      role?: 'admin' | 'moderator';
      isActive?: boolean;
    }
  ) {
    const admin = await Admin.findById(id);
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Check if username or email already exists (excluding current admin)
    if (data.username || data.email) {
      const query: any = { _id: { $ne: id } };
      const checks: any[] = [];
      
      if (data.username) checks.push({ username: data.username });
      if (data.email) checks.push({ email: data.email });
      
      if (checks.length > 0) {
        query.$or = checks;
        const existingAdmin = await Admin.findOne(query);
        
        if (existingAdmin) {
          throw new Error('Username or email already exists');
        }
      }
    }

    // Update fields
    if (data.username) admin.username = data.username;
    if (data.email) admin.email = data.email;
    if (data.fullName) admin.fullName = data.fullName;
    if (data.role) admin.role = data.role;
    if (data.isActive !== undefined) admin.isActive = data.isActive;

    await admin.save();
    return admin;
  }

  // Delete admin
  async deleteAdmin(id: string) {
    const admin = await Admin.findById(id);
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Prevent deleting super_admin
    if (admin.role === 'super_admin') {
      throw new Error('Cannot delete super admin');
    }

    await Admin.findByIdAndDelete(id);
    return { message: 'Admin deleted successfully' };
  }

  // Toggle admin active status
  async toggleAdminStatus(id: string) {
    const admin = await Admin.findById(id);
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Prevent deactivating super_admin
    if (admin.role === 'super_admin') {
      throw new Error('Cannot deactivate super admin');
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    return admin;
  }

  // Get admin statistics
  async getAdminStats() {
    const [
      totalAdmins,
      activeAdmins,
      superAdmins,
      admins,
      moderators,
      recentLogins,
    ] = await Promise.all([
      Admin.countDocuments(),
      Admin.countDocuments({ isActive: true }),
      Admin.countDocuments({ role: 'super_admin' }),
      Admin.countDocuments({ role: 'admin' }),
      Admin.countDocuments({ role: 'moderator' }),
      Admin.find({ lastLogin: { $exists: true } })
        .sort({ lastLogin: -1 })
        .limit(5)
        .select('username fullName lastLogin role'),
    ]);

    return {
      totalAdmins,
      activeAdmins,
      inactiveAdmins: totalAdmins - activeAdmins,
      byRole: {
        superAdmins,
        admins,
        moderators,
      },
      recentLogins,
    };
  }

  // Reset admin password (super_admin only)
  async resetAdminPassword(id: string, newPassword: string) {
    const admin = await Admin.findById(id);
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Validate password strength
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    admin.password = newPassword;
    await admin.save();

    return { message: 'Password reset successfully' };
  }
}

export default new AdminManagementService();


