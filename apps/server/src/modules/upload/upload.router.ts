import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { requireAuth, type AuthRequest } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate";
import { z } from "zod";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../../env";
import { uploadRateLimiter } from "../../middleware/rate-limiter";
import { randomUUID } from "crypto";

const router = Router();
router.use(requireAuth, uploadRateLimiter);

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const presignSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  size: z.number().int().positive().max(50 * 1024 * 1024), // 50MB max
});

router.post("/presigned", validateBody(presignSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename, mimeType, size } = req.body;
    const ext = filename.split(".").pop() ?? "";
    const key = `uploads/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      ContentType: mimeType,
      ContentLength: size,
    });

    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

    res.json({ presignedUrl, key, publicUrl });
  } catch (err) { next(err); }
});

const confirmSchema = z.object({
  key: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
});

router.post("/confirm", validateBody(confirmSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key, filename, mimeType, size } = req.body;
    const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;
    res.json({ url: publicUrl, key, filename, mimeType, size });
  } catch (err) { next(err); }
});

export default router;