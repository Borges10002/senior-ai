const PLACEHOLDER = /substituir|troque|replace|change.?me|example|exemplo/i;

function segredoFraco(valor: string | undefined): boolean {
  return !valor || Buffer.byteLength(valor) < 32 || new Set(valor).size < 10 || PLACEHOLDER.test(valor);
}

/** Recusa subir em produção com segredos de exemplo ou configuração insegura. */
export function validateProductionSecurity(env: NodeJS.ProcessEnv): void {
  if (env.NODE_ENV !== "production") return;

  for (const nome of ["JWT_SECRET", "JWT_REFRESH_SECRET"] as const) {
    if (segredoFraco(env[nome])) {
      throw new Error(`${nome} deve conter um segredo aleatório com pelo menos 32 bytes em produção.`);
    }
  }
  if (env.JWT_SECRET === env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_SECRET e JWT_REFRESH_SECRET devem ser diferentes.");
  }
  if (!env.REDIS_PASSWORD || PLACEHOLDER.test(env.REDIS_PASSWORD)) {
    throw new Error("REDIS_PASSWORD deve ser definido em produção.");
  }

  const origens = (env.CORS_ORIGINS || "").split(",").map((v) => v.trim()).filter(Boolean);
  const origemInvalida = (valor: string) => {
    try {
      const u = new URL(valor);
      return u.protocol !== "https:" || u.origin !== valor || !!u.username || !!u.password;
    } catch {
      return true;
    }
  };
  if (!origens.length || origens.some(origemInvalida)) {
    throw new Error("CORS_ORIGINS deve listar origens HTTPS exatas em produção.");
  }
  if (env.DB_SYNCHRONIZE === "true") throw new Error("DB_SYNCHRONIZE não pode ser true em produção.");
  if (env.DEBUG === "true") throw new Error("DEBUG não pode ser true em produção.");
}
