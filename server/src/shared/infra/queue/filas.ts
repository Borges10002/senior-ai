import { Queue } from "bullmq";
import { redisConnection } from "@config/redis.config";

/** Nomes das filas do processamento assíncrono (seção 13 do README). */
export const FILAS = {
  TRANSCRICAO: "transcricao",
  ANALISE_IA: "analise-ia",
} as const;
export type NomeFila = (typeof FILAS)[keyof typeof FILAS];

const filas = new Map<NomeFila, Queue>();

/** Fila criada sob demanda: a API só abre conexão com o Redis quando enfileira algo. */
export function fila(nome: NomeFila): Queue {
  let existente = filas.get(nome);
  if (!existente) {
    existente = new Queue(nome, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 30_000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });
    filas.set(nome, existente);
  }
  return existente;
}

export async function fecharFilas(): Promise<void> {
  await Promise.all([...filas.values()].map((f) => f.close()));
  filas.clear();
}
