import { Router } from 'express';
import ChatManagementController from '../controller/ChatManagementController';

const router = Router();

// Chat management routes
router.get('/', ChatManagementController.getAllChats);
router.get('/stats/overview', ChatManagementController.getChatStatistics);
router.get('/active', ChatManagementController.getActiveChats);
router.get('/country/distribution', ChatManagementController.getChatsByCountry);
router.get('/peak-hours', ChatManagementController.getChatPeakHours);
router.get('/:sessionId', ChatManagementController.getChatDetails);
router.get('/:sessionId/messages', ChatManagementController.getChatMessages);

export default router;

