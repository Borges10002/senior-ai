import { inject, injectable } from "tsyringe";
import type IUsuarioRepository from "@modules/usuarios/domain/repositories/IUsuarioRepository";
import { usuarioPublico, type UsuarioPublico } from "./CreateUsuarioUseCase";
import AppError from "@shared/errors/AppError";

@injectable()
class GetUsuarioUseCase {
  constructor(
    @inject("UsuarioRepository")
    private usuarioRepository: IUsuarioRepository,
  ) {}

  async execute(id: string): Promise<UsuarioPublico> {
    const usuario = await this.usuarioRepository.findById(id);
    if (!usuario || !usuario.ativo) throw new AppError("Usuário não encontrado.", 404);
    return usuarioPublico(usuario);
  }
}

export { GetUsuarioUseCase };
