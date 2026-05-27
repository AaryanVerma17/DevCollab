import Redis from "ioredis";
import { env } from "../env";

let redisClient: Redis | null = null;

function createRedisClient(): Redis {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times: number) {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
    reconnectOnError(err: Error) {
      const targetError = "READONLY";
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
  });

  client.on("connect", () => {
    console.log("[Redis] Connected");
  });

  client.on("ready", () => {
    console.log("[Redis] Ready");
  });

  client.on("error", (err: Error) => {
    console.error("[Redis] Error:", err.message);
  });

  client.on("close", () => {
    console.warn("[Redis] Connection closed");
  });

  client.on("reconnecting", () => {
    console.log("[Redis] Reconnecting...");
  });

  return client;
}

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

export function createDedicatedRedis(): Redis {
  return createRedisClient();
}

export default getRedis;