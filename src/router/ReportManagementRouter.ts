import { Router } from 'express';
import ReportManagementController from '../controller/ReportManagementController';

const router = Router();

// Report management routes
router.get('/', ReportManagementController.getAllReports);
router.get('/stats/overview', ReportManagementController.getReportStatistics);
router.get('/recent', ReportManagementController.getRecentReports);
router.get('/timeseries', ReportManagementController.getReportsOverTime);
router.get('/user/:ip', ReportManagementController.getReportsByUser);

// 🆕 New routes for grouped reports and user banning
router.get('/grouped', ReportManagementController.getGroupedReports);
router.get('/by-userid/:uniqueUserId', ReportManagementController.getReportsByUniqueUserId);
router.post('/ban-user', ReportManagementController.banUser);
router.get('/active-bans', ReportManagementController.getActiveBans);
router.post('/unban-user', ReportManagementController.unbanUser);

router.get('/:reportId', ReportManagementController.getReportDetails);
router.patch('/:reportId/status', ReportManagementController.updateReportStatus);
router.delete('/:reportId', ReportManagementController.deleteReport);
router.post('/bulk-delete', ReportManagementController.bulkDeleteReports);

export default router;

