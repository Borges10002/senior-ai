/**
 * Processo separado que consome as filas do BullMQ (transcrição, atas, extração de tarefas).
 * Roda como serviço `worker` no docker-compose: `npm run dev:worker` / `npm run start:worker`.
 */
import "reflect-metadata";
import "@/config/env";
import "@shared/container";
import { Worker, type Processor } from "bullmq";
import { redisConnection } from "@config/redis.config";
import { AppDataSource } from "@shared/infra/typeorm";
import type { NomeFila } from "./filas";

/**
 * Cada módulo registra aqui o processador da sua fila, por exemplo:
 *   [FILAS.TRANSCRICAO]: transcreverGravacao,   // modules/transcricoes/infra/jobs
 * Fase 3 do roadmap.
 */
const processadores: Partial<Record<NomeFila, Processor>> = {};

async function iniciar(): Promise<void> {
  const entradas = Object.entries(processadores) as [NomeFila, Processor][];
  if (!entradas.length) {
    console.log("[Senior AI Worker] Nenhum processador registrado ainda. Encerrando.");
    return;
  }

  // O worker não aplica migrations: isso é papel da API.
  process.env.DB_MIGRATIONS_RUN = "false";
  await AppDataSource.initialize();

  const workers = entradas.map(([nome, processador]) => {
    const worker = new Worker(nome, processador, { connection: redisConnection, concurrency: 2 });
    worker.on("failed", (job, erro) =>
      console.error(`[Senior AI Worker] Job ${job?.id} da fila ${nome} falhou:`, erro.message),
    );
    console.log(`[Senior AI Worker] Consumindo a fila ${nome}.`);
    return worker;
  });

  const encerrar = async () => {
    await Promise.all(workers.map((w) => w.close()));
    await AppDataSource.destroy();
    process.exit(0);
  };
  process.on("SIGTERM", encerrar);
  process.on("SIGINT", encerrar);
}

iniciar().catch((erro) => {
  console.error("[Senior AI Worker] Falha ao iniciar:", erro);
  process.exit(1);
});
