import { describe, expect, it } from "vitest";
import { validateProductionSecurity } from "./security";
const valid = () => ({ NODE_ENV: "production", JWT_SECRET: "0123456789abcdef".repeat(4), JWT_REFRESH_SECRET: "fedcba9876543210".repeat(4), CORS_ORIGINS: "https://app.example.com" });
describe("Configuracao segura de producao", () => {
  it("aceita segredos distintos e origens HTTPS exatas", () => { expect(() => validateProductionSecurity(valid())).not.toThrow(); });
  it("pode derivar chave de refresh separada quando nao configurada", () => { expect(() => validateProductionSecurity({ ...valid(), JWT_REFRESH_SECRET: undefined })).not.toThrow(); });
  it.each([
    { JWT_SECRET: "curto" }, { JWT_SECRET: "a".repeat(64) }, { JWT_REFRESH_SECRET: "curto" }, { JWT_SECRET: "" },
    { JWT_REFRESH_SECRET: "0123456789abcdef".repeat(4) }, { CORS_ORIGINS: "*" },
    { CORS_ORIGINS: "" }, { CORS_ORIGINS: "http://app.example.com" },
    { CORS_ORIGINS: "https://app.example.com/path" },
    { DB_SYNCHRONIZE: "true" }, { DEBUG: "true" },
  ])("recusa configuracao insegura %j", patch => { expect(() => validateProductionSecurity({ ...valid(), ...patch })).toThrow(); });
  it("permite o desenvolvimento local sem exigir HTTPS", () => { expect(() => validateProductionSecurity({ NODE_ENV: "development" })).not.toThrow(); });
});
