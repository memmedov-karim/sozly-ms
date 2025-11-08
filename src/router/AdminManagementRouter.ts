import { Router } from 'express';
import AdminManagementController from '../controller/AdminManagementController';
import { authenticate, superAdminOnly, adminAndAbove } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Statistics - accessible by all authenticated admins
router.get('/stats', AdminManagementController.getAdminStats.bind(AdminManagementController));

// Get all admins - accessible by admin and super_admin
router.get('/', adminAndAbove, AdminManagementController.getAllAdmins.bind(AdminManagementController));

// Get admin by ID - accessible by admin and super_admin
router.get('/:id', adminAndAbove, AdminManagementController.getAdminById.bind(AdminManagementController));

// Create admin - super_admin only
router.post('/', superAdminOnly, AdminManagementController.createAdmin.bind(AdminManagementController));

// Update admin - super_admin only
router.put('/:id', superAdminOnly, AdminManagementController.updateAdmin.bind(AdminManagementController));

// Delete admin - super_admin only
router.delete('/:id', superAdminOnly, AdminManagementController.deleteAdmin.bind(AdminManagementController));

// Toggle admin status - super_admin only
router.patch('/:id/toggle-status', superAdminOnly, AdminManagementController.toggleAdminStatus.bind(AdminManagementController));

// Reset password - super_admin only
router.post('/:id/reset-password', superAdminOnly, AdminManagementController.resetPassword.bind(AdminManagementController));

export default router;


