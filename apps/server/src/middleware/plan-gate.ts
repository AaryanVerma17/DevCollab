import type { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma";
import type { AuthRequest } from "./auth.middleware";

export function requirePro(paramName: string = "workspaceId") {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const workspaceId =
        req.params[paramName] ??
        req.body?.workspaceId ??
        req.query?.workspaceId;

      if (!workspaceId) {
        res.status(400).json({ error: "workspaceId is required for plan check" });
        return;
      }

      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId as string },
        select: { plan: true, name: true },
      });

      if (!workspace) {
        res.status(404).json({ error: "Workspace not found" });
        return;
      }

      if (workspace.plan !== "PRO") {
        res.status(403).json({
          error: "Pro plan required",
          message: `This feature requires a Pro plan. Upgrade "${workspace.name}" to unlock AI-powered features, unlimited members, and more.`,
          upgradeUrl: `/workspace/${workspaceId}/settings/billing`,
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireWorkspaceRole(
  roles: ("OWNER" | "ADMIN" | "MEMBER" | "VIEWER")[],
  workspaceIdParam: string = "workspaceId"
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const workspaceId = req.params[workspaceIdParam] ?? req.params["id"];

      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: workspaceId as string,
            userId: authReq.user.id,
          },
        },
        select: { role: true },
      });

      if (!member) {
        res.status(403).json({ error: "Not a member of this workspace" });
        return;
      }

      if (!roles.includes(member.role as any)) {
        res.status(403).json({
          error: `Insufficient permissions. Required: ${roles.join(" or ")}`,
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}