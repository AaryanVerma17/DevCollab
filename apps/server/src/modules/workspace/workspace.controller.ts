import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware";
import * as service from "./workspace.service";

export async function createWorkspace(req: Request, res: Response, next: NextFunction) {
  try {
    const { user } = req as AuthRequest;
    const workspace = await service.createWorkspace(user.id, req.body.name, req.body.slug);
    res.status(201).json({ workspace });
  } catch (err) { next(err); }
}

export async function listWorkspaces(req: Request, res: Response, next: NextFunction) {
  try {
    const { user } = req as AuthRequest;
    const workspaces = await service.listWorkspacesForUser(user.id);
    res.json({ workspaces });
  } catch (err) { next(err); }
}

export async function getWorkspace(req: Request, res: Response, next: NextFunction) {
  try {
    const { user } = req as AuthRequest;
    const workspace = await service.getWorkspaceBySlug(req.params.slug, user.id);
    res.json({ workspace });
  } catch (err) { next(err); }
}

export async function updateWorkspace(req: Request, res: Response, next: NextFunction) {
  try {
    const { user } = req as AuthRequest;
    const workspace = await service.updateWorkspace(req.params.id, user.id, req.body);
    res.json({ workspace });
  } catch (err) { next(err); }
}

export async function deleteWorkspace(req: Request, res: Response, next: NextFunction) {
  try {
    const { user } = req as AuthRequest;
    await service.deleteWorkspace(req.params.id, user.id);
    res.status(204).send();
  } catch (err) { next(err); }
}