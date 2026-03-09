import mongoose, { Schema, Document, model, Types } from "mongoose";

export interface IPlanPriceHistory extends Document {
  gymId: Types.ObjectId;
  planId: Types.ObjectId;
  planName: string;
  oldPrice: number;
  newPrice: number;
  updatedAt: Date;
}

const PlanPriceHistorySchema = new Schema<IPlanPriceHistory>(
  {
    gymId: {
      type: Schema.Types.ObjectId,
      ref: "Gym",
      required: true
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
      required: true
    },
    planName: {
      type: String,
      required: true
    },
    oldPrice: {
      type: Number,
      required: true
    },
    newPrice: {
      type: Number,
      required: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
);

export default model<IPlanPriceHistory>(
  "PlanPriceHistory",
  PlanPriceHistorySchema
);