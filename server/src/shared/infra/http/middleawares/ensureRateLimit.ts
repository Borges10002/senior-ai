import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";

const MENSAGEM_LIMITE = {
  message: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
};

/** Limite geral por IP, folgado para o uso normal do app. */
export default function ensureRateLimit(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    statusCode: 429,
    message: MENSAGEM_LIMITE,
  });
}

/**
 * Limite das rotas públicas (login, cadastro, consulta de e-mail):
 * dificulta força bruta de senha e varredura de e-mails cadastrados.
 * Em login/senha as tentativas bem-sucedidas não contam (`contarSucesso: false`),
 * para não travar quem acerta; em cadastro e consulta de e-mail tudo conta.
 */
export function ensureAuthRateLimit({
  contarSucesso = false,
}: { contarSucesso?: boolean } = {}): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    statusCode: 429,
    skipSuccessfulRequests: !contarSucesso,
    message: MENSAGEM_LIMITE,
  });
}
