import { inject, injectable } from "tsyringe";
import IUsuarioRepository from "@modules/usuario/domain/repositories/IUsuarioRepository";
import { resumoPerfil } from "@modules/usuario/domain/perfil";
import stringUtils from "@utils/string.utils";

export interface UsuarioAdminDTO {
  codigo: number;
  nome: string;
  nomeAbreviado: string;
  usuario: string;
  email: string;
  ativo: boolean;
  perfil: ReturnType<typeof resumoPerfil>;
}

export function mapUsuarioAdmin(usuario: {
  codigo?: number;
  nome: string;
  usuario: string;
  email: string;
  ativo: string;
  nivelacesso: number;
}): UsuarioAdminDTO {
  return {
    codigo: Number(usuario.codigo),
    nome: usuario.nome,
    nomeAbreviado: stringUtils().getNomeAbreviadoUsuario(usuario.nome),
    usuario: usuario.usuario,
    email: usuario.email,
    ativo: usuario.ativo !== "N",
    perfil: resumoPerfil(usuario.nivelacesso),
  };
}

@injectable()
class ListUsuariosAdminUseCase {
  constructor(
    @inject("UsuarioRepository")
    private usuarioRepository: IUsuarioRepository,
  ) {}

  async execute(): Promise<UsuarioAdminDTO[]> {
    const usuarios = await this.usuarioRepository.findAll();
    return usuarios.map(mapUsuarioAdmin);
  }
}

export { ListUsuariosAdminUseCase };
