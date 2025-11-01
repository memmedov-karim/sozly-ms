import { Router } from 'express';
import UserManagementController from '../controller/UserManagementController';

const router = Router();

// User management routes
router.get('/', UserManagementController.getAllUsers);
router.get('/stats/summary', UserManagementController.getUserStatsSummary);
router.get('/online/stats', UserManagementController.getOnlineUsersStats);
router.get('/location/distribution', UserManagementController.getUsersByLocation);
router.get('/:identifier', UserManagementController.getUserProfile);
router.get('/:ip/activity', UserManagementController.getUserActivity);

export default router;

