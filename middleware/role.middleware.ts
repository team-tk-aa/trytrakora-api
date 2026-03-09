import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req?.user?.role || "")) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};