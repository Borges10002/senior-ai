import type { Agendamento } from "@modules/agenda/infra/typeorm/entities/Agendamento";

export default interface IAgendamentoRepository {
  create(agendamento: Agendamento): Promise<Agendamento>;
  existeParaGravacao(gravacaoId: string): Promise<boolean>;
  listByReuniaoOrigem(reuniaoId: string, codusuario: number): Promise<Agendamento[]>;
}
