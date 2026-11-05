import type { Usuario } from "@modules/usuarios/infra/typeorm/entities/Usuario";

export default interface IUsuarioRepository {
  findById(id: string): Promise<Usuario | null>;
  findByEmail(email: string): Promise<Usuario | null>;
  create(usuario: Usuario): Promise<Usuario>;
  save(usuario: Usuario): Promise<Usuario>;
}
