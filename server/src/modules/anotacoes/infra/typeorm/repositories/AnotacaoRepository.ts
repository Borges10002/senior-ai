import IAnotacaoRepository from "@modules/anotacoes/domain/repositories/IAnotacaoRepository";
import { Anotacao } from "@modules/anotacoes/infra/typeorm/entities/Anotacao";
import { TipecDataSource } from "@shared/infra/typeorm";

export class AnotacaoRepository implements IAnotacaoRepository {
  private get repo() {
    return TipecDataSource.getRepository(Anotacao);
  }

  async salvar(anotacao: Anotacao): Promise<Anotacao> {
    const existente = await this.repo.findOneBy({ gravacao_id: anotacao.gravacao_id });
    return this.repo.save(existente ? Object.assign(anotacao, { id: existente.id }) : anotacao);
  }

  listByReuniao(reuniaoId: string, codusuario: number): Promise<Anotacao[]> {
    return this.repo.find({ where: { reuniao_id: reuniaoId, codusuario }, order: { created_at: "ASC" } });
  }
}
