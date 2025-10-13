import express from 'express';
import { saveReport } from '../controller/ReportController';

const router = express.Router();

router.post('/api/v1/report', saveReport);

export default router;
