import { inject, injectable } from "tsyringe";
import IReuniaoRepository from "@modules/reunioes/domain/repositories/IReuniaoRepository";
import type { Reuniao } from "@modules/reunioes/infra/typeorm/entities/Reuniao";
import AppError from "@shared/errors/AppError";
import { garantirPeriodo, type DadosReuniaoDTO } from "./CreateReuniaoUseCase";
import { GetReuniaoUseCase } from "./GetReuniaoUseCase";

@injectable()
class UpdateReuniaoUseCase {
  constructor(
    @inject("ReuniaoRepository")
    private reuniaoRepository: IReuniaoRepository,
    @inject(GetReuniaoUseCase)
    private getReuniao: GetReuniaoUseCase,
  ) {}

  async execute(id: string, codusuario: number, dados: Partial<DadosReuniaoDTO>): Promise<Reuniao> {
    const reuniao = await this.getReuniao.execute(id, codusuario);
    if (reuniao.status === "FINALIZADA" || reuniao.status === "CANCELADA") {
      throw new AppError("Reunião finalizada ou cancelada não pode ser alterada.", 409);
    }

    if (dados.titulo !== undefined) reuniao.titulo = dados.titulo.trim();
    if (dados.assunto !== undefined) reuniao.assunto = dados.assunto?.trim() || null;
    if (dados.objetivo !== undefined) reuniao.objetivo = dados.objetivo?.trim() || null;
    if (dados.local !== undefined) reuniao.local = dados.local?.trim() || null;
    if (dados.inicio_previsto !== undefined) reuniao.inicio_previsto = dados.inicio_previsto;
    if (dados.fim_previsto !== undefined) reuniao.fim_previsto = dados.fim_previsto;
    garantirPeriodo(reuniao.inicio_previsto, reuniao.fim_previsto);

    return this.reuniaoRepository.save(reuniao);
  }
}

export { UpdateReuniaoUseCase };
