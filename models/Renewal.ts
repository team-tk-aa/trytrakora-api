import mongoose, { Schema, Document, model, Types } from "mongoose";

export interface IRenewal extends Document {
  gymId: Types.ObjectId;
  memberId: Types.ObjectId;
  previousEndDate: Date;
  newEndDate: Date;
  amount: number;
  planName: string;
  type: 'new' | 'renewal';
  renewedOn: Date;
}

const RenewalSchema = new Schema<IRenewal>(
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
    previousEndDate: {
      type: Date,
      required: true
    },
    newEndDate: {
      type: Date,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    planName: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      enum: ['new', 'renewal'],
      default: 'renewal'
    },
    renewedOn: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default model<IRenewal>("Renewal", RenewalSchema);