import { randomUUID } from "crypto";
import { decode, sign } from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import auth from "@config/auth.config";
import TOKEN_TYPE from "@/constants/tokenType.constants";
import { issueToken, verifySessionToken, refreshSecret } from "./tokenProfile";

const sid = randomUUID(), cv = "a".repeat(64);
describe("Perfil estrito dos JWTs", () => {
  it.each([TOKEN_TYPE.ACCESS, TOKEN_TYPE.REFRESH])("%s nao expoe dados pessoais ou privilegios", type => {
    const token = issueToken(type, 7, sid, cv);
    const payload = verifySessionToken(token, type);
    expect(payload.sub).toBe("7");
    expect(Object.keys(payload).sort()).toEqual(["aud", "cv", "exp", "iat", "iss", "jti", "sid", "sub", "tokenType", "ver"].sort());
    for (const key of ["user", "nome", "usuario", "email", "nivelAcesso", "senha"]) expect(payload).not.toHaveProperty(key);
    expect(decode(token, { complete: true })!.header.typ).toBe(type + "+jwt");
    expect(verifySessionToken(issueToken(type, 7, sid, cv), type).jti).not.toBe(payload.jti);
  });
  it("rejeita token alterado e troca entre access e refresh", () => {
    const access = issueToken(TOKEN_TYPE.ACCESS, 7, sid, cv);
    const refresh = issueToken(TOKEN_TYPE.REFRESH, 7, sid, cv);
    expect(() => verifySessionToken(access, TOKEN_TYPE.REFRESH)).toThrow();
    expect(() => verifySessionToken(refresh, TOKEN_TYPE.ACCESS)).toThrow();
    const parts = access.split(".");
    parts[1] = Buffer.from(JSON.stringify({ ...decode(access) as any, sub: "999" })).toString("base64url");
    expect(() => verifySessionToken(parts.join("."), TOKEN_TYPE.ACCESS)).toThrow();
  });
  it("rejeita o formato antigo, incluindo refresh antigo com dados pessoais", () => {
    for (const type of [TOKEN_TYPE.ACCESS, TOKEN_TYPE.REFRESH]) {
      const old = sign({ user: { codigo: 7, email: "pessoa@example.com", nivelAcesso: 3 }, tokenType: type, sid, cv },
        type === TOKEN_TYPE.ACCESS ? auth.jwt.secretToken! : refreshSecret(),
        { subject: JSON.stringify({ user: { codigo: 7 } }), jwtid: auth.jwt.jwtid, expiresIn: "1h" });
      expect(() => verifySessionToken(old, type)).toThrow();
    }
  });
  it.each(["issuer", "audience", "algorithm", "typ", "expiration", "sid", "subject", "version", "missingExp"])("rejeita %s incorreto mesmo com assinatura valida", invalid => {
    const payload: any = { tokenType: "access", sid, cv, ver: 2 };
    const options: any = { algorithm: "HS256", header: { typ: "access+jwt" }, subject: "7", issuer: auth.jwt.jwtid, audience: "senior-ai:access", jwtid: randomUUID(), expiresIn: "1h" };
    if (invalid === "issuer") options.issuer = "other-app";
    if (invalid === "audience") options.audience = "senior-ai:refresh";
    if (invalid === "algorithm") options.algorithm = "HS384";
    if (invalid === "typ") options.header.typ = "refresh+jwt";
    if (invalid === "expiration") options.expiresIn = -1;
    if (invalid === "sid") payload.sid = "invalid-uuid";
    if (invalid === "subject") options.subject = "{\"user\":{\"codigo\":7}}";
    if (invalid === "version") payload.ver = 1;
    if (invalid === "missingExp") delete options.expiresIn;
    const token = sign(payload, auth.jwt.secretToken!, options);
    expect(() => verifySessionToken(token, TOKEN_TYPE.ACCESS)).toThrow();
  });
});
