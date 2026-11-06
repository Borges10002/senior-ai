import { inject, injectable } from "tsyringe";
import { podeReprocessar } from "@modules/gravacoes/domain/gravacao";
import IFilaProcessamento from "@modules/gravacoes/domain/IFilaProcessamento";
import IGravacaoRepository from "@modules/gravacoes/domain/repositories/IGravacaoRepository";
import AppError from "@shared/errors/AppError";

@injectable()
export class ReprocessarGravacaoUseCase {
  constructor(
    @inject("GravacaoRepository")
    private gravacaoRepository: IGravacaoRepository,
    @inject("FilaProcessamento")
    private fila: IFilaProcessamento,
  ) {}

  async execute(id: string, codusuario: number): Promise<void> {
    const gravacao = await this.gravacaoRepository.findByIdDoUsuario(id, codusuario);
    if (!gravacao) throw new AppError("Gravação não encontrada.", 404);
    if (!podeReprocessar(gravacao.status)) {
      throw new AppError("Só uma gravação com falha pode ser reprocessada.", 409);
    }
    await this.gravacaoRepository.atualizar(id, { status: "ENVIADA", erro: null });
    await this.fila.enfileirarTranscricao(id);
  }
}
