import type { Repository } from "typeorm";
import { AppDataSource } from "@shared/infra/typeorm";
import type IReuniaoRepository from "@modules/reunioes/domain/repositories/IReuniaoRepository";
import type { FiltroReunioes } from "@modules/reunioes/domain/repositories/IReuniaoRepository";
import { Reuniao } from "@modules/reunioes/infra/typeorm/entities/Reuniao";

class ReuniaoRepository implements IReuniaoRepository {
  private get repo(): Repository<Reuniao> {
    return AppDataSource.getRepository(Reuniao);
  }

  create(reuniao: Reuniao): Promise<Reuniao> {
    return this.repo.save(reuniao);
  }

  findByIdDoProprietario(id: string, proprietarioId: string): Promise<Reuniao | null> {
    return this.repo.findOneBy({ id, proprietario_id: proprietarioId });
  }

  listByProprietario(proprietarioId: string, { de, ate, status }: FiltroReunioes): Promise<Reuniao[]> {
    const query = this.repo
      .createQueryBuilder("r")
      .where("r.proprietario_id = :proprietarioId", { proprietarioId })
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
}

export { ReuniaoRepository };
