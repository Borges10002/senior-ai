import "@/config/env";

// Tudo vem do ambiente; os padrões abaixo não são segredos, só prazos e ids.
export default {
  jwt: {
    secretToken: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshSecretToken: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "2d",
    jwtid: process.env.JWT_ID || "senior-ai-api",
  },
};
