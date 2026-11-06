import { In, Not, IsNull, type Repository } from "typeorm";
import { TipecDataSource } from "@shared/infra/typeorm";
import IReuniaoRepository from "@modules/reunioes/domain/repositories/IReuniaoRepository";
import type { FiltroReunioes } from "@modules/reunioes/domain/repositories/IReuniaoRepository";
import { periodosDasReunioes } from "@modules/reunioes/domain/reuniao";
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

  async periodosOcupados(codusuario: number, apos: Date): Promise<{ inicio: Date; fim: Date }[]> {
    const reunioes = await this.repo.find({
      where: { codusuario, status: In(["AGENDADA", "EM_ANDAMENTO"]), inicio_previsto: Not(IsNull()) },
    });
    return periodosDasReunioes(reunioes, apos);
  }

  countAll(): Promise<number> {
    return this.repo.count();
  }
}

export { ReuniaoRepository };
