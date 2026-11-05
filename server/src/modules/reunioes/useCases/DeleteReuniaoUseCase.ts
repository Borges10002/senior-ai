import { inject, injectable } from "tsyringe";
import { podeExcluir } from "@modules/reunioes/domain/reuniao";
import type IReuniaoRepository from "@modules/reunioes/domain/repositories/IReuniaoRepository";
import { RegistrarAuditoriaUseCase } from "@modules/auditoria/useCases/RegistrarAuditoriaUseCase";
import AppError from "@shared/errors/AppError";
import { GetReuniaoUseCase } from "./GetReuniaoUseCase";

@injectable()
class DeleteReuniaoUseCase {
  constructor(
    @inject("ReuniaoRepository")
    private reuniaoRepository: IReuniaoRepository,
    @inject(GetReuniaoUseCase)
    private getReuniao: GetReuniaoUseCase,
    @inject(RegistrarAuditoriaUseCase)
    private auditoria: RegistrarAuditoriaUseCase,
  ) {}

  async execute(id: string, proprietarioId: string, ip?: string | null): Promise<void> {
    const reuniao = await this.getReuniao.execute(id, proprietarioId);
    if (!podeExcluir(reuniao.status)) {
      throw new AppError("Reunião iniciada ou finalizada não pode ser excluída.", 409);
    }
    await this.reuniaoRepository.delete(reuniao.id);
    await this.auditoria.execute({
      usuarioId: proprietarioId,
      acao: "reuniao.excluida",
      entidade: "reuniao",
      entidadeId: reuniao.id,
      dados: { titulo: reuniao.titulo },
      ip,
    });
  }
}

export { DeleteReuniaoUseCase };
