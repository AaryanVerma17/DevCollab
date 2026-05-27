import rateLimit from "express-rate-limit";

export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests, please try again later.",
    retryAfter: "15 minutes",
  },
  skip: (req) => req.method === "OPTIONS",
});

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "AI rate limit exceeded. Maximum 20 requests per minute.",
    retryAfter: "1 minute",
  },
  keyGenerator: (req: any) => {
    return req.user?.id ?? req.ip;
  },
});

export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    error: "Upload rate limit exceeded. Maximum 30 uploads per minute.",
  },
});