import { randomUUID } from "crypto";
import { inject, injectable } from "tsyringe";
import { RegistrarAuditoriaUseCase } from "@modules/auditoria/useCases/RegistrarAuditoriaUseCase";
import { chaveDaGravacao, tipoAceito } from "@modules/gravacoes/domain/gravacao";
import IFilaProcessamento from "@modules/gravacoes/domain/IFilaProcessamento";
import IGravacaoRepository from "@modules/gravacoes/domain/repositories/IGravacaoRepository";
import { Gravacao } from "@modules/gravacoes/infra/typeorm/entities/Gravacao";
import { GetReuniaoUseCase } from "@modules/reunioes/useCases/GetReuniaoUseCase";
import AppError from "@shared/errors/AppError";
import type IStorageProvider from "@shared/providers/storage/IStorageProvider";

export interface EnviarGravacaoDTO {
  reuniaoId: string;
  codusuario: number;
  caminhoLocal: string;
  mime: string;
  tamanho: number;
  duracaoSeg?: number | null;
  consentimento: boolean;
  ip?: string | null;
}

/** Guarda o vídeo e dispara o pipeline. O arquivo original nunca é apagado por falha de IA (RN013). */
@injectable()
export class EnviarGravacaoUseCase {
  constructor(
    @inject("GravacaoRepository")
    private gravacaoRepository: IGravacaoRepository,
    @inject("StorageProvider")
    private storage: IStorageProvider,
    @inject("FilaProcessamento")
    private fila: IFilaProcessamento,
    @inject(GetReuniaoUseCase)
    private getReuniao: GetReuniaoUseCase,
    @inject(RegistrarAuditoriaUseCase)
    private auditoria: RegistrarAuditoriaUseCase,
  ) {}

  async execute(dto: EnviarGravacaoDTO): Promise<Gravacao> {
    if (!dto.consentimento) {
      throw new AppError("Confirme que os participantes foram avisados sobre a gravação.", 400);
    }
    if (!tipoAceito(dto.mime)) throw new AppError("Formato de vídeo não aceito.", 415);

    const reuniao = await this.getReuniao.execute(dto.reuniaoId, dto.codusuario);
    if (reuniao.status !== "EM_ANDAMENTO" && reuniao.status !== "FINALIZADA") {
      throw new AppError("Inicie a reunião antes de enviar a gravação.", 409);
    }

    const id = randomUUID();
    const chave = chaveDaGravacao(dto.codusuario, reuniao.id, id, dto.mime);
    await this.storage.salvar(chave, dto.caminhoLocal, dto.mime);

    const gravacao = await this.gravacaoRepository.create(
      Object.assign(new Gravacao(), {
        id,
        reuniao_id: reuniao.id,
        codusuario: dto.codusuario,
        chave,
        mime: dto.mime,
        tamanho: dto.tamanho,
        duracao_seg: dto.duracaoSeg ?? null,
        consentimento_em: new Date(),
        status: "ENVIADA",
        erro: null,
      }),
    );

    await this.auditoria.execute({
      codusuario: dto.codusuario,
      acao: "gravacao.enviada",
      entidade: "gravacao",
      entidadeId: id,
      dados: { reuniao_id: reuniao.id, tamanho: dto.tamanho },
      ip: dto.ip,
    });

    await this.fila.enfileirarTranscricao(id);
    return gravacao;
  }
}
