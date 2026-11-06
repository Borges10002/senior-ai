import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { inject, injectable } from "tsyringe";
import IRecuperacaoSenhaRepository from "@modules/accounts/domain/repositories/IRecuperacaoSenhaRepository";
import IUsuarioRepository from "@modules/usuario/domain/repositories/IUsuarioRepository";
import { ensureStrongPassword } from "@modules/usuario/utils/passwordSecurity";
import AppError from "@shared/errors/AppError";
import type IEmailProvider from "@shared/providers/email/IEmailProvider";
import { emailRecuperacaoSenha, urlWeb } from "@shared/providers/email/modelos";

const VALIDADE_MINUTOS = 60;
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * "Esqueci minha senha": envia um link de uso único para o e-mail cadastrado
 * e troca a senha quando a pessoa abre o link. O token nunca é guardado puro.
 */
@injectable()
class RecuperarSenhaUseCase {
  constructor(
    @inject("UsuarioRepository")
    private usuarioRepository: IUsuarioRepository,
    @inject("RecuperacaoSenhaRepository")
    private recuperacaoRepository: IRecuperacaoSenhaRepository,
    @inject("EmailProvider")
    private emailProvider: IEmailProvider,
  ) {}

  /**
   * Só envia para e-mail cadastrado e ativo. A resposta é a mesma nos dois
   * casos, para ninguém descobrir pela tela quais e-mails têm conta.
   */
  async solicitar(email: string): Promise<void> {
    const digitado = email.trim();
    const usuario =
      (await this.usuarioRepository.findByEmail(digitado)) ??
      (await this.usuarioRepository.findByEmail(digitado.toLowerCase()));
    if (!usuario?.codigo || String(usuario.ativo).toUpperCase() === "N") return;

    const token = randomBytes(32).toString("hex");
    await this.recuperacaoRepository.encerrarDoUsuario(Number(usuario.codigo));
    await this.recuperacaoRepository.criar({
      codusuario: Number(usuario.codigo),
      token_hash: hashToken(token),
      expira_em: new Date(Date.now() + VALIDADE_MINUTOS * 60 * 1000),
    });

    const link = `${urlWeb()}/redefinir-senha#token=${token}`;
    const mensagem = emailRecuperacaoSenha(usuario.nome, link, VALIDADE_MINUTOS);
    await this.emailProvider.enviar({ para: usuario.email, ...mensagem });
  }

  async redefinir(token: string, novaSenha: string): Promise<void> {
    ensureStrongPassword(novaSenha);
    const senhaHash = await bcrypt.hash(novaSenha, 10);
    const atualizado = await this.recuperacaoRepository.redefinirSenha(hashToken(token), senhaHash);
    if (!atualizado) throw new AppError('Link inválido ou vencido. Peça um novo em "Esqueci minha senha".', 400);
  }
}

export { RecuperarSenhaUseCase };
