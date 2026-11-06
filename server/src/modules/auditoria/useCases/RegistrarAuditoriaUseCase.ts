import { randomUUID } from "crypto";
import { inject, injectable } from "tsyringe";
import IAuditoriaRepository from "@modules/auditoria/domain/repositories/IAuditoriaRepository";
import { RegistroAuditoria } from "@modules/auditoria/infra/typeorm/entities/RegistroAuditoria";

export interface RegistrarAuditoriaDTO {
  codusuario: number | null;
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  dados?: Record<string, unknown> | null;
  ip?: string | null;
}

/** RN010: autorizações e ações sensíveis deixam rastro. Nunca grave senhas ou tokens em `dados`. */
@injectable()
class RegistrarAuditoriaUseCase {
  constructor(
    @inject("AuditoriaRepository")
    private auditoriaRepository: IAuditoriaRepository,
  ) {}

  async execute(dto: RegistrarAuditoriaDTO): Promise<void> {
    await this.auditoriaRepository.create(
      Object.assign(new RegistroAuditoria(), {
        id: randomUUID(),
        codusuario: dto.codusuario,
        acao: dto.acao,
        entidade: dto.entidade,
        entidade_id: dto.entidadeId ?? null,
        dados: dto.dados ?? null,
        ip: dto.ip?.slice(0, 64) ?? null,
      }),
    );
  }
}

export { RegistrarAuditoriaUseCase };
