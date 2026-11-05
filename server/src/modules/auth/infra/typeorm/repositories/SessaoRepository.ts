import { IsNull, type Repository } from "typeorm";
import { AppDataSource } from "@shared/infra/typeorm";
import type ISessaoRepository from "@modules/auth/domain/repositories/ISessaoRepository";
import { Sessao } from "@modules/auth/infra/typeorm/entities/Sessao";

class SessaoRepository implements ISessaoRepository {
  private get repo(): Repository<Sessao> {
    return AppDataSource.getRepository(Sessao);
  }

  create(sessao: Sessao): Promise<Sessao> {
    return this.repo.save(sessao);
  }

  findById(id: string): Promise<Sessao | null> {
    return this.repo.findOneBy({ id });
  }

  save(sessao: Sessao): Promise<Sessao> {
    return this.repo.save(sessao);
  }

  async revogarTodasDoUsuario(usuarioId: string): Promise<void> {
    await this.repo.update({ usuario_id: usuarioId, revogada_em: IsNull() }, { revogada_em: new Date() });
  }
}

export { SessaoRepository };
