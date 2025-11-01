import '../env';
import { DatabaseConfig } from '../config/database';
import Admin from '../models/Admin';

async function createSuperAdmin() {
  try {
    // Connect to database
    const db = DatabaseConfig.getInstance();
    await db.connectMongoDB();

    // Check if super admin already exists
    const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
    
    if (existingSuperAdmin) {
      console.log('❌ Super admin already exists!');
      console.log('Username:', existingSuperAdmin.username);
      console.log('Email:', existingSuperAdmin.email);
      process.exit(0);
    }

    // Create super admin
    const superAdmin = new Admin({
      username: 'admin',
      email: 'admin@sozly.com',
      password: 'Admin@123456', // Change this in production!
      fullName: 'Super Administrator',
      role: 'super_admin',
      isActive: true,
    });

    await superAdmin.save();

    console.log('✅ Super admin created successfully!');
    console.log('═══════════════════════════════════════');
    console.log('Username:', superAdmin.username);
    console.log('Email:', superAdmin.email);
    console.log('Password: Admin@123456');
    console.log('Role:', superAdmin.role);
    console.log('═══════════════════════════════════════');
    console.log('⚠️  IMPORTANT: Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }
}

createSuperAdmin();

