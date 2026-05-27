import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { requireAuth, type AuthRequest } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate";
import { z } from "zod";
import * as service from "./task.service";

// Mounted at /projects/:projectId/tasks
export const taskProjectRouter = Router({ mergeParams: true });
taskProjectRouter.use(requireAuth);

const createSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  priority: z.enum(["P0", "P1", "P2"]).optional(),
  assigneeId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  labels: z.array(z.string()).optional(),
});

taskProjectRouter.post("/", validateBody(createSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthRequest;
    const task = await service.createTask(req.params.projectId, user.id, { name: user.name, avatar: user.avatar }, req.body);
    res.status(201).json({ task });
  } catch (err) { next(err); }
});

taskProjectRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = await service.listTasksByProject(req.params.projectId);
    res.json({ tasks });
  } catch (err) { next(err); }
});

// Standalone task routes at /tasks/:id
export const taskRouter = Router();
taskRouter.use(requireAuth);

taskRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await service.getTask(req.params.id);
    res.json({ task });
  } catch (err) { next(err); }
});

const updateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  priority: z.enum(["P0", "P1", "P2"]).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  labels: z.array(z.string()).optional(),
});

taskRouter.patch("/:id", validateBody(updateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthRequest;
    const task = await service.updateTask(req.params.id, user.id, { name: user.name, avatar: user.avatar }, req.body);
    res.json({ task });
  } catch (err) { next(err); }
});

const moveSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
  position: z.number(),
});

taskRouter.patch("/:id/move", validateBody(moveSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthRequest;
    const { status, position } = req.body;
    const task = await service.moveTask(req.params.id, user.id, { name: user.name, avatar: user.avatar }, status, position);
    res.json({ task });
  } catch (err) { next(err); }
});

taskRouter.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthRequest;
    await service.deleteTask(req.params.id, user.id, { name: user.name, avatar: user.avatar });
    res.status(204).send();
  } catch (err) { next(err); }
});

const commentSchema = z.object({ content: z.string().min(1).max(5000) });

taskRouter.post("/:id/comments", validateBody(commentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthRequest;
    const comment = await service.addComment(req.params.id, user.id, { name: user.name, avatar: user.avatar }, req.body.content);
    res.status(201).json({ comment });
  } catch (err) { next(err); }
});

const attachmentSchema = z.object({
  filename: z.string().min(1),
  url: z.string().url(),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
});

taskRouter.post("/:id/attachments", validateBody(attachmentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthRequest;
    const attachment = await service.addAttachment(req.params.id, user.id, req.body);
    res.status(201).json({ attachment });
  } catch (err) { next(err); }
});