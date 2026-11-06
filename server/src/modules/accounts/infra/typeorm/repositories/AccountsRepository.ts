import IAccountsRepository from "@modules/accounts/domain/repositories/IAccountsRepository";
import { Usuario } from "@modules/usuario/infra/typeorm/entities/Usuario";

import { TipecDataSource } from "@shared/infra/typeorm";
import { Repository } from "typeorm";

class AccountsRepository implements IAccountsRepository {
  private repository: Repository<Usuario>;

  constructor() {
    this.repository = TipecDataSource.getRepository(Usuario);
  }

  getDataSource() {
    return TipecDataSource;
  }

  async findByUsuario(usuario: string): Promise<Usuario | null> {
    const user = await this.repository.findOne({
      select: {
        codigo: true,
        ativo: true,
        email: true,
        nivelacesso: true,
        nome: true,
        usuario: true,
        cpf: true,
      },

      where: {
        usuario: usuario,
      },
    });

    return user;
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    const user = await this.repository.findOne({
      select: {
        codigo: true,
        ativo: true,
        email: true,
        nivelacesso: true,
        nome: true,
        usuario: true,
        cpf: true,
        senha: true,
      },

      where: {
        email: email,
      },
    });

    return user;
  }

  async findByUsuarioId(codigo: number): Promise<Usuario | null> {
    const user = await this.repository.findOne({
      select: {
        codigo: true,
        ativo: true,
        email: true,
        nivelacesso: true,
        nome: true,
        usuario: true,
        cpf: true,
        senha: true,
      },
      where: {
        codigo,
      },
    });

    return user;
  }
}

export default AccountsRepository;
