import { Router } from 'express';
import AnalyticsController from '../controller/AnalyticsController';

const router = Router();

// Analytics routes
router.get('/site', AnalyticsController.getSiteAnalytics);
router.get('/geography', AnalyticsController.getGeographyAnalytics);
router.get('/devices', AnalyticsController.getDevicePlatformStats);
router.get('/traffic-sources', AnalyticsController.getTrafficSources);
router.get('/session-duration', AnalyticsController.getAverageSessionDuration);
router.get('/chat-duration-distribution', AnalyticsController.getChatDurationDistribution);
router.get('/peak-times', AnalyticsController.getPeakUsageTimes);
router.get('/languages', AnalyticsController.getLanguageAnalytics);
router.get('/gender', AnalyticsController.getGenderAnalytics);
router.get('/topics', AnalyticsController.getTopicAnalytics);

export default router;

