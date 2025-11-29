import { Router } from 'express';
import TurnServerCOntroller from '../controller/TurnServerController';

const router = Router();

router.get('/credentials', TurnServerCOntroller.getTurnCredentials);


export default router;




