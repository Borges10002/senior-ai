import type { Repository } from "typeorm";
import { TipecDataSource } from "@shared/infra/typeorm";
import IReuniaoRepository from "@modules/reunioes/domain/repositories/IReuniaoRepository";
import type { FiltroReunioes } from "@modules/reunioes/domain/repositories/IReuniaoRepository";
import { Reuniao } from "@modules/reunioes/infra/typeorm/entities/Reuniao";

class ReuniaoRepository implements IReuniaoRepository {
  private get repo(): Repository<Reuniao> {
    return TipecDataSource.getRepository(Reuniao);
  }

  create(reuniao: Reuniao): Promise<Reuniao> {
    return this.repo.save(reuniao);
  }

  findByIdDoProprietario(id: string, codusuario: number): Promise<Reuniao | null> {
    return this.repo.findOneBy({ id, codusuario: codusuario });
  }

  listByProprietario(codusuario: number, { de, ate, status }: FiltroReunioes): Promise<Reuniao[]> {
    const query = this.repo
      .createQueryBuilder("r")
      .where("r.codusuario = :codusuario", { codusuario })
      .orderBy("r.inicio_previsto", "DESC", "NULLS LAST")
      .addOrderBy("r.created_at", "DESC");
    if (de) query.andWhere("r.inicio_previsto >= :de", { de });
    if (ate) query.andWhere("r.inicio_previsto < :ate", { ate });
    if (status) query.andWhere("r.status = :status", { status });
    return query.getMany();
  }

  save(reuniao: Reuniao): Promise<Reuniao> {
    return this.repo.save(reuniao);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  countAll(): Promise<number> {
    return this.repo.count();
  }
}

export { ReuniaoRepository };
