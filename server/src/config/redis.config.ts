import "@/config/env";

/** Opções aceitas tanto pelo BullMQ quanto pelo ioredis. */
export const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  // Exigido pelo BullMQ nos workers.
  maxRetriesPerRequest: null,
};
