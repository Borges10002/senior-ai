import IUsuarioRepository from "@modules/usuario/domain/repositories/IUsuarioRepository";
import { Usuario } from "@modules/usuario/infra/typeorm/entities/Usuario";
import AppError from "@shared/errors/AppError";
import { inject, injectable } from "tsyringe";

interface UpdateUsuarioDTO {
  nome?: string;
  usuario?: string;
  email?: string;
  cpf?: string;
}

@injectable()
class UpdateUsuarioUseCase {
  constructor(
    @inject("UsuarioRepository")
    private usuarioRepository: IUsuarioRepository,
  ) {}

  async execute(codigo: number, data: UpdateUsuarioDTO): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findById(codigo);
    if (!usuario) {
      throw new AppError("Usuario nao encontrado", 404);
    }

    if (data.email && data.email !== usuario.email) {
      const emailEmUso = await this.usuarioRepository.findByEmail(data.email);
      if (emailEmUso && Number(emailEmUso.codigo) !== codigo) {
        throw new AppError("Email ja cadastrado", 400);
      }
    }

    return this.usuarioRepository.update(codigo, data);
  }
}

export { UpdateUsuarioUseCase };
