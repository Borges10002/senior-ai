import { inject, injectable } from "tsyringe";
import { garantirTransicao, type StatusReuniao } from "@modules/reunioes/domain/reuniao";
import type IReuniaoRepository from "@modules/reunioes/domain/repositories/IReuniaoRepository";
import type { Reuniao } from "@modules/reunioes/infra/typeorm/entities/Reuniao";
import { GetReuniaoUseCase } from "./GetReuniaoUseCase";

type Acao = "iniciar" | "finalizar" | "cancelar";

const DESTINO: Record<Acao, StatusReuniao> = {
  iniciar: "EM_ANDAMENTO",
  finalizar: "FINALIZADA",
  cancelar: "CANCELADA",
};

@injectable()
class MudarStatusReuniaoUseCase {
  constructor(
    @inject("ReuniaoRepository")
    private reuniaoRepository: IReuniaoRepository,
    @inject(GetReuniaoUseCase)
    private getReuniao: GetReuniaoUseCase,
  ) {}

  async execute(id: string, proprietarioId: string, acao: Acao, agora = new Date()): Promise<Reuniao> {
    const reuniao = await this.getReuniao.execute(id, proprietarioId);
    const destino = DESTINO[acao];
    garantirTransicao(reuniao.status, destino);

    reuniao.status = destino;
    if (acao === "iniciar") reuniao.iniciada_em = agora;
    if (acao === "finalizar") reuniao.finalizada_em = agora;
    // Ao finalizar, a Fase 3 enfileira aqui a transcrição e a geração da ata.
    return this.reuniaoRepository.save(reuniao);
  }
}

export { MudarStatusReuniaoUseCase };
