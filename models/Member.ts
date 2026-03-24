import mongoose, { Schema, Document, model, Types } from "mongoose";

export interface IMember extends Document {
  gymId: Types.ObjectId;

  name: string;
  phone: string;
  email?: string;

  planId: Types.ObjectId;
  planName: string;
  planPrice: number;

  discount: number;
  finalAmount: number;

  startDate: Date;
  endDate: Date;

  status: "active" | "expired";

  followUpStatus: "none" | "pending" | "called" | "renewed" | "not_interested";

  qrCode?: string;

  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>(
  {
    gymId: {
      type: Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      trim: true,
      sparse: true,
      default: undefined
    },

    planId: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
      required: true
    },

    // snapshot of plan info at purchase time
    planName: {
      type: String,
      required: true
    },

    planPrice: {
      type: Number,
      required: true
    },

    discount: {
      type: Number,
      default: 0
    },

    finalAmount: {
      type: Number,
      required: true
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: ["active", "expired"],
      default: "active"
    },

    followUpStatus: {
      type: String,
      enum: ["none", "pending", "called", "renewed", "not_interested"],
      default: "none"
    },

    // future QR attendance
    qrCode: {
      type: String
    }
  },
  { timestamps: true }
);

// Per-gym uniqueness — a phone/email can exist in multiple gyms but not twice in the same gym
MemberSchema.index({ gymId: 1, phone: 1 }, { unique: true });
MemberSchema.index({ gymId: 1, email: 1 }, { unique: true, sparse: true });
MemberSchema.index({ gymId: 1, endDate: 1 });

export default model<IMember>("Member", MemberSchema);