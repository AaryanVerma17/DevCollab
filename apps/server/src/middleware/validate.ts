import type { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

function formatZodError(err: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const path = issue.path.join(".") || "root";
    if (!formatted[path]) formatted[path] = [];
    formatted[path].push(issue.message);
  }
  return formatted;
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        details: formatZodError(result.error),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        error: "Invalid query parameters",
        details: formatZodError(result.error),
      });
      return;
    }
    req.query = result.data as any;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(400).json({
        error: "Invalid route parameters",
        details: formatZodError(result.error),
      });
      return;
    }
    req.params = result.data as any;
    next();
  };
}