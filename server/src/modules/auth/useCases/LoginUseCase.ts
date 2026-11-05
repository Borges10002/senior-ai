import { randomUUID } from "crypto";
import { compare, hash } from "bcryptjs";
import { inject, injectable } from "tsyringe";
import type ISessaoRepository from "@modules/auth/domain/repositories/ISessaoRepository";
import { emitirAccessToken, expiracaoRefresh, gerarRefreshToken } from "@modules/auth/domain/tokens";
import { Sessao } from "@modules/auth/infra/typeorm/entities/Sessao";
import { RegistrarAuditoriaUseCase } from "@modules/auditoria/useCases/RegistrarAuditoriaUseCase";
import type IUsuarioRepository from "@modules/usuarios/domain/repositories/IUsuarioRepository";
import { CUSTO_BCRYPT, usuarioPublico, type UsuarioPublico } from "@modules/usuarios/useCases/CreateUsuarioUseCase";
import mensagens from "@/constants/mensagem.constants";
import AppError from "@shared/errors/AppError";

export interface LoginDTO {
  email: string;
  senha: string;
  ip?: string | null;
  userAgent?: string | null;
}

export interface TokensSessao {
  accessToken: string;
  refreshToken: string;
  usuario: UsuarioPublico;
}

// Hash real de uma senha aleatória: quando o e-mail não existe o bcrypt gasta o mesmo tempo,
// e ninguém descobre contas cadastradas pelo tempo de resposta.
let hashFalso: Promise<string> | null = null;
const HASH_FALSO = () => (hashFalso ??= hash(randomUUID(), CUSTO_BCRYPT));

@injectable()
class LoginUseCase {
  constructor(
    @inject("UsuarioRepository")
    private usuarioRepository: IUsuarioRepository,
    @inject("SessaoRepository")
    private sessaoRepository: ISessaoRepository,
    @inject(RegistrarAuditoriaUseCase)
    private auditoria: RegistrarAuditoriaUseCase,
  ) {}

  async execute({ email, senha, ip, userAgent }: LoginDTO): Promise<TokensSessao> {
    const usuario = await this.usuarioRepository.findByEmail(email);
    const senhaOk = await compare(String(senha || ""), usuario?.senha_hash ?? (await HASH_FALSO()));
    if (!usuario || !senhaOk || !usuario.ativo) {
      throw new AppError(mensagens.CREDENCIAIS_INVALIDAS, 401);
    }

    const sessaoId = randomUUID();
    const refresh = gerarRefreshToken(sessaoId);
    await this.sessaoRepository.create(
      Object.assign(new Sessao(), {
        id: sessaoId,
        usuario_id: usuario.id,
        refresh_hash: refresh.hash,
        expira_em: expiracaoRefresh(),
        revogada_em: null,
        ip: ip?.slice(0, 64) ?? null,
        user_agent: userAgent?.slice(0, 255) ?? null,
      }),
    );

    await this.auditoria.execute({
      usuarioId: usuario.id,
      acao: "auth.login",
      entidade: "sessao",
      entidadeId: sessaoId,
      ip,
    });

    return {
      accessToken: emitirAccessToken({ sub: usuario.id, sid: sessaoId, cv: usuario.versao_credencial }),
      refreshToken: refresh.token,
      usuario: usuarioPublico(usuario),
    };
  }
}

export { LoginUseCase };
