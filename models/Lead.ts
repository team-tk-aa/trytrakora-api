import mongoose, { Schema, Document, model } from "mongoose";

export interface ILead extends Document {
  gymName: string;
  ownerName: string;
  phone: string;
  email: string;
  status: "new" | "contacted" | "converted";
  createdAt: Date;
  updatedAt: Date;
  convertedAt: Date
}

const LeadSchema = new Schema<ILead>(
  {
    gymName: { type: String, required: true },
    ownerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    status: {
      type: String,
      enum: ["new", "contacted", "converted"],
      default: "new",
    },
    convertedAt: { type: Date },
  },
  { timestamps: true }
);

export default model<ILead>("Lead", LeadSchema);