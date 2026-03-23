import mongoose, { Schema, Document, model, Types } from "mongoose";

export interface IGymSubscriptionPayment extends Document {
  gymId: Types.ObjectId;
  amount: number;
  paymentMethod: "upi" | "cash" | "bank_transfer" | "cheque" | "other";
  paidOn: Date;
  note?: string;
  recordedBy: Types.ObjectId; // superadmin userId
  createdAt: Date;
  updatedAt: Date;
}

const GymSubscriptionPaymentSchema = new Schema<IGymSubscriptionPayment>(
  {
    gymId: {
      type: Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["upi", "cash", "bank_transfer", "cheque", "other"],
      required: true,
    },
    paidOn: {
      type: Date,
      required: true,
      default: Date.now,
    },
    note: {
      type: String,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default model<IGymSubscriptionPayment>(
  "GymSubscriptionPayment",
  GymSubscriptionPaymentSchema
);
