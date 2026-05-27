import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { requireAuth, type AuthRequest } from "../../middleware/auth.middleware";
import * as service from "./notification.service";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthRequest;
    const notifications = await service.listNotifications(user.id);
    res.json({ notifications });
  } catch (err) { next(err); }
});

router.patch("/:id/read", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthRequest;
    await service.markRead(req.params.id, user.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.patch("/read-all", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthRequest;
    await service.markAllRead(user.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;