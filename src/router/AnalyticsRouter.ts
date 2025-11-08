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
router.get('/user-age', AnalyticsController.getUserAgeAnalytics);
router.get('/gender-search', AnalyticsController.getGenderSearchAnalytics);
router.get('/age-search', AnalyticsController.getAgeSearchAnalytics);

// Advanced Analytics Routes
router.get('/match-success', AnalyticsController.getMatchSuccessAnalytics);
router.get('/conversation-quality', AnalyticsController.getConversationQualityMetrics);
router.get('/user-engagement', AnalyticsController.getUserEngagementMetrics);
router.get('/demographic-matching', AnalyticsController.getDemographicMatchingMatrix);
router.get('/rejection-report', AnalyticsController.getRejectionReportAnalytics);
router.get('/voice-vs-text', AnalyticsController.getVoiceVsTextAnalytics);
router.get('/activity-heatmap', AnalyticsController.getActivityHeatmapData);

export default router;

