import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";

const MENSAGEM_LIMITE = { message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };

/** Limite geral por IP, folgado para o uso normal do app. */
export default function ensureRateLimit(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: MENSAGEM_LIMITE,
  });
}

/**
 * Limite das rotas públicas de autenticação: dificulta força bruta de senha.
 * Em login as tentativas bem-sucedidas não contam; em cadastro tudo conta.
 */
export function ensureAuthRateLimit({ contarSucesso = false }: { contarSucesso?: boolean } = {}): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skipSuccessfulRequests: !contarSucesso,
    message: MENSAGEM_LIMITE,
  });
}
