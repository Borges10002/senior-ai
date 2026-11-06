import { createHash, createHmac } from "crypto";
import auth from "@config/auth.config";
import { Usuario } from "@modules/usuario/infra/typeorm/entities/Usuario";
export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
// A password change immediately invalidates both token types, without exposing the password hash.
export const credentialVersion = (u: Usuario) =>
  createHmac("sha256", auth.jwt.secretToken!)
    .update(String(u.codigo) + ":" + u.senha)
    .digest("hex");
export const validAccount = (
  u: Usuario | null,
  version: unknown,
): u is Usuario =>
  !!u &&
  String(u.ativo).toUpperCase() === "S" &&
  typeof version === "string" &&
  credentialVersion(u) === version;
