import type { Repository } from "typeorm";
import { AppDataSource } from "@shared/infra/typeorm";
import type IUsuarioRepository from "@modules/usuarios/domain/repositories/IUsuarioRepository";
import { Usuario } from "@modules/usuarios/infra/typeorm/entities/Usuario";

class UsuarioRepository implements IUsuarioRepository {
  private get repo(): Repository<Usuario> {
    return AppDataSource.getRepository(Usuario);
  }

  findById(id: string): Promise<Usuario | null> {
    return this.repo.findOneBy({ id });
  }

  findByEmail(email: string): Promise<Usuario | null> {
    return this.repo.findOneBy({ email: email.trim().toLowerCase() });
  }

  create(usuario: Usuario): Promise<Usuario> {
    return this.repo.save(usuario);
  }

  save(usuario: Usuario): Promise<Usuario> {
    return this.repo.save(usuario);
  }
}

export { UsuarioRepository };
