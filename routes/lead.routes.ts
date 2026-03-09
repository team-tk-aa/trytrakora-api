import express from "express";
import { convertLead, createLead, getLeads } from "../controllers/lead.controller";
import { protect } from "../middleware/auth.middleware";
import { restrictTo } from "../middleware/role.middleware";

const leadRouter = express.Router();

// Public route
leadRouter.post("/leads/create", createLead);

// Superadmin route
leadRouter.get("/leads", protect, restrictTo("superadmin"), getLeads);

leadRouter.post(
  "/admin/convert-lead/:leadId",
  protect,
  restrictTo("superadmin"),
  convertLead
);

export default leadRouter;