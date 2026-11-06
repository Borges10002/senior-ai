import { Usuario } from "@modules/usuario/infra/typeorm/entities/Usuario";
import { MoreThan } from "typeorm";
import IRecuperacaoSenhaRepository from "@modules/accounts/domain/repositories/IRecuperacaoSenhaRepository";
import { TipecDataSource } from "@shared/infra/typeorm";
import { IsNull, Repository } from "typeorm";
import { RecuperacaoSenha } from "../entities/RecuperacaoSenha";

export class RecuperacaoSenhaRepository implements IRecuperacaoSenhaRepository {
  private repository: Repository<RecuperacaoSenha>;

  constructor() {
    this.repository = TipecDataSource.getRepository(RecuperacaoSenha);
  }

  async criar(dados: Pick<RecuperacaoSenha, "codusuario" | "token_hash" | "expira_em">) {
    return TipecDataSource.transaction(async manager => {
      const usuario = await manager.findOne(Usuario, { where: { codigo: dados.codusuario }, lock: { mode: "pessimistic_write" } });
      if (!usuario || usuario.ativo !== "S") throw new Error("Usuario indisponivel");
      await manager.update(RecuperacaoSenha, { codusuario: dados.codusuario, usado_em: IsNull() }, { usado_em: new Date() });
      return manager.save(RecuperacaoSenha, manager.create(RecuperacaoSenha, { ...dados, usado_em: null }));
    });
  }

  async buscarPorHash(token_hash: string) {
    return this.repository.findOne({ where: { token_hash, usado_em: IsNull() } });
  }

  async redefinirSenha(token_hash: string, senhaHash: string): Promise<boolean> {
    return TipecDataSource.transaction(async manager => {
      const candidato = await manager.findOne(RecuperacaoSenha, { where: { token_hash, usado_em: IsNull() } });
      if (!candidato) return false;
      // Same lock order as token issuance prevents two password resets racing.
      const usuario = await manager.findOne(Usuario, { where: { codigo: candidato.codusuario }, lock: { mode: "pessimistic_write" } });
      if (!usuario || usuario.ativo !== "S") return false;
      const pedido = await manager.findOne(RecuperacaoSenha, {
        where: { id: candidato.id, token_hash, usado_em: IsNull(), expira_em: MoreThan(new Date()) },
        lock: { mode: "pessimistic_write" },
      });
      if (!pedido) return false;
      await manager.update(Usuario, { codigo: usuario.codigo }, { senha: senhaHash });
      await manager.update(RecuperacaoSenha, { codusuario: usuario.codigo, usado_em: IsNull() }, { usado_em: new Date() });
      return true;
    });
  }

  async encerrarDoUsuario(codusuario: number) {
    await this.repository.update({ codusuario, usado_em: IsNull() }, { usado_em: new Date() });
  }
}
