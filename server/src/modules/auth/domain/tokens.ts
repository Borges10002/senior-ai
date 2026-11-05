import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import { sign, verify, type SignOptions } from "jsonwebtoken";
import auth from "@config/auth.config";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const AUDIENCIA_ACCESS = "senior-ai:access";

export interface ClaimsAccess {
  sub: string; // id do usuário
  sid: string; // id da sessão
  cv: number; // versão da credencial
}

export function emitirAccessToken({ sub, sid, cv }: ClaimsAccess): string {
  return sign({ sid, cv }, auth.jwt.secret, {
    algorithm: "HS256",
    subject: sub,
    issuer: auth.jwt.issuer,
    audience: AUDIENCIA_ACCESS,
    jwtid: randomUUID(),
    expiresIn: auth.jwt.expiresIn as SignOptions["expiresIn"],
  });
}

/** Lança erro se o token for inválido, expirado ou com claims fora do formato. */
export function verificarAccessToken(token: string): ClaimsAccess {
  if (typeof token !== "string" || token.length > 2048) throw new Error("Token inválido");
  const p = verify(token, auth.jwt.secret, {
    algorithms: ["HS256"],
    issuer: auth.jwt.issuer,
    audience: AUDIENCIA_ACCESS,
  }) as Record<string, unknown>;
  if (
    typeof p.sub !== "string" || !UUID.test(p.sub) ||
    typeof p.sid !== "string" || !UUID.test(p.sid) ||
    !Number.isInteger(p.cv)
  ) {
    throw new Error("Claims inválidas");
  }
  return { sub: p.sub, sid: p.sid, cv: p.cv as number };
}

/** HMAC com JWT_REFRESH_SECRET: um vazamento do banco não revela refresh tokens válidos. */
export function hashRefresh(segredo: string): string {
  return createHmac("sha256", auth.jwt.refreshSecret).update(segredo).digest("hex");
}

/** Refresh token opaco no formato `<sessaoId>.<segredo>`. */
export function gerarRefreshToken(sessaoId: string): { token: string; hash: string } {
  const segredo = randomBytes(32).toString("base64url");
  return { token: `${sessaoId}.${segredo}`, hash: hashRefresh(segredo) };
}

export function lerRefreshToken(token: string): { sessaoId: string; segredo: string } | null {
  if (typeof token !== "string" || token.length > 200) return null;
  const [sessaoId, segredo, ...resto] = token.split(".");
  if (resto.length || !sessaoId || !segredo || !UUID.test(sessaoId)) return null;
  return { sessaoId, segredo };
}

export function hashConfere(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function expiracaoRefresh(agora = new Date()): Date {
  return new Date(agora.getTime() + auth.jwt.refreshExpiresInDias * 24 * 60 * 60 * 1000);
}
