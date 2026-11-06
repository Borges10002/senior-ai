import { RecuperacaoSenha } from "@modules/accounts/infra/typeorm/entities/RecuperacaoSenha";
import { IsNull } from "typeorm";
import IUsuarioRepository from "@modules/usuario/domain/repositories/IUsuarioRepository";
import { Usuario } from "@modules/usuario/infra/typeorm/entities/Usuario";
import { TipecDataSource } from "@shared/infra/typeorm";
import { Repository } from "typeorm/repository/Repository.js";

class UsuarioRepository implements IUsuarioRepository {
  private repository: Repository<Usuario>;

  constructor() {
    this.repository = TipecDataSource.getRepository(Usuario);
  }

  getDataSource() {
    return TipecDataSource;
  }

  async create(usuario: Usuario): Promise<Usuario> {
    return this.repository.save(usuario);
  }

  async findById(codigo: number): Promise<Usuario | null> {
    return this.repository.findOne({ where: { codigo } });
  }

  async findAll(): Promise<Usuario[]> {
    return this.repository.find({ order: { nome: "ASC" } });
  }

  async findByUsuario(usuario: string): Promise<Usuario | null> {
    return this.repository.findOne({ where: { usuario } });
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.repository.findOne({ where: { email } });
  }

  async update(codigo: number, usuario: Partial<Usuario>): Promise<Usuario> {
    await this.repository.update({ codigo }, usuario);
    return this.repository.findOne({ where: { codigo } }) as Promise<Usuario>;
  }

  async updatePassword(codigo: number, expectedHash: string, newHash: string): Promise<boolean> {
    return TipecDataSource.transaction(async manager => {
      const user = await manager.findOne(Usuario, { where: { codigo }, lock: { mode: "pessimistic_write" } });
      if (!user || user.ativo !== "S" || user.senha !== expectedHash) return false;
      await manager.update(Usuario, { codigo }, { senha: newHash });
      await manager.update(RecuperacaoSenha, { codusuario: codigo, usado_em: IsNull() }, { usado_em: new Date() });
      return true;
    });
  }

  async delete(codigo: number): Promise<void> {
    await this.repository.delete({ codigo });
  }

  async getNextCodigo(): Promise<string> {
    const maxCodigo = await this.repository
      .createQueryBuilder("usuario")
      .select("MAX(CAST(usuario.codigo AS INTEGER))", "max")
      .getRawOne();

    const nextCodigo = maxCodigo?.max ? parseInt(maxCodigo.max) + 1 : 1;
    return nextCodigo.toString();
  }
}

export { UsuarioRepository };
