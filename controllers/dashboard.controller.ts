import { Response, NextFunction } from "express";
import Member from "../models/Member";
import Renewal from "../models/Renewal";
import { AuthRequest } from "../middleware/auth.middleware";
import ErrorHandler from "../utils/ErrorHandler";

export const getDashboardStats = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const gymId = req.user?.gymId;

        if (!gymId) {
            return next(new ErrorHandler("Gym context missing", 403));
        }

        const today = new Date();

        const next7Days = new Date();
        next7Days.setDate(today.getDate() + 7);

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // total members
        const totalMembers = await Member.countDocuments({ gymId });

        // active members
        const activeMembers = await Member.countDocuments({
            gymId,
            status: "active"
        });

        // expired members
        const expiredMembers = await Member.countDocuments({
            gymId,
            status: "expired"
        });

        // expiring soon
        const expiringMembers = await Member.countDocuments({
            gymId,
            status: "active",
            endDate: { $lte: next7Days }
        });

        // revenue this month
        const revenueResult = await Renewal.aggregate([
            {
                $match: {
                    gymId,
                    renewedOn: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$amount" },
                    totalRenewals: { $sum: 1 }
                }
            }
        ]);

        const revenueThisMonth = revenueResult[0]?.totalRevenue || 0;
        const renewalsThisMonth = revenueResult[0]?.totalRenewals || 0;

        res.status(200).json({
            totalMembers,
            activeMembers,
            expiredMembers,
            expiringMembers,
            revenueThisMonth,
            renewalsThisMonth
        });

    } catch (err) {
        next(err);
    }
};