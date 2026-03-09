import express from "express";
import { protect } from "../middleware/auth.middleware";
import {
  checkInMember,
  getAttendance,
  getInactiveMembers
} from "../controllers/attendance.controller";

const attendanceRouter = express.Router();

attendanceRouter.post("/checkin", protect, checkInMember);

attendanceRouter.get("/", protect, getAttendance);

attendanceRouter.get("/inactive", protect, getInactiveMembers);

export default attendanceRouter;