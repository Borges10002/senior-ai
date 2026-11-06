export function validateProductionSecurity(env: NodeJS.ProcessEnv): void {
  if (env.NODE_ENV !== "production") return;
  for (const name of ["JWT_SECRET", "JWT_REFRESH_SECRET"]) {
    const value = env[name];
    if (name === "JWT_REFRESH_SECRET" && !value) continue; // A separate key is derived when omitted.
    if (!value || Buffer.byteLength(value) < 32 || new Set(value).size < 10 || /troque|replace|change.?me|example|exemplo|gere[_ ]/i.test(value)) {
      throw new Error(name + " deve conter um segredo aleatorio com pelo menos 32 bytes em producao.");
    }
  }
  if (env.JWT_REFRESH_SECRET && env.JWT_REFRESH_SECRET === env.JWT_SECRET) throw new Error("JWT_SECRET e JWT_REFRESH_SECRET devem ser diferentes.");
  const origins = (env.CORS_ORIGINS || "").split(",").map(v => v.trim()).filter(Boolean);
  if (!origins.length || origins.some(value => {
    try { const u = new URL(value); return u.protocol !== "https:" || u.origin !== value || !!u.username || !!u.password; }
    catch { return true; }
  })) throw new Error("CORS_ORIGINS deve listar origens HTTPS exatas em producao.");
  if (env.DB_SYNCHRONIZE === "true") throw new Error("DB_SYNCHRONIZE nao pode ser true em producao.");
  if (env.DEBUG === "true") throw new Error("DEBUG nao pode ser true em producao.");
}
