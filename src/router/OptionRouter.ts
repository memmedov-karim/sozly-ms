import express from 'express';
import { getUserPreferences } from '../controller/OptionController';

const router = express.Router();

router.get('/api/v1/options', getUserPreferences);

export default router;
