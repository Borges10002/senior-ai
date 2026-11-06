import ISegmentoRepository from "@modules/transcricoes/domain/repositories/ISegmentoRepository";
import { SegmentoTranscricao } from "@modules/transcricoes/infra/typeorm/entities/SegmentoTranscricao";
import { TipecDataSource } from "@shared/infra/typeorm";

export class SegmentoRepository implements ISegmentoRepository {
  async substituir(gravacaoId: string, segmentos: SegmentoTranscricao[]): Promise<void> {
    await TipecDataSource.transaction(async (manager) => {
      await manager.delete(SegmentoTranscricao, { gravacao_id: gravacaoId });
      await manager.save(SegmentoTranscricao, segmentos, { chunk: 200 });
    });
  }

  listByGravacao(gravacaoId: string): Promise<SegmentoTranscricao[]> {
    return TipecDataSource.getRepository(SegmentoTranscricao).find({
      where: { gravacao_id: gravacaoId },
      order: { ordem: "ASC" },
    });
  }
}
