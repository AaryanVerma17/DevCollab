import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import type { Request, Response, NextFunction } from "express";
import { getProjectActivity } from "./activity.service";

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(Number(req.query.limit ?? 20), 50);
    const result = await getProjectActivity(projectId, cursor, limit);
    res.json(result);
  } catch (err) { next(err); }
});

export default router;