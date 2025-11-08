import { Router } from 'express';
import IPBanController from '../controller/IPBanController';

const router = Router();

// Public IP ban check routes
router.get('/check', IPBanController.checkIPBan);
router.get('/check/:ip', IPBanController.checkSpecificIP);

export default router;

