import express from 'express';
const router = express.Router();
import * as userController from '../controllers/usercontroller.js';
import authMiddleware from '../middleware/auth.js'

//all routes are protected

router.use(authMiddleware);

router.get('/profile', userController.getProfile);
router.get('/profile', userController.updateProfile);
router.get('/preferences', userController.updatePreference);
router.get('/change-password', userController.changePassword);
router.get('/account', userController.deleteAccount);

export default router;