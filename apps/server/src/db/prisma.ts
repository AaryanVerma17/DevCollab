import { PrismaClient } from "@prisma/client";

const isDev = process.env.NODE_ENV === "development";

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: isDev
      ? [
          { level: "query", emit: "event" },
          { level: "warn", emit: "stdout" },
          { level: "error", emit: "stdout" },
        ]
      : [{ level: "error", emit: "stdout" }],
  });
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ?? (global.__prisma = createPrismaClient());

if (isDev && prisma.$on) {
  (prisma as any).$on("query", (e: any) => {
    if (process.env.LOG_QUERIES === "true") {
      console.log(`Query: ${e.query} — ${e.duration}ms`);
    }
  });
}

export default prisma;