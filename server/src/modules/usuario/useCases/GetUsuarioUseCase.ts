import { inject, injectable } from "tsyringe";
import IUsuarioRepository from "@modules/usuario/domain/repositories/IUsuarioRepository";
import { Usuario } from "@modules/usuario/infra/typeorm/entities/Usuario";
import AppError from "@shared/errors/AppError";

@injectable()
class GetUsuarioUseCase {
  constructor(
    @inject("UsuarioRepository")
    private usuarioRepository: IUsuarioRepository
  ) {}

  async execute(codigo: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findById(codigo);
    if (!usuario) {
      throw new AppError("Usuário não encontrado", 404);
    }
    return usuario;
  }
}

export { GetUsuarioUseCase };
