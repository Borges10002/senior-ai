import { validateProductionSecurity } from "./security";

const base = {
  NODE_ENV: "production",
  JWT_SECRET: "a8Fk2pQ9zL4mN7xR1tV6yB3cW5eH0jUs",
  JWT_REFRESH_SECRET: "Z9yX8wV7uT6sR5qP4oN3mL2kJ1iH0gFe",
  REDIS_PASSWORD: "r3d1s-s3nh4-f0rt3",
  CORS_ORIGINS: "https://app.senior.ai",
};

describe("validateProductionSecurity", () => {
  it("aceita configuração segura", () => {
    expect(() => validateProductionSecurity(base)).not.toThrow();
  });

  it("ignora fora de produção", () => {
    expect(() => validateProductionSecurity({ NODE_ENV: "development" })).not.toThrow();
  });

  it("recusa segredo de exemplo", () => {
    expect(() =>
      validateProductionSecurity({ ...base, JWT_SECRET: "SUBSTITUIR_POR_SEGREDO_ALEATORIO_xxxxxxxxx" }),
    ).toThrow(/JWT_SECRET/);
  });

  it("recusa segredos iguais", () => {
    expect(() =>
      validateProductionSecurity({ ...base, JWT_REFRESH_SECRET: base.JWT_SECRET }),
    ).toThrow(/diferentes/);
  });

  it("recusa CORS sem HTTPS", () => {
    expect(() => validateProductionSecurity({ ...base, CORS_ORIGINS: "http://app.senior.ai" })).toThrow(
      /CORS_ORIGINS/,
    );
  });
});
