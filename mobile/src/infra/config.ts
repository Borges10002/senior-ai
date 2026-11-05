/**
 * URL da API (com /api/v1). Para a API local:
 *   emulador Android: EXPO_PUBLIC_API_URL=http://10.0.2.2:3333/api/v1
 *   celular na rede:  EXPO_PUBLIC_API_URL=http://<ip-do-computador>:3333/api/v1
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:3333/api/v1").replace(/\/+$/, "");
