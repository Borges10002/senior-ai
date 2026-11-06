import { Router } from "express";
import Redis from "ioredis";
import { redisConnection } from "@config/redis.config";
import { TipecDataSource } from "@shared/infra/typeorm";

const healthRoutes = Router();

async function redisOk(): Promise<boolean> {
  const cliente = new Redis({ ...redisConnection, lazyConnect: true, connectTimeout: 2000, maxRetriesPerRequest: 0 });
  try {
    await cliente.connect();
    return (await cliente.ping()) === "PONG";
  } catch {
    return false;
  } finally {
    cliente.disconnect();
  }
}

/** Público: usado pelo healthcheck do Docker e pelo monitoramento. Não expõe detalhes de erro. */
healthRoutes.get("/health", async (_req, res) => {
  const banco = await TipecDataSource.query("SELECT 1").then(() => true, () => false);
  const redis = await redisOk();
  const ok = banco && redis;
  res.status(ok ? 200 : 503).json({ status: ok ? "ok" : "degradado", banco, redis });
});

export { healthRoutes };
