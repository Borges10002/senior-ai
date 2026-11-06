import nivelacessoConstants from "@/constants/nivelacesso.constants";
import parametroConstants from "@/constants/parametro.constants";
import IUsuarioRepository from "@modules/usuario/domain/repositories/IUsuarioRepository";
import { Usuario } from "@modules/usuario/infra/typeorm/entities/Usuario";
import { ensureStrongPassword } from "@modules/usuario/utils/passwordSecurity";
import AppError from "@shared/errors/AppError";
import bcrypt from "bcryptjs";
import { inject, injectable } from "tsyringe";

export interface CreateUsuarioDTO {
  nome: string;
  usuario: string;
  senha: string;
  email: string;
  cpf: string;
}

@injectable()
class CreateUsuarioUseCase {
  constructor(
    @inject("UsuarioRepository")
    private usuarioRepository: IUsuarioRepository,
  ) {}

  async execute(data: CreateUsuarioDTO): Promise<Usuario> {
    const usuarioExists = await this.usuarioRepository.findByEmail(data.email);
    if (usuarioExists) {
      throw new AppError("Email ja cadastrado", 400);
    }

    ensureStrongPassword(data.senha);

    const nextCodigo = await this.usuarioRepository.getNextCodigo();
    const hashedPassword = await bcrypt.hash(data.senha, 10);

    const usuario = Object.assign(new Usuario(), {
      ...data,
      codigo: nextCodigo,
      senha: hashedPassword,
      // Todo cadastro publico nasce ativo e com o nivel basico de acesso.
      ativo: parametroConstants.SIM,
      nivelacesso: nivelacessoConstants.USUARIO.level,
    });

    return this.usuarioRepository.create(usuario);
  }
}

export { CreateUsuarioUseCase };
