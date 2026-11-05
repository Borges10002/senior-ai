import { inject, injectable } from "tsyringe";
import type ISessaoRepository from "@modules/auth/domain/repositories/ISessaoRepository";
import { RegistrarAuditoriaUseCase } from "@modules/auditoria/useCases/RegistrarAuditoriaUseCase";

@injectable()
class LogoutUseCase {
  constructor(
    @inject("SessaoRepository")
    private sessaoRepository: ISessaoRepository,
    @inject(RegistrarAuditoriaUseCase)
    private auditoria: RegistrarAuditoriaUseCase,
  ) {}

  async execute(usuarioId: string, sessaoId: string, ip?: string | null): Promise<void> {
    const sessao = await this.sessaoRepository.findById(sessaoId);
    if (!sessao || sessao.usuario_id !== usuarioId || sessao.revogada_em) return;

    sessao.revogada_em = new Date();
    await this.sessaoRepository.save(sessao);
    await this.auditoria.execute({ usuarioId, acao: "auth.logout", entidade: "sessao", entidadeId: sessaoId, ip });
  }
}

export { LogoutUseCase };
