import express from "express";
import { protect } from "../middleware/auth.middleware";
import { restrictTo } from "../middleware/role.middleware";
import {
  createGym,
  getGyms,
  convertLead,
  updateLeadStatus,
  getSuperAdminDashboard,
  recordSubscriptionPayment,
  getGymSubscriptionPayments,
  updateGymSubscription,
} from "../controllers/admin.controller";

const adminRouter = express.Router();

adminRouter.post("/create-gym", protect, restrictTo("superadmin"), createGym);

adminRouter.get("/admin/gyms", protect, restrictTo("superadmin"), getGyms);

adminRouter.post("/admin/convert-lead/:leadId", protect, restrictTo("superadmin"), convertLead);

adminRouter.get("/admin-dashboard", protect, restrictTo("superadmin"), getSuperAdminDashboard);

adminRouter.patch("/leads/:leadId/status", protect, restrictTo("superadmin"), updateLeadStatus);

// Subscription payment routes
adminRouter.post("/admin/gyms/:gymId/payments", protect, restrictTo("superadmin"), recordSubscriptionPayment);
adminRouter.get("/admin/gyms/:gymId/payments", protect, restrictTo("superadmin"), getGymSubscriptionPayments);
adminRouter.patch("/admin/gyms/:gymId/subscription", protect, restrictTo("superadmin"), updateGymSubscription);

export default adminRouter;