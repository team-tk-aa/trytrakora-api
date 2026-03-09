import mongoose, { Schema, Document, model, Types } from "mongoose";

export interface IPlan extends Document {
  gymId: Types.ObjectId;
  name: string;
  durationDays: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    gymId: {
      type: Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    durationDays: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

export default model<IPlan>("Plan", PlanSchema);