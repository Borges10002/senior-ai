import type { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import type { Repository } from "typeorm";
import IGravacaoRepository from "@modules/gravacoes/domain/repositories/IGravacaoRepository";
import { Gravacao } from "@modules/gravacoes/infra/typeorm/entities/Gravacao";
import { TipecDataSource } from "@shared/infra/typeorm";

export class GravacaoRepository implements IGravacaoRepository {
  private get repo(): Repository<Gravacao> {
    return TipecDataSource.getRepository(Gravacao);
  }

  create(gravacao: Gravacao): Promise<Gravacao> {
    return this.repo.save(gravacao);
  }

  findById(id: string): Promise<Gravacao | null> {
    return this.repo.findOneBy({ id });
  }

  findByIdDoUsuario(id: string, codusuario: number): Promise<Gravacao | null> {
    return this.repo.findOneBy({ id, codusuario });
  }

  listByReuniao(reuniaoId: string, codusuario: number): Promise<Gravacao[]> {
    return this.repo.find({ where: { reuniao_id: reuniaoId, codusuario }, order: { created_at: "ASC" } });
  }

  async atualizar(id: string, dados: Partial<Gravacao>): Promise<void> {
    await this.repo.update({ id }, dados as QueryDeepPartialEntity<Gravacao>);
  }
}
