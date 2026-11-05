import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import mensagens from "@/constants/mensagem.constants";
import AppError from "@shared/errors/AppError";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function throwAppError(err: Error, req: Request, res: Response, _next: NextFunction): Response {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: err.issues
        .map((issue) => {
          const campo = issue.path.join(".");
          return campo ? `${campo}: ${issue.message}` : issue.message;
        })
        .join(" "),
      issues: err.issues,
    });
  }

  // JSON malformado no corpo da requisição.
  if ((err as { type?: string }).type === "entity.parse.failed") {
    return res.status(400).json({ message: "JSON inválido." });
  }

  // Só o inesperado vai para o log, sem corpo da requisição (pode ter senha ou token).
  console.error("[Senior AI] Erro interno", { metodo: req.method, rota: req.path, erro: err });
  return res.status(500).json({
    message: process.env.DEBUG === "true" ? err.message : mensagens.ERRO_INTERNO_SERVIDOR,
  });
}
