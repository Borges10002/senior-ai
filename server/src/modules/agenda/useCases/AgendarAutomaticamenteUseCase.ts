import { randomUUID } from "crypto";
import { inject, injectable } from "tsyringe";
import { decidirAgendamento, periodoSolicitado, type Periodo } from "@modules/agenda/domain/agendamento";
import IAgendamentoRepository from "@modules/agenda/domain/repositories/IAgendamentoRepository";
import { Agendamento } from "@modules/agenda/infra/typeorm/entities/Agendamento";
import type { AgendamentoExtraido } from "@modules/anotacoes/domain/analise";
import { RegistrarAuditoriaUseCase } from "@modules/auditoria/useCases/RegistrarAuditoriaUseCase";
import IReuniaoRepository from "@modules/reunioes/domain/repositories/IReuniaoRepository";
import { CreateReuniaoUseCase } from "@modules/reunioes/useCases/CreateReuniaoUseCase";

export interface AgendarDTO {
  gravacaoId: string;
  reuniaoOrigemId: string;
  codusuario: number;
  agendamentos: AgendamentoExtraido[];
  agora?: Date;
}

/**
 * Cria sozinho, só na agenda do dono, as reuniões combinadas na conversa.
 * Substitui a autorização prévia da RN009 por decisão do produto: nada é enviado a
 * terceiros, tudo fica na auditoria e o dono pode cancelar. Sugestões não viram agenda.
 */
@injectable()
export class AgendarAutomaticamenteUseCase {
  constructor(
    @inject("AgendamentoRepository")
    private agendamentoRepository: IAgendamentoRepository,
    @inject("ReuniaoRepository")
    private reuniaoRepository: IReuniaoRepository,
    @inject(CreateReuniaoUseCase)
    private criarReuniao: CreateReuniaoUseCase,
    @inject(RegistrarAuditoriaUseCase)
    private auditoria: RegistrarAuditoriaUseCase,
  ) {}

  async execute({ gravacaoId, reuniaoOrigemId, codusuario, agendamentos, agora = new Date() }: AgendarDTO): Promise<void> {
    // Reprocessar a mesma gravação não pode criar a reunião de novo.
    if (await this.agendamentoRepository.existeParaGravacao(gravacaoId)) return;

    const ocupados: Periodo[] = await this.reuniaoRepository.periodosOcupados(codusuario, agora);

    for (const item of agendamentos.filter((a) => a.confirmado)) {
      const pedido = { inicio: item.inicio, duracaoMin: item.duracao_minutos };
      const decisao = decidirAgendamento(pedido, ocupados, agora);
      const periodo = decisao.status === "CRIADO" || decisao.status === "CONFLITO" ? decisao.periodo : periodoSolicitado(pedido);

      let reuniaoCriadaId: string | null = null;
      if (decisao.status === "CRIADO") {
        const criada = await this.criarReuniao.execute(codusuario, {
          titulo: item.titulo.slice(0, 200),
          inicio_previsto: decisao.periodo.inicio,
          fim_previsto: decisao.periodo.fim,
        });
        reuniaoCriadaId = criada.id;
        // A próxima da mesma conversa também precisa respeitar esta.
        ocupados.push(decisao.periodo);
      }

      const registro = await this.agendamentoRepository.create(
        Object.assign(new Agendamento(), {
          id: randomUUID(),
          gravacao_id: gravacaoId,
          reuniao_origem_id: reuniaoOrigemId,
          codusuario,
          titulo: item.titulo.slice(0, 200),
          inicio: periodo?.inicio ?? null,
          fim: periodo?.fim ?? null,
          participantes: item.participantes,
          status: decisao.status,
          reuniao_criada_id: reuniaoCriadaId,
          sugestao_inicio: decisao.status === "CONFLITO" ? decisao.sugestao : null,
          horario_origem: item.horario.slice(0, 12),
        }),
      );

      await this.auditoria.execute({
        codusuario,
        acao: `agenda.automatico.${decisao.status.toLowerCase()}`,
        entidade: "agendamento",
        entidadeId: registro.id,
        dados: { reuniao_origem_id: reuniaoOrigemId, reuniao_criada_id: reuniaoCriadaId },
      });
    }
  }
}
