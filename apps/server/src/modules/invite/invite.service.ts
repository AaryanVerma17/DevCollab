import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { requireAuth, type AuthRequest } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { AppError } from "../../middleware/error-handler";
import { emailQueue } from "../../jobs/queue";
import { env } from "../../env";

const router = Router({ mergeParams: true });
router.use(requireAuth);

const createInviteSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
});

// POST /workspaces/:workspaceId/invites
router.post("/", validateBody(createInviteSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthRequest;
    const { workspaceId } = req.params;

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
      select: { role: true },
    });
    if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
      throw new AppError(403, "Only owners and admins can create invites");
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await prisma.invite.create({
      data: {
        workspaceId,
        invitedById: user.id,
        email: req.body.email ?? null,
        role: req.body.role,
        expiresAt,
      },
      select: {
        id: true, token: true, role: true, expiresAt: true, email: true,
        workspace: { select: { name: true, slug: true } },
      },
    });

    const link = `${env.APP_URL}/invite/${invite.token}`;

    if (invite.email) {
      await emailQueue.add("send-invite", {
        to: invite.email,
        workspaceName: invite.workspace.name,
        inviterName: user.name,
        link,
      });
    }

    res.status(201).json({ invite: { ...invite, link } });
  } catch (err) { next(err); }
});

export default router;

// Standalone invite routes
export const inviteRouter = Router();
inviteRouter.use(requireAuth);

inviteRouter.get("/:token", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invite = await prisma.invite.findUnique({
      where: { token: req.params.token },
      select: {
        id: true, token: true, role: true, expiresAt: true, usedAt: true,
        workspace: { select: { id: true, name: true, slug: true, plan: true } },
        invitedBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    if (!invite) throw new AppError(404, "Invite not found");
    if (invite.usedAt) throw new AppError(410, "Invite has already been used");
    if (new Date() > invite.expiresAt) throw new AppError(410, "Invite has expired");

    res.json({ invite });
  } catch (err) { next(err); }
});

inviteRouter.post("/:token/accept", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthRequest;

    const invite = await prisma.invite.findUnique({
      where: { token: req.params.token },
      select: { id: true, workspaceId: true, role: true, expiresAt: true, usedAt: true },
    });

    if (!invite) throw new AppError(404, "Invite not found");
    if (invite.usedAt) throw new AppError(410, "Invite has already been used");
    if (new Date() > invite.expiresAt) throw new AppError(410, "Invite has expired");

    const existing = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: user.id } },
    });

    if (!existing) {
      await prisma.workspaceMember.create({
        data: { workspaceId: invite.workspaceId, userId: user.id, role: invite.role as any },
      });
    }

    await prisma.invite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });

    res.json({ success: true, workspaceId: invite.workspaceId });
  } catch (err) { next(err); }
});