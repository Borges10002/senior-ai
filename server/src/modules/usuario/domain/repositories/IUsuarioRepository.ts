import { Usuario } from "@modules/usuario/infra/typeorm/entities/Usuario";
import { IRepository } from "@shared/infra/typeorm/model/IRepository";

interface IUsuarioRepository extends IRepository {
  create(usuario: Usuario): Promise<Usuario>;
  findById(codigo: number): Promise<Usuario | null>;
  findAll(): Promise<Usuario[]>;
  findByUsuario(usuario: string): Promise<Usuario | null>;
  findByEmail(email: string): Promise<Usuario | null>;
  update(codigo: number, usuario: Partial<Usuario>): Promise<Usuario>;
  updatePassword(codigo: number, expectedHash: string, newHash: string): Promise<boolean>;
  delete(codigo: number): Promise<void>;
  getNextCodigo(): Promise<string>;
}

export default IUsuarioRepository;
