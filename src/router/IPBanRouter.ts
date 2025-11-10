import { Router } from 'express';
import IPBanController from '../controller/IPBanController';

const router = Router();

// Public user ban check routes
router.get('/check', IPBanController.checkIPBan);
router.get('/check/:uniqueUserId', IPBanController.checkSpecificUser);

export default router;

