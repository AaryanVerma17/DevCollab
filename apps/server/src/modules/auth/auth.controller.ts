import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../db/prisma";

export async function syncUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { clerkId, email, name, avatar } = req.body;

    const user = await prisma.user.upsert({
      where: { clerkId },
      update: { email, name, avatar: avatar ?? null },
      create: { clerkId, email, name, avatar: avatar ?? null, skills: [] },
      select: { id: true, clerkId: true, email: true, name: true, avatar: true, createdAt: true },
    });

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}