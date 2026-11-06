import { randomUUID } from "crypto";
import { inject, injectable } from "tsyringe";
import { AgendarAutomaticamenteUseCase } from "@modules/agenda/useCases/AgendarAutomaticamenteUseCase";
import IAnalistaProvider from "@modules/anotacoes/domain/analise";
import IAnotacaoRepository from "@modules/anotacoes/domain/repositories/IAnotacaoRepository";
import { Anotacao } from "@modules/anotacoes/infra/typeorm/entities/Anotacao";
import { RegistrarAuditoriaUseCase } from "@modules/auditoria/useCases/RegistrarAuditoriaUseCase";
import IGravacaoRepository from "@modules/gravacoes/domain/repositories/IGravacaoRepository";
import IReuniaoRepository from "@modules/reunioes/domain/repositories/IReuniaoRepository";
import { textoComHorarios } from "@modules/transcricoes/domain/montarTranscricao";
import ISegmentoRepository from "@modules/transcricoes/domain/repositories/ISegmentoRepository";

/** Transcrição -> anotações -> agenda. Última etapa do pipeline. */
@injectable()
export class AnalisarGravacaoUseCase {
  constructor(
    @inject("GravacaoRepository")
    private gravacaoRepository: IGravacaoRepository,
    @inject("SegmentoRepository")
    private segmentoRepository: ISegmentoRepository,
    @inject("ReuniaoRepository")
    private reuniaoRepository: IReuniaoRepository,
    @inject("AnotacaoRepository")
    private anotacaoRepository: IAnotacaoRepository,
    @inject("AnalistaProvider")
    private analista: IAnalistaProvider,
    @inject(AgendarAutomaticamenteUseCase)
    private agendar: AgendarAutomaticamenteUseCase,
    @inject(RegistrarAuditoriaUseCase)
    private auditoria: RegistrarAuditoriaUseCase,
  ) {}

  async execute(gravacaoId: string): Promise<void> {
    const gravacao = await this.gravacaoRepository.findById(gravacaoId);
    if (!gravacao) return;
    const codusuario = Number(gravacao.codusuario);

    const reuniao = await this.reuniaoRepository.findByIdDoProprietario(gravacao.reuniao_id, codusuario);
    if (!reuniao) return;

    const segmentos = await this.segmentoRepository.listByGravacao(gravacaoId);
    if (!segmentos.length) {
      await this.gravacaoRepository.atualizar(gravacaoId, {
        status: "FALHOU",
        erro: "Nenhuma fala foi identificada no áudio da gravação.",
      });
      return;
    }

    const analise = await this.analista.analisar({
      transcricao: textoComHorarios(segmentos.map((s) => ({ inicio: s.inicio_seg, texto: s.texto }))),
      tituloReuniao: reuniao.titulo,
      assunto: reuniao.assunto,
      dataReferencia: reuniao.iniciada_em ?? gravacao.created_at,
      fuso: process.env.APP_TIMEZONE || "America/Porto_Velho",
    });

    await this.anotacaoRepository.salvar(
      Object.assign(new Anotacao(), {
        id: randomUUID(),
        gravacao_id: gravacaoId,
        reuniao_id: reuniao.id,
        codusuario,
        resumo: analise.resumo,
        assuntos: analise.assuntos,
        decisoes: analise.decisoes,
        tarefas: analise.tarefas,
        pendencias: analise.pendencias,
      }),
    );

    await this.agendar.execute({
      gravacaoId,
      reuniaoOrigemId: reuniao.id,
      codusuario,
      agendamentos: analise.agendamentos,
    });

    await this.gravacaoRepository.atualizar(gravacaoId, { status: "CONCLUIDA", erro: null });
    await this.auditoria.execute({ codusuario, acao: "gravacao.analisada", entidade: "gravacao", entidadeId: gravacaoId });
  }
}
