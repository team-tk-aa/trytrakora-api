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
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);

        // Last month's "7-day expiry window" equivalent
        const next7DaysLastMonth = new Date(startOfLastMonth);
        next7DaysLastMonth.setDate(startOfLastMonth.getDate() + 7);

        // total members
        const totalMembers = await Member.countDocuments({ gymId });
        const totalMembersPrev = await Member.countDocuments({
            gymId,
            createdAt: { $lt: startOfMonth }
        });

        // active members
        const activeMembers = await Member.countDocuments({ gymId, status: "active" });
        const activeMembersPrev = await Member.countDocuments({
            gymId,
            status: "active",
            createdAt: { $lt: startOfMonth }
        });

        // expired members
        const expiredMembers = await Member.countDocuments({ gymId, status: "expired" });

        // expiring soon
        const expiringMembers = await Member.countDocuments({
            gymId,
            status: "active",
            endDate: { $lte: next7Days }
        });
        const expiringMembersPrev = await Member.countDocuments({
            gymId,
            endDate: { $gte: startOfLastMonth, $lte: next7DaysLastMonth }
        });

        // revenue this month
        const revenueResult = await Renewal.aggregate([
            { $match: { gymId, renewedOn: { $gte: startOfMonth } } },
            { $group: { _id: null, totalRevenue: { $sum: "$amount" }, totalRenewals: { $sum: 1 } } }
        ]);

        // revenue last month
        const revenuePrevResult = await Renewal.aggregate([
            { $match: { gymId, renewedOn: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
            { $group: { _id: null, totalRevenue: { $sum: "$amount" }, totalRenewals: { $sum: 1 } } }
        ]);

        const revenueThisMonth = revenueResult[0]?.totalRevenue || 0;
        const renewalsThisMonth = revenueResult[0]?.totalRenewals || 0;
        const revenuePrevMonth = revenuePrevResult[0]?.totalRevenue || 0;
        const renewalsPrevMonth = revenuePrevResult[0]?.totalRenewals || 0;

        res.status(200).json({
            totalMembers,
            totalMembersPrev,
            activeMembers,
            activeMembersPrev,
            expiredMembers,
            expiringMembers,
            expiringMembersPrev,
            revenueThisMonth,
            revenuePrevMonth,
            renewalsThisMonth,
            renewalsPrevMonth,
        });

    } catch (err) {
        next(err);
    }
};