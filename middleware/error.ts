import ErrorHandler from "../utils/ErrorHandler";
import { Request, Response, NextFunction } from 'express';

export const ErrorMiddleware = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";

    //wrong mongo db error
    if (err.name === 'CastError') {
        const message = `Resource not found. Invalid ${err.path}`;
        err = new ErrorHandler(message, 400);
    }

    //duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue ?? {})[0];
        let message = `Duplicate ${field} entered`;
        if (field === 'phone') {
            message = 'A member with this phone number already exists in this gym';
        } else if (field === 'email') {
            message = 'A member with this email already exists in this gym';
        }
        err = new ErrorHandler(message, 400);
    }

    //wrong jwterror
    if (err.name === 'JsonWebTokenError') {
        const message = 'Json web token is inavlid, try again';
        err = new ErrorHandler(message, 400);
    }

    //jwt expired error
    if (err.name === 'TokenExpiredError') {
        const message = 'Json web token is expired, try again';
        err = new ErrorHandler(message, 401);
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message
    })
}


