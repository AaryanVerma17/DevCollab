import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { requireAuth, type AuthRequest } from "../../middleware/auth.middleware";
import { validateBody, validateQuery } from "../../middleware/validate";
import { z } from "zod";
import * as service from "./snippet.service";

export const snippetProjectRouter = Router({ mergeParams: true });
snippetProjectRouter.use(requireAuth);

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  code: z.string().min(1),
  language: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

const listQuerySchema = z.object({
  search: z.string().optional(),
  tag: z.string().optional(),
});

snippetProjectRouter.post("/", validateBody(createSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthRequest;
    const snippet = await service.createSnippet(req.params.projectId, user.id, { name: user.name, avatar: user.avatar }, req.body);
    res.status(201).json({ snippet });
  } catch (err) { next(err); }
});

snippetProjectRouter.get("/", validateQuery(listQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const snippets = await service.listSnippets(req.params.projectId, req.query.search as string, req.query.tag as string);
    res.json({ snippets });
  } catch (err) { next(err); }
});

export const snippetRouter = Router();
snippetRouter.use(requireAuth);

snippetRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const snippet = await service.getSnippet(req.params.id);
    res.json({ snippet });
  } catch (err) { next(err); }
});

const updateSchema = createSchema.partial();

snippetRouter.patch("/:id", validateBody(updateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const snippet = await service.updateSnippet(req.params.id, req.body);
    res.json({ snippet });
  } catch (err) { next(err); }
});

snippetRouter.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.deleteSnippet(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});