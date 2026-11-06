/**
 * URL da API. Para apontar para o servidor local, crie `mobile/.env` com
 * EXPO_PUBLIC_API_URL=http://<ip-do-computador>:3333
 */
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || "https://api-seniorai.dimitech.com.br"
).replace(/\/+$/, "");

/** Última versão publicada do app (arquivo servido pelo site). */
export const VERSAO_URL =
  process.env.EXPO_PUBLIC_VERSAO_URL || "https://seniorai.dimitech.com.br/app-versao.json";
