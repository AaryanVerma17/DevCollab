import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate";
import { z } from "zod";
import * as ctrl from "./workspace.controller";

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
});

const updateSchema = z.object({ name: z.string().min(1).max(80).optional() });

router.post("/", validateBody(createSchema), ctrl.createWorkspace);
router.get("/", ctrl.listWorkspaces);
router.get("/:slug", ctrl.getWorkspace);
router.patch("/:id", validateBody(updateSchema), ctrl.updateWorkspace);
router.delete("/:id", ctrl.deleteWorkspace);

export default router;