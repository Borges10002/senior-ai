import { inject, injectable } from "tsyringe";
import type IReuniaoRepository from "@modules/reunioes/domain/repositories/IReuniaoRepository";
import type { Reuniao } from "@modules/reunioes/infra/typeorm/entities/Reuniao";
import AppError from "@shared/errors/AppError";

/** Reunião de outro usuário responde 404, sem confirmar que o id existe (RN014). */
@injectable()
class GetReuniaoUseCase {
  constructor(
    @inject("ReuniaoRepository")
    private reuniaoRepository: IReuniaoRepository,
  ) {}

  async execute(id: string, proprietarioId: string): Promise<Reuniao> {
    const reuniao = await this.reuniaoRepository.findByIdDoProprietario(id, proprietarioId);
    if (!reuniao) throw new AppError("Reunião não encontrada.", 404);
    return reuniao;
  }
}

export { GetReuniaoUseCase };
