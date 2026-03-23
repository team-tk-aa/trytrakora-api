import mongoose, { Schema, Document, model } from "mongoose";

export interface IGym extends Document {
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  subscriptionStatus: "active" | "inactive";
  subscriptionFee: number;
  subscriptionDueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GymSchema = new Schema<IGym>(
  {
    name: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    subscriptionFee: { type: Number, default: 0 },
    subscriptionDueDate: { type: Date },
  },
  { timestamps: true }
);

export default model<IGym>("Gym", GymSchema);