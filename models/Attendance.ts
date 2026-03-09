import mongoose, { Schema, Document, model, Types } from "mongoose";

export interface IAttendance extends Document {
  gymId: Types.ObjectId;
  memberId: Types.ObjectId;
  checkInTime: Date;
  createdAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    gymId: {
      type: Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      index: true
    },
    checkInTime: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// useful query index
AttendanceSchema.index({ gymId: 1, memberId: 1, createdAt: -1 });

export default model<IAttendance>("Attendance", AttendanceSchema);