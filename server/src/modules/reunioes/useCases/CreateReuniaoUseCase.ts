import { randomUUID } from "crypto";
import { inject, injectable } from "tsyringe";
import type IReuniaoRepository from "@modules/reunioes/domain/repositories/IReuniaoRepository";
import { Reuniao } from "@modules/reunioes/infra/typeorm/entities/Reuniao";
import AppError from "@shared/errors/AppError";

export interface DadosReuniaoDTO {
  titulo: string;
  assunto?: string | null;
  objetivo?: string | null;
  local?: string | null;
  inicio_previsto?: Date | null;
  fim_previsto?: Date | null;
}

export function garantirPeriodo(inicio?: Date | null, fim?: Date | null): void {
  if (inicio && fim && fim.getTime() <= inicio.getTime()) {
    throw new AppError("O término previsto deve ser depois do início.", 400);
  }
}

@injectable()
class CreateReuniaoUseCase {
  constructor(
    @inject("ReuniaoRepository")
    private reuniaoRepository: IReuniaoRepository,
  ) {}

  async execute(proprietarioId: string, dados: DadosReuniaoDTO): Promise<Reuniao> {
    garantirPeriodo(dados.inicio_previsto, dados.fim_previsto);
    return this.reuniaoRepository.create(
      Object.assign(new Reuniao(), {
        id: randomUUID(),
        proprietario_id: proprietarioId,
        titulo: dados.titulo.trim(),
        assunto: dados.assunto?.trim() || null,
        objetivo: dados.objetivo?.trim() || null,
        local: dados.local?.trim() || null,
        status: "AGENDADA",
        inicio_previsto: dados.inicio_previsto ?? null,
        fim_previsto: dados.fim_previsto ?? null,
        iniciada_em: null,
        finalizada_em: null,
      }),
    );
  }
}

export { CreateReuniaoUseCase };
