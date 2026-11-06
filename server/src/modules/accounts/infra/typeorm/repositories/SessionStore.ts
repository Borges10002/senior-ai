import { TipecDataSource } from "@shared/infra/typeorm";
import { Sessao } from "../entities/Sessao";
export class SessionStore {
  private get repo() { return TipecDataSource.getRepository(Sessao); }
  async create(s: Sessao) { await this.repo.save(s); }
  async active(id: string, codusuario: number) {
    const s = await this.repo.findOne({ where: { id, codusuario } });
    return !!s && s.expira_em.getTime() > Date.now();
  }
  async rotate(id: string, oldHash: string, newHash: string): Promise<boolean> {
    const result = await this.repo.createQueryBuilder().update(Sessao)
      .set({ refresh_hash: newHash }).where('id = :id AND refresh_hash = :oldHash AND expira_em > NOW()', { id, oldHash }).execute();
    return result.affected === 1;
  }
  async revokeUser(codusuario: number) { await this.repo.delete({ codusuario }); }
  async revoke(id: string) { await this.repo.delete({ id }); }
}
export const sessions = new SessionStore();
