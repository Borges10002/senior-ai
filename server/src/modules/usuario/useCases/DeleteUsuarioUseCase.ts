import { inject, injectable } from "tsyringe";
import IUsuarioRepository from "@modules/usuario/domain/repositories/IUsuarioRepository";
import AppError from "@shared/errors/AppError";

@injectable()
class DeleteUsuarioUseCase {
  constructor(
    @inject("UsuarioRepository")
    private usuarioRepository: IUsuarioRepository
  ) {}

  async execute(codigo: number): Promise<void> {
    const usuario = await this.usuarioRepository.findById(codigo);
    if (!usuario) {
      throw new AppError("Usuário não encontrado", 404);
    }

    await this.usuarioRepository.delete(codigo);
  }
}

export { DeleteUsuarioUseCase };
