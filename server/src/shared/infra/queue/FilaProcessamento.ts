import type IFilaProcessamento from "@modules/gravacoes/domain/IFilaProcessamento";
import { FILAS, fila } from "./filas";

/** O id do job inclui o momento: reprocessar depois de uma falha precisa gerar um job novo. */
export class FilaProcessamento implements IFilaProcessamento {
  async enfileirarTranscricao(gravacaoId: string): Promise<void> {
    await fila(FILAS.TRANSCRICAO).add("transcrever", { gravacaoId }, { jobId: `${gravacaoId}-${Date.now()}` });
  }

  async enfileirarAnalise(gravacaoId: string): Promise<void> {
    await fila(FILAS.ANALISE_IA).add("analisar", { gravacaoId }, { jobId: `${gravacaoId}-${Date.now()}` });
  }
}
