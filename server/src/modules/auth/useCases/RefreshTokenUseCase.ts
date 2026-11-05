import { inject, injectable } from "tsyringe";
import type ISessaoRepository from "@modules/auth/domain/repositories/ISessaoRepository";
import {
  emitirAccessToken,
  expiracaoRefresh,
  gerarRefreshToken,
  hashConfere,
  hashRefresh,
  lerRefreshToken,
} from "@modules/auth/domain/tokens";
import { RegistrarAuditoriaUseCase } from "@modules/auditoria/useCases/RegistrarAuditoriaUseCase";
import type IUsuarioRepository from "@modules/usuarios/domain/repositories/IUsuarioRepository";
import { usuarioPublico } from "@modules/usuarios/useCases/CreateUsuarioUseCase";
import mensagens from "@/constants/mensagem.constants";
import AppError from "@shared/errors/AppError";
import type { TokensSessao } from "./LoginUseCase";

/**
 * Renova a sessão com rotação: cada refresh token vale uma única vez.
 * Reuso de um token já trocado indica roubo, então a sessão inteira é revogada.
 */
@injectable()
class RefreshTokenUseCase {
  constructor(
    @inject("UsuarioRepository")
    private usuarioRepository: IUsuarioRepository,
    @inject("SessaoRepository")
    private sessaoRepository: ISessaoRepository,
    @inject(RegistrarAuditoriaUseCase)
    private auditoria: RegistrarAuditoriaUseCase,
  ) {}

  async execute(refreshToken: string, ip?: string | null): Promise<TokensSessao> {
    const invalido = () => new AppError(mensagens.TOKEN_INVALIDO, 401);
    const lido = lerRefreshToken(refreshToken);
    if (!lido) throw invalido();

    const sessao = await this.sessaoRepository.findById(lido.sessaoId);
    if (!sessao || sessao.revogada_em || sessao.expira_em.getTime() <= Date.now()) throw invalido();

    if (!hashConfere(hashRefresh(lido.segredo), sessao.refresh_hash)) {
      sessao.revogada_em = new Date();
      await this.sessaoRepository.save(sessao);
      await this.auditoria.execute({
        usuarioId: sessao.usuario_id,
        acao: "auth.refresh_reutilizado",
        entidade: "sessao",
        entidadeId: sessao.id,
        ip,
      });
      throw invalido();
    }

    const usuario = await this.usuarioRepository.findById(sessao.usuario_id);
    if (!usuario || !usuario.ativo) throw invalido();

    const novo = gerarRefreshToken(sessao.id);
    sessao.refresh_hash = novo.hash;
    sessao.expira_em = expiracaoRefresh();
    await this.sessaoRepository.save(sessao);

    return {
      accessToken: emitirAccessToken({ sub: usuario.id, sid: sessao.id, cv: usuario.versao_credencial }),
      refreshToken: novo.token,
      usuario: usuarioPublico(usuario),
    };
  }
}

export { RefreshTokenUseCase };
