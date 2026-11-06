import AppError from "@shared/errors/AppError";
import "@/config/env";
import { Request, Response, NextFunction } from "express";
import mensagemConstants from "@/constants/mensagem.constants";
import { MulterError } from "multer";
import { ZodError } from "zod";



export default async function throwAppError(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isDebug = process.env.DEBUG === "true" || false;

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  } else if (err instanceof MulterError) {
    const grande = err.code === "LIMIT_FILE_SIZE";
    return res.status(grande ? 413 : 400).json({
      message: grande ? "O vídeo excede o tamanho máximo permitido." : "Envio de arquivo inválido.",
    });
  } else if (err instanceof ZodError) {
    // Dado inválido enviado pelo cliente: 400 com mensagem legível.
    return res.status(400).json({
      message: err.issues
        .map((issue) => {
          const campo = issue.path.join(".");
          return campo ? `${campo}: ${issue.message}` : issue.message;
        })
        .join(" "),
      issues: err.issues,
    });
  } else {
    // Erros de regra (AppError) e validação (zod) são esperados; só o
    // inesperado vai para o log, com stack (JSON.stringify de Error dá "{}").
    console.error("[Senior AI] Erro interno", { metodo: req.method, tipo: err.name });
    const message = isDebug
      ? err.message
      : mensagemConstants.ERRO_INTERNO_SERVIDOR;
    return res.status(500).json({
      message,
    });
  }
}
