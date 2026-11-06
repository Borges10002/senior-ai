import IAgendamentoRepository from "@modules/agenda/domain/repositories/IAgendamentoRepository";
import { Agendamento } from "@modules/agenda/infra/typeorm/entities/Agendamento";
import { TipecDataSource } from "@shared/infra/typeorm";

export class AgendamentoRepository implements IAgendamentoRepository {
  private get repo() {
    return TipecDataSource.getRepository(Agendamento);
  }

  create(agendamento: Agendamento): Promise<Agendamento> {
    return this.repo.save(agendamento);
  }

  existeParaGravacao(gravacaoId: string): Promise<boolean> {
    return this.repo.existsBy({ gravacao_id: gravacaoId });
  }

  listByReuniaoOrigem(reuniaoId: string, codusuario: number): Promise<Agendamento[]> {
    return this.repo.find({ where: { reuniao_origem_id: reuniaoId, codusuario }, order: { created_at: "ASC" } });
  }
}
