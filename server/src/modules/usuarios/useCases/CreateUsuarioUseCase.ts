import { randomUUID } from "crypto";
import { hash } from "bcryptjs";
import { inject, injectable } from "tsyringe";
import type IUsuarioRepository from "@modules/usuarios/domain/repositories/IUsuarioRepository";
import { garantirSenhaForte } from "@modules/usuarios/domain/senha";
import { Usuario } from "@modules/usuarios/infra/typeorm/entities/Usuario";
import AppError from "@shared/errors/AppError";

export interface CreateUsuarioDTO {
  nome: string;
  email: string;
  senha: string;
}

export type UsuarioPublico = Pick<Usuario, "id" | "nome" | "email" | "perfil" | "created_at">;

export const usuarioPublico = (u: Usuario): UsuarioPublico => ({
  id: u.id,
  nome: u.nome,
  email: u.email,
  perfil: u.perfil,
  created_at: u.created_at,
});

export const CUSTO_BCRYPT = 12;

@injectable()
class CreateUsuarioUseCase {
  constructor(
    @inject("UsuarioRepository")
    private usuarioRepository: IUsuarioRepository,
  ) {}

  async execute({ nome, email, senha }: CreateUsuarioDTO): Promise<UsuarioPublico> {
    const emailNormalizado = email.trim().toLowerCase();
    garantirSenhaForte(senha);

    if (await this.usuarioRepository.findByEmail(emailNormalizado)) {
      throw new AppError("Já existe uma conta com este e-mail.", 409);
    }

    const usuario = Object.assign(new Usuario(), {
      id: randomUUID(),
      nome: nome.trim(),
      email: emailNormalizado,
      senha_hash: await hash(senha, CUSTO_BCRYPT),
      perfil: "proprietario",
      ativo: true,
      versao_credencial: 1,
    });

    return usuarioPublico(await this.usuarioRepository.create(usuario));
  }
}

export { CreateUsuarioUseCase };
