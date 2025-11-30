import express from 'express';
import { getUserPreferences } from '../../controller/OptionController';
import { userIdMiddleware } from '../../middleware/userIdMiddleware';

const router = express.Router();

router.get('/api/v1/options', userIdMiddleware, getUserPreferences);

export default router;
