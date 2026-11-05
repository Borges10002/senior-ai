import { inject, injectable } from "tsyringe";
import type IReuniaoRepository from "@modules/reunioes/domain/repositories/IReuniaoRepository";
import type { FiltroReunioes } from "@modules/reunioes/domain/repositories/IReuniaoRepository";
import type { Reuniao } from "@modules/reunioes/infra/typeorm/entities/Reuniao";

@injectable()
class ListReunioesUseCase {
  constructor(
    @inject("ReuniaoRepository")
    private reuniaoRepository: IReuniaoRepository,
  ) {}

  execute(proprietarioId: string, filtro: FiltroReunioes = {}): Promise<Reuniao[]> {
    return this.reuniaoRepository.listByProprietario(proprietarioId, filtro);
  }
}

export { ListReunioesUseCase };
