import { randomUUID, createHmac } from "crypto";
import { sign, verify, type JwtPayload, type Secret, type SignOptions } from "jsonwebtoken";
import auth from "@config/auth.config";
import TOKEN_TYPE from "@/constants/tokenType.constants";

type TokenType = typeof TOKEN_TYPE[keyof typeof TOKEN_TYPE];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const issuer = () => auth.jwt.jwtid;
const audience = (type: TokenType) => "senior-ai:" + type;
export const refreshSecret = (): Secret => auth.jwt.refreshSecretToken ||
  createHmac("sha256", auth.jwt.secretToken!).update("senior-ai:refresh-signing-key:v2").digest("hex");

export interface SessionClaims extends JwtPayload {
  sub: string;
  sid: string;
  cv: string;
  tokenType: TokenType;
  ver: 2;
  exp: number;
  iat: number;
  jti: string;
}
export function issueToken(type: TokenType, codigo: number, sid: string, cv: string): string {
  return sign({ tokenType: type, sid, cv, ver: 2 }, type === TOKEN_TYPE.ACCESS ? auth.jwt.secretToken! : refreshSecret(), {
    algorithm: "HS256",
    header: { alg: "HS256", typ: type + "+jwt" },
    subject: String(codigo), issuer: issuer(), audience: audience(type), jwtid: randomUUID(),
    expiresIn: (type === TOKEN_TYPE.ACCESS ? auth.jwt.expiresIn : auth.jwt.refreshExpiresIn) as SignOptions["expiresIn"],
  });
}
export function verifySessionToken(token: string, type: TokenType): SessionClaims {
  if (typeof token !== "string" || token.length > 2048) throw new Error("Invalid token");
  const result = verify(token, type === TOKEN_TYPE.ACCESS ? auth.jwt.secretToken! : refreshSecret(), {
    algorithms: ["HS256"], issuer: issuer(), audience: audience(type), complete: true,
  });
  const p = result.payload as SessionClaims;
  const now = Math.floor(Date.now() / 1000);
  if (result.header.typ !== type + "+jwt" || typeof p !== "object" || p.ver !== 2 || p.tokenType !== type ||
      typeof p.sub !== "string" || !/^[1-9][0-9]*$/.test(p.sub) || !Number.isSafeInteger(Number(p.sub)) ||
      typeof p.sid !== "string" || !UUID.test(p.sid) || typeof p.cv !== "string" || !/^[a-f0-9]{64}$/.test(p.cv) ||
      typeof p.jti !== "string" || !UUID.test(p.jti) || !Number.isFinite(p.iat) || !Number.isFinite(p.exp) ||
      p.iat > now + 30 || p.exp <= p.iat) throw new Error("Invalid token claims");
  return p;
}
