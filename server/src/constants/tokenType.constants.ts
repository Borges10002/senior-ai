// Diferencia os tokens para que um refresh token nao seja aceito como
// access token (e vice-versa), mesmo quando os segredos forem iguais.
export default {
  ACCESS: "access",
  REFRESH: "refresh",
} as const;
