import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { requireAuth, type AuthRequest } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate";
import { z } from "zod";
import * as service from "./project.service";

const router = Router({ mergeParams: true });
router.use(requireAuth);

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

const updateSchema = createSchema.partial();

// POST /workspaces/:workspaceId/projects
router.post("/", validateBody(createSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthRequest;
    const project = await service.createProject(
      req.params.workspaceId,
      user.id,
      req.body,
      { name: user.name, avatar: user.avatar }
    );
    res.status(201).json({ project });
  } catch (err) { next(err); }
});

// GET /workspaces/:workspaceId/projects
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthRequest;
    const projects = await service.listProjects(req.params.workspaceId, user.id);
    res.json({ projects });
  } catch (err) { next(err); }
});

export default router;

// Standalone project routes (mounted at /projects)
export const projectRouter = Router();
projectRouter.use(requireAuth);

projectRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthRequest;
    const project = await service.getProject(req.params.id, user.id);
    res.json({ project });
  } catch (err) { next(err); }
});

projectRouter.patch("/:id", validateBody(updateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthRequest;
    const project = await service.updateProject(req.params.id, user.id, req.body);
    res.json({ project });
  } catch (err) { next(err); }
});

projectRouter.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthRequest;
    await service.deleteProject(req.params.id, user.id);
    res.status(204).send();
  } catch (err) { next(err); }
});