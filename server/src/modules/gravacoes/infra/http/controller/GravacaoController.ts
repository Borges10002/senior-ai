import { rm } from "fs/promises";
import type { Request, Response } from "express";
import { container } from "tsyringe";
import { z } from "zod";
import IGravacaoRepository from "@modules/gravacoes/domain/repositories/IGravacaoRepository";
import { EnviarGravacaoUseCase } from "@modules/gravacoes/useCases/EnviarGravacaoUseCase";
import { ObterResultadoReuniaoUseCase } from "@modules/gravacoes/useCases/ObterResultadoReuniaoUseCase";
import { ReprocessarGravacaoUseCase } from "@modules/gravacoes/useCases/ReprocessarGravacaoUseCase";
import AppError from "@shared/errors/AppError";
import type IStorageProvider from "@shared/providers/storage/IStorageProvider";

const params = z.object({ id: z.string().uuid() });

export class GravacaoController {
  async create(request: Request, response: Response): Promise<Response> {
    const arquivo = request.file;
    try {
      const { id } = params.parse(request.params);
      if (!arquivo) throw new AppError("Envie o vídeo no campo video.", 400);
      const corpo = z
        .object({
          consentimento: z.enum(["true", "false"]).transform((v) => v === "true"),
          duracao_seg: z.coerce.number().int().min(0).optional(),
        })
        .parse(request.body);

      const gravacao = await container.resolve(EnviarGravacaoUseCase).execute({
        reuniaoId: id,
        codusuario: Number(request.userAuth.codigo),
        caminhoLocal: arquivo.path,
        mime: arquivo.mimetype,
        tamanho: arquivo.size,
        duracaoSeg: corpo.duracao_seg,
        consentimento: corpo.consentimento,
        ip: request.ip,
      });
      const { chave: _chave, ...publico } = gravacao;
      return response.status(201).json(publico);
    } finally {
      if (arquivo) await rm(arquivo.path, { force: true });
    }
  }

  async resultado(request: Request, response: Response): Promise<Response> {
    const { id } = params.parse(request.params);
    const resultado = await container.resolve(ObterResultadoReuniaoUseCase).execute(id, Number(request.userAuth.codigo));
    return response.json(resultado);
  }

  async reprocessar(request: Request, response: Response): Promise<Response> {
    const { id } = params.parse(request.params);
    await container.resolve(ReprocessarGravacaoUseCase).execute(id, Number(request.userAuth.codigo));
    return response.status(202).send();
  }

  /** O vídeo só sai pela API, depois de conferir o dono. */
  async arquivo(request: Request, response: Response): Promise<void> {
    const { id } = params.parse(request.params);
    const gravacao = await container
      .resolve<IGravacaoRepository>("GravacaoRepository")
      .findByIdDoUsuario(id, Number(request.userAuth.codigo));
    if (!gravacao) throw new AppError("Gravação não encontrada.", 404);

    const leitura = await container.resolve<IStorageProvider>("StorageProvider").abrirLeitura(gravacao.chave);
    response.setHeader("Content-Type", gravacao.mime);
    response.setHeader("Content-Disposition", `attachment; filename="reuniao-${gravacao.id}"`);
    response.setHeader("X-Content-Type-Options", "nosniff");
    leitura.on("error", () => response.destroy());
    leitura.pipe(response);
  }
}
