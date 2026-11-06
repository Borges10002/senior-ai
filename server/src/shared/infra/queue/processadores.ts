import type { Job, Processor } from "bullmq";
import { container } from "tsyringe";
import { AnalisarGravacaoUseCase } from "@modules/anotacoes/useCases/AnalisarGravacaoUseCase";
import IGravacaoRepository from "@modules/gravacoes/domain/repositories/IGravacaoRepository";
import { TranscreverGravacaoUseCase } from "@modules/transcricoes/useCases/TranscreverGravacaoUseCase";
import { FILAS, type NomeFila } from "./filas";

interface DadosJob {
  gravacaoId: string;
}

const ERRO_USUARIO = "Não foi possível processar a gravação. O vídeo foi preservado; tente reprocessar.";

/** Na última tentativa marca a falha para o app. O erro bruto fica só no log do worker. */
function comRegistroDeFalha(etapa: (gravacaoId: string) => Promise<void>): Processor<DadosJob> {
  return async (job: Job<DadosJob>) => {
    try {
      await etapa(job.data.gravacaoId);
    } catch (erro) {
      if (job.attemptsMade + 1 >= (job.opts.attempts ?? 1)) {
        await container
          .resolve<IGravacaoRepository>("GravacaoRepository")
          .atualizar(job.data.gravacaoId, { status: "FALHOU", erro: ERRO_USUARIO });
      }
      throw erro;
    }
  };
}

export const processadores: Record<NomeFila, Processor<DadosJob>> = {
  [FILAS.TRANSCRICAO]: comRegistroDeFalha((id) => container.resolve(TranscreverGravacaoUseCase).execute(id)),
  [FILAS.ANALISE_IA]: comRegistroDeFalha((id) => container.resolve(AnalisarGravacaoUseCase).execute(id)),
};
