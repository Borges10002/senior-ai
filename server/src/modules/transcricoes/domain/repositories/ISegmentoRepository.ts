import type { SegmentoTranscricao } from "@modules/transcricoes/infra/typeorm/entities/SegmentoTranscricao";

export default interface ISegmentoRepository {
  /** Troca os segmentos da gravação de uma vez: reprocessar não duplica. */
  substituir(gravacaoId: string, segmentos: SegmentoTranscricao[]): Promise<void>;
  listByGravacao(gravacaoId: string): Promise<SegmentoTranscricao[]>;
}
