import {Request} from 'express';
import { IUser } from '../models/user.model';
import * as multer from 'multer';

declare global {
    namespace Express {
        interface  Request{
            user?: IUser,
            file?: any;
        }
    }
}
