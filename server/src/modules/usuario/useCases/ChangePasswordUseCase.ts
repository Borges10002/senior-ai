import IUsuarioRepository from "@modules/usuario/domain/repositories/IUsuarioRepository";
import { ensureStrongPassword } from "@modules/usuario/utils/passwordSecurity";
import AppError from "@shared/errors/AppError";
import bcrypt from "bcryptjs";
import { inject, injectable } from "tsyringe";

interface IRequest {
  codigo: number;
  senhaAtual: string;
  novaSenha: string;
}

@injectable()
class ChangePasswordUseCase {
  constructor(
    @inject("UsuarioRepository")
    private usuarioRepository: IUsuarioRepository,
  ) {}

  async execute({ codigo, senhaAtual, novaSenha }: IRequest): Promise<void> {
    const usuario = await this.usuarioRepository.findById(codigo);
    if (!usuario) {
      throw new AppError("Usuario nao encontrado", 404);
    }

    const passwordMatch = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!passwordMatch) {
      throw new AppError("Senha atual invalida", 400);
    }

    if (senhaAtual === novaSenha) {
      throw new AppError("A nova senha deve ser diferente da senha atual", 400);
    }

    ensureStrongPassword(novaSenha);
    const hashedPassword = await bcrypt.hash(novaSenha, 10);

    const updated = await this.usuarioRepository.updatePassword(codigo, usuario.senha, hashedPassword);
    if (!updated) throw new AppError("Senha atual alterada ou conta indisponivel. Entre novamente.", 400);
  }
}

export { ChangePasswordUseCase };
