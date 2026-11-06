import { randomUUID } from "crypto";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { inject, injectable } from "tsyringe";
import IFilaProcessamento from "@modules/gravacoes/domain/IFilaProcessamento";
import IGravacaoRepository from "@modules/gravacoes/domain/repositories/IGravacaoRepository";
import IExtratorAudio from "@modules/transcricoes/domain/IExtratorAudio";
import ITranscricaoProvider from "@modules/transcricoes/domain/ITranscricaoProvider";
import { juntarPartes } from "@modules/transcricoes/domain/montarTranscricao";
import ISegmentoRepository from "@modules/transcricoes/domain/repositories/ISegmentoRepository";
import { SegmentoTranscricao } from "@modules/transcricoes/infra/typeorm/entities/SegmentoTranscricao";
import type IStorageProvider from "@shared/providers/storage/IStorageProvider";

/** Vídeo -> áudio -> texto com horários. Termina enfileirando a análise. */
@injectable()
export class TranscreverGravacaoUseCase {
  constructor(
    @inject("GravacaoRepository")
    private gravacaoRepository: IGravacaoRepository,
    @inject("SegmentoRepository")
    private segmentoRepository: ISegmentoRepository,
    @inject("StorageProvider")
    private storage: IStorageProvider,
    @inject("ExtratorAudio")
    private extrator: IExtratorAudio,
    @inject("TranscricaoProvider")
    private transcricao: ITranscricaoProvider,
    @inject("FilaProcessamento")
    private fila: IFilaProcessamento,
  ) {}

  async execute(gravacaoId: string): Promise<void> {
    const gravacao = await this.gravacaoRepository.findById(gravacaoId);
    if (!gravacao) return;
    await this.gravacaoRepository.atualizar(gravacaoId, { status: "TRANSCREVENDO", erro: null });

    const pasta = await mkdtemp(join(tmpdir(), "senior-ai-"));
    try {
      const video = join(pasta, "video");
      await this.storage.baixarPara(gravacao.chave, video);

      const partes = await this.extrator.extrair(video, pasta);
      const transcritas = [];
      // Uma parte por vez: respeita o limite de requisições do serviço.
      for (const parte of partes) {
        transcritas.push({ inicio: parte.inicio, trechos: await this.transcricao.transcrever(parte.caminho) });
      }

      const trechos = juntarPartes(transcritas);
      await this.segmentoRepository.substituir(
        gravacaoId,
        trechos.map((t, ordem) =>
          Object.assign(new SegmentoTranscricao(), {
            id: randomUUID(),
            gravacao_id: gravacaoId,
            codusuario: gravacao.codusuario,
            ordem,
            inicio_seg: t.inicio,
            fim_seg: t.fim,
            texto: t.texto,
          }),
        ),
      );
    } finally {
      await rm(pasta, { recursive: true, force: true });
    }

    await this.gravacaoRepository.atualizar(gravacaoId, { status: "ANALISANDO" });
    await this.fila.enfileirarAnalise(gravacaoId);
  }
}
