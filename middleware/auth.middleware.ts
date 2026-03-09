import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { verifyToken, TokenPayload } from "../utils/jwt";

// extend Express request type
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
console.log("Authorization header:", authHeader);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      new ErrorHandler("Please login to access this resource.", 401)
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // contains userId, gymId, role
    next();
  } catch (error) {
    return next(
      new ErrorHandler("Invalid or expired token.", 401)
    );
  }
};