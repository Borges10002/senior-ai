import { randomBytes } from "crypto";
import { mkdirSync } from "fs";
import { Router } from "express";
import multer from "multer";
import uploadConfig from "@config/upload.config";
import { TAMANHO_MAXIMO_BYTES, tipoAceito } from "@modules/gravacoes/domain/gravacao";
import { GravacaoController } from "@modules/gravacoes/infra/http/controller/GravacaoController";
import AppError from "@shared/errors/AppError";

mkdirSync(uploadConfig.tmpFolder, { recursive: true });

// Grava em disco para não carregar vídeos na memória. O nome enviado pelo cliente é descartado.
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadConfig.tmpFolder,
    filename: (_req, _file, callback) => callback(null, randomBytes(16).toString("hex")),
  }),
  limits: { fileSize: TAMANHO_MAXIMO_BYTES, files: 1, fields: 5 },
  fileFilter: (_req, file, callback) => {
    if (tipoAceito(file.mimetype)) return callback(null, true);
    return callback(new AppError("Formato de vídeo não aceito.", 415) as unknown as Error);
  },
});

const gravacoesRoutes = Router();
const controller = new GravacaoController();

gravacoesRoutes.post("/reunioes/:id/gravacoes", upload.single("video"), controller.create);
gravacoesRoutes.get("/reunioes/:id/resultado", controller.resultado);
gravacoesRoutes.get("/gravacoes/:id/arquivo", controller.arquivo);
gravacoesRoutes.post("/gravacoes/:id/reprocessar", controller.reprocessar);

export { gravacoesRoutes };
