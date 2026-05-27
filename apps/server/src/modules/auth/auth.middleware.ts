import type { Request, Response, NextFunction } from "express";
import { createClerkClient } from "@clerk/backend";
import { env } from "../env";
import { prisma } from "../db/prisma";

const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

export interface AuthRequest extends Request {
  user: {
    id: string;
    clerkId: string;
    email: string;
    name: string;
    avatar: string | null;
  };
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing authorization header" });
      return;
    }

    const token = authHeader.slice(7);

    let clerkUserId: string;
    try {
      const payload = await clerk.verifyToken(token);
      clerkUserId = payload.sub;
    } catch {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        avatar: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: "User not found. Please sync account." });
      return;
    }

    (req as AuthRequest).user = user;
    next();
  } catch (err) {
    next(err);
  }
}