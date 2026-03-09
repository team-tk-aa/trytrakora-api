import jwt from 'jsonwebtoken';
import ErrorHandler from './ErrorHandler';

interface TokenPayload {
  userId: string;
  gymId: string;
  role: string;
}

const secret: string = process.env.JWT_SECRET || 'change_this';
const accessExpiresIn: string = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const refreshExpiresIn: string = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload as jwt.JwtPayload, secret as jwt.Secret, { expiresIn: accessExpiresIn } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload as jwt.JwtPayload, secret as jwt.Secret, { expiresIn: refreshExpiresIn } as jwt.SignOptions);
};

export const generateToken = (payload: TokenPayload): string => {
  // For backward compatibility, generate access token
  return generateAccessToken(payload);
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, secret) as TokenPayload;
  } catch (err) {
    throw new ErrorHandler('Invalid or expired token', 401);
  }
};

export type { TokenPayload };

