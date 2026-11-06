import { inject, injectable } from "tsyringe";
import IAgendamentoRepository from "@modules/agenda/domain/repositories/IAgendamentoRepository";
import IAnotacaoRepository from "@modules/anotacoes/domain/repositories/IAnotacaoRepository";
import IGravacaoRepository from "@modules/gravacoes/domain/repositories/IGravacaoRepository";
import { GetReuniaoUseCase } from "@modules/reunioes/useCases/GetReuniaoUseCase";
import ISegmentoRepository from "@modules/transcricoes/domain/repositories/ISegmentoRepository";

/** Tudo o que o assessor produziu sobre uma reunião. Consultado pelo app enquanto processa. */
@injectable()
export class ObterResultadoReuniaoUseCase {
  constructor(
    @inject("GravacaoRepository")
    private gravacaoRepository: IGravacaoRepository,
    @inject("SegmentoRepository")
    private segmentoRepository: ISegmentoRepository,
    @inject("AnotacaoRepository")
    private anotacaoRepository: IAnotacaoRepository,
    @inject("AgendamentoRepository")
    private agendamentoRepository: IAgendamentoRepository,
    @inject(GetReuniaoUseCase)
    private getReuniao: GetReuniaoUseCase,
  ) {}

  async execute(reuniaoId: string, codusuario: number) {
    const reuniao = await this.getReuniao.execute(reuniaoId, codusuario);
    const [gravacoes, anotacoes, agendamentos] = await Promise.all([
      this.gravacaoRepository.listByReuniao(reuniaoId, codusuario),
      this.anotacaoRepository.listByReuniao(reuniaoId, codusuario),
      this.agendamentoRepository.listByReuniaoOrigem(reuniaoId, codusuario),
    ]);
    const segmentos = (await Promise.all(gravacoes.map((g) => this.segmentoRepository.listByGravacao(g.id)))).flat();

    return {
      reuniao,
      gravacoes: gravacoes.map(({ chave: _chave, ...publico }) => publico),
      anotacoes,
      agendamentos,
      transcricao: segmentos.map((s) => ({ inicio: s.inicio_seg, fim: s.fim_seg, texto: s.texto })),
    };
  }
}
