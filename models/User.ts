import mongoose, { Schema, Document, model, Types } from "mongoose";
import bcrypt from "bcrypt";

export const ROLES = ["owner", "staff", "superadmin"] as const;
export interface IUser extends Document {
    email: string;
    passwordHash: string;
    role: typeof ROLES[number];
    gymId: Types.ObjectId;
    otpCode?: string;
    otpExpires?: Date;
    comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            unique: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ROLES,
            default: "owner",
        },
        gymId: {
            type: Schema.Types.ObjectId,
            ref: "Gym",
            required: function () {
                return this.role !== ROLES[2]; // superadmin does not require gymId";
            },
            index: true,
        },
        otpCode: { type: String },
        otpExpires: { type: Date },
    },
    { timestamps: true }
);

// Hash password before save
UserSchema.pre<IUser>("save", async function () {
    if (!this.isModified("passwordHash")) return;

    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Compare password
UserSchema.methods.comparePassword = function (candidate: string) {
    return bcrypt.compare(candidate, this.passwordHash);
};

export default model<IUser>("User", UserSchema);