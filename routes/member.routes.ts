import express from "express";
import { protect } from "../middleware/auth.middleware";
import {
  createMember,
  getMembers,
  updateMember,
  getExpiringMembers
} from "../controllers/member.controller";
import { restrictTo } from "../middleware/role.middleware";

const memberRouter = express.Router();

memberRouter.post("/members", protect, restrictTo("owner"), createMember);

memberRouter.get("/members", protect, restrictTo("owner"), getMembers);

memberRouter.get("/members/expiring", protect, restrictTo("owner"), getExpiringMembers);

memberRouter.put("/members/:id", protect, restrictTo("owner"), updateMember);

export default memberRouter;