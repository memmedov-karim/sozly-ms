import { Router } from 'express';
import DashboardController from '../controller/DashboardController';

const router = Router();

// Dashboard overview routes
router.get('/overview', DashboardController.getOverview);
router.get('/server-load', DashboardController.getServerLoad);
router.get('/timeseries', DashboardController.getTimeSeries);

export default router;

