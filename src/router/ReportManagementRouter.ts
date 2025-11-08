import { Router } from 'express';
import ReportManagementController from '../controller/ReportManagementController';

const router = Router();

// Report management routes
router.get('/', ReportManagementController.getAllReports);
router.get('/stats/overview', ReportManagementController.getReportStatistics);
router.get('/recent', ReportManagementController.getRecentReports);
router.get('/timeseries', ReportManagementController.getReportsOverTime);
router.get('/user/:ip', ReportManagementController.getReportsByUser);

// 🆕 New routes for grouped reports and IP banning
router.get('/grouped', ReportManagementController.getGroupedReports);
router.get('/by-ip/:reportedIp', ReportManagementController.getReportsByReportedIp);
router.post('/ban-ip', ReportManagementController.banIP);
router.get('/active-bans', ReportManagementController.getActiveBans);
router.post('/unban-ip', ReportManagementController.unbanIP);

router.get('/:reportId', ReportManagementController.getReportDetails);
router.patch('/:reportId/status', ReportManagementController.updateReportStatus);
router.delete('/:reportId', ReportManagementController.deleteReport);
router.post('/bulk-delete', ReportManagementController.bulkDeleteReports);

export default router;

