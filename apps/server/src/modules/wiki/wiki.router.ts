import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { requireAuth, type AuthRequest } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate";
import { z } from "zod";
import * as service from "./wiki.service";

export const wikiProjectRouter = Router({ mergeParams: true });
wikiProjectRouter.use(requireAuth);

const createSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().optional(),
  parentPageId: z.string().uuid().optional(),
});

wikiProjectRouter.post("/", validateBody(createSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthRequest;
    const page = await service.createPage(req.params.projectId, user.id, { name: user.name, avatar: user.avatar }, req.body);
    res.status(201).json({ page });
  } catch (err) { next(err); }
});

wikiProjectRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pages = await service.listPages(req.params.projectId);
    res.json({ pages });
  } catch (err) { next(err); }
});

export const wikiRouter = Router();
wikiRouter.use(requireAuth);

wikiRouter.get("/:pageId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = await service.getPage(req.params.pageId);
    res.json({ page });
  } catch (err) { next(err); }
});

const saveSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  content: z.string(),
});

wikiRouter.put("/:pageId", validateBody(saveSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthRequest;
    const page = await service.savePage(req.params.pageId, user.id, { name: user.name, avatar: user.avatar }, req.body);
    res.json({ page });
  } catch (err) { next(err); }
});

wikiRouter.get("/:pageId/history", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const versions = await service.getPageHistory(req.params.pageId);
    res.json({ versions });
  } catch (err) { next(err); }
});

wikiRouter.get("/:pageId/history/:versionId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const version = await service.getVersion(req.params.pageId, req.params.versionId);
    res.json({ version });
  } catch (err) { next(err); }
});