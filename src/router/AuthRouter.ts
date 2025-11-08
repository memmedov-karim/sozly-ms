import { Router } from 'express';
import AuthController from '../controller/AuthController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.post('/register', AuthController.register.bind(AuthController));
router.post('/login', AuthController.login.bind(AuthController));
router.post('/refresh', AuthController.refreshToken.bind(AuthController));

// Protected routes
router.get('/me', authenticate, AuthController.getMe.bind(AuthController));
router.post('/change-password', authenticate, AuthController.changePassword.bind(AuthController));
router.post('/logout', authenticate, AuthController.logout.bind(AuthController));

export default router;


