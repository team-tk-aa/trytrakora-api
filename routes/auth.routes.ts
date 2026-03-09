import { Router } from 'express';
import { login } from '../controllers/auth.controller';

const authRouter = Router();

// public endpoints for authentication

authRouter.post('/auth/login', login);

export default authRouter;
