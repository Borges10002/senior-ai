import "@/config/env";

// Segredos vêm só do ambiente; os padrões abaixo são prazos e identificadores.
export default {
  jwt: {
    secret: process.env.JWT_SECRET as string,
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshSecret: process.env.JWT_REFRESH_SECRET as string,
    refreshExpiresInDias: Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 7),
    issuer: process.env.JWT_ISSUER || "senior-ai-api",
  },
};
