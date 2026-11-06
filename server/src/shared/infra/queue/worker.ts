/**
 * Processo separado que consome as filas do BullMQ (transcrição e análise).
 * Roda como serviço `worker` no docker-compose: `npm run dev:worker` / `npm run start:worker`.
 */
// O worker não aplica migrations (é papel da API): precisa vir antes do DataSource.
import "@shared/infra/scripts/semSincronizar";
import "reflect-metadata";
import "@/config/env";
import "@shared/container";
import { Worker } from "bullmq";
import { redisConnection } from "@config/redis.config";
import { TipecDataSource } from "@shared/infra/typeorm";
import type { NomeFila } from "./filas";
import { processadores } from "./processadores";

async function iniciar(): Promise<void> {
  await TipecDataSource.initialize();

  const workers = (Object.keys(processadores) as NomeFila[]).map((nome) => {
    const worker = new Worker(nome, processadores[nome], {
      connection: redisConnection,
      concurrency: 2,
      // Vídeos longos levam tempo: o job não pode ser dado como travado no meio.
      lockDuration: 5 * 60 * 1000,
      maxStalledCount: 1,
    });
    worker.on("failed", (job, erro) =>
      console.error(`[Senior AI Worker] Job ${job?.id} da fila ${nome} falhou:`, erro.message),
    );
    console.log(`[Senior AI Worker] Consumindo a fila ${nome}.`);
    return worker;
  });

  const encerrar = async () => {
    await Promise.all(workers.map((w) => w.close()));
    await TipecDataSource.destroy();
    process.exit(0);
  };
  process.on("SIGTERM", encerrar);
  process.on("SIGINT", encerrar);
}

iniciar().catch((erro) => {
  console.error("[Senior AI Worker] Falha ao iniciar:", erro);
  process.exit(1);
});
