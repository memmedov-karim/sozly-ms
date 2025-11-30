import { Router } from 'express';
import TurnServerCOntroller from '../../controller/client/TurnServerController';
import { userIdMiddleware } from '../../middleware/userIdMiddleware';

const router = Router();

router.get('/credentials', userIdMiddleware, TurnServerCOntroller.getTurnCredentials);


export default router;




