import { Usuario } from "@modules/usuario/infra/typeorm/entities/Usuario";
import { IRepository } from "@shared/infra/typeorm/model/IRepository";

interface IAccountsRepository extends IRepository {
  findByUsuario(usuario: string): Promise<Usuario | null>;
  findByEmail(email: string): Promise<Usuario | null>;
  findByUsuarioId(codigo: number): Promise<Usuario | null>;
}

export default IAccountsRepository;
