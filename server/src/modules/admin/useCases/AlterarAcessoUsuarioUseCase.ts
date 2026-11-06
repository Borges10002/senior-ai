import { sessions } from "@modules/accounts/infra/typeorm/repositories/SessionStore";
import { inject, injectable } from "tsyringe";
import parametroConstants from "@/constants/parametro.constants";
import IUsuarioRepository from "@modules/usuario/domain/repositories/IUsuarioRepository";
import { PERFIS } from "@modules/usuario/domain/perfil";
import AppError from "@shared/errors/AppError";
import { mapUsuarioAdmin, UsuarioAdminDTO } from "./ListUsuariosAdminUseCase";

export interface AlterarAcessoDTO {
  /** Administrador que está fazendo a alteração. */
  codigoAdmin: number;
  codigo: number;
  nivel?: number;
  ativo?: boolean;
}

/**
 * Altera o perfil e/ou o status de uma conta. O administrador não pode mudar
 * a própria conta, o que garante que sempre reste ao menos um admin ativo.
 */
@injectable()
class AlterarAcessoUsuarioUseCase {
  constructor(
    @inject("UsuarioRepository")
    private usuarioRepository: IUsuarioRepository,
  ) {}

  async execute({ codigoAdmin, codigo, nivel, ativo }: AlterarAcessoDTO): Promise<UsuarioAdminDTO> {
    if (codigo === codigoAdmin) {
      throw new AppError(
        "Você não pode alterar o próprio perfil ou status. Peça a outro administrador.",
        400,
      );
    }

    const usuario = await this.usuarioRepository.findById(codigo);
    if (!usuario) {
      throw new AppError("Usuário não encontrado", 404);
    }

    const alteracoes: { nivelacesso?: number; ativo?: string } = {};
    if (nivel !== undefined) {
      if (!PERFIS.some((p) => p.level === nivel)) {
        throw new AppError("Perfil inválido", 400);
      }
      alteracoes.nivelacesso = nivel;
    }
    if (ativo !== undefined) {
      alteracoes.ativo = ativo ? parametroConstants.SIM : parametroConstants.NAO;
    }

    const atualizado = await this.usuarioRepository.update(codigo, alteracoes);
    if (ativo === false) await sessions.revokeUser(codigo);
    return mapUsuarioAdmin(atualizado);
  }
}

export { AlterarAcessoUsuarioUseCase };
