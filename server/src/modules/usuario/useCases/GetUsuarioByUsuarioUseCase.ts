import { inject, injectable } from "tsyringe";
import IUsuarioRepository from "@modules/usuario/domain/repositories/IUsuarioRepository";
import { Usuario } from "@modules/usuario/infra/typeorm/entities/Usuario";
import AppError from "@shared/errors/AppError";

@injectable()
class GetUsuarioByUsuarioUseCase {
  constructor(
    @inject("UsuarioRepository")
    private usuarioRepository: IUsuarioRepository
  ) {}

  async execute(usuario: string): Promise<Usuario> {
    const usuarioFound = await this.usuarioRepository.findByUsuario(usuario);
    if (!usuarioFound) {
      throw new AppError("Usuário não encontrado", 404);
    }
    return usuarioFound;
  }
}

export { GetUsuarioByUsuarioUseCase };