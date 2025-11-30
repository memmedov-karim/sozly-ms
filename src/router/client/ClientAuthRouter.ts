import { Router } from 'express';
import ClientAuthController from '../../controller/client/AuthController';

const router = Router();

router.get('/auth', ClientAuthController.generateClientUserId);


export default router;




