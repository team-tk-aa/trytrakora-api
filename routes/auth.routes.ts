import { Router } from 'express';
import { login, forgotPassword, verifyOtp, resetPassword, refreshAccessToken } from '../controllers/auth.controller';

const authRouter = Router();

authRouter.post('/auth/login', login);
authRouter.post('/auth/refresh', refreshAccessToken);
authRouter.post('/auth/forgot-password', forgotPassword);
authRouter.post('/auth/verify-otp', verifyOtp);
authRouter.post('/auth/reset-password', resetPassword);

export default authRouter;
