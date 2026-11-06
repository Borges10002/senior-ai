import { inject, injectable } from "tsyringe";
import IReuniaoRepository from "@modules/reunioes/domain/repositories/IReuniaoRepository";
import type { FiltroReunioes } from "@modules/reunioes/domain/repositories/IReuniaoRepository";
import type { Reuniao } from "@modules/reunioes/infra/typeorm/entities/Reuniao";

@injectable()
class ListReunioesUseCase {
  constructor(
    @inject("ReuniaoRepository")
    private reuniaoRepository: IReuniaoRepository,
  ) {}

  execute(codusuario: number, filtro: FiltroReunioes = {}): Promise<Reuniao[]> {
    return this.reuniaoRepository.listByProprietario(codusuario, filtro);
  }
}

export { ListReunioesUseCase };
