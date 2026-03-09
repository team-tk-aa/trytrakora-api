import { RateLimiterMemory } from "rate-limiter-flexible";

/**
 * Max 3 OTP per 10 minutes per identifier (email/mobile)
 */
export const otpLimiter = new RateLimiterMemory({
    points: 3,
    duration: 600, // 10 minutes
});

/**
 * Cooldown → resend only after 30 sec
 */
export const otpCooldown = new RateLimiterMemory({
    points: 1,
    duration: 30,
});