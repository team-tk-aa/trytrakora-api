// utils/createVerificationToken.ts
import jwt from "jsonwebtoken";

export const createVerificationToken = (identifier: string, purpose: string) => {
  return jwt.sign(
    {
      identifier,
      purpose,
      verified: true,
      type: "otp_verification",
    },
    process.env.JWT_SECRET!,
    { expiresIn: "10m" }
  );
};