import { sessionReady, sessionRevision, setSession, clearSession, clearLegacyCredentials } from "src/services/session";
import { defineBoot } from "#q-app/wrappers";
import axios, { type AxiosInstance } from "axios";

declare module "vue" {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
// Definida em web/.env (API_URL) ou no ambiente de build; ver quasar.config.ts.
const baseURL = String(
  process.env.API_URL || "https://api-seniorai.dimitech.com.br",
).replace(/\/+$/, "");
const options = { baseURL, withCredentials: true, headers: { 'X-Auth-Mode': 'cookie' } };
const api = axios.create(options);
const publicApi = axios.create(options);
clearLegacyCredentials();

const fieldLabels: Record<string, string> = {
  mensagem: "Mensagem",
  titulo: "Titulo",
  tipo: "Tipo",
  email: "Email",
  senha: "Senha",
  nome: "Nome",
};

const formatZodIssueMessage = (issue: any) => {
  const fieldKey = String(issue?.path?.[0] || "").trim();
  const fieldLabel = fieldLabels[fieldKey] || fieldKey || "Campo";

  if (issue?.code === "too_small" && issue?.type === "string") {
    return `${fieldLabel} deve ter pelo menos ${issue.minimum} caracteres.`;
  }

  if (issue?.code === "invalid_string" && issue?.validation === "email") {
    return `${fieldLabel} deve ser um email valido.`;
  }

  return issue?.message || "Dados invalidos.";
};

const extractApiErrorMessage = (error: any) => {
  const responseData = error?.response?.data;

  if (typeof responseData === "string") {
    return responseData;
  }

  if (typeof responseData?.message === "string") {
    return responseData.message;
  }

  if (Array.isArray(responseData?.message?.issues)) {
    return responseData.message.issues
      .map((issue: any) => formatZodIssueMessage(issue))
      .join(" ");
  }

  if (Array.isArray(responseData?.issues)) {
    return responseData.issues
      .map((issue: any) => formatZodIssueMessage(issue))
      .join(" ");
  }

  return "Ocorreu um erro ao processar a solicitacao.";
};

// A single refresh handles concurrent 401 responses; failed requests retry once.
let refreshing: Promise<void> | null = null;
let restoring: Promise<void> | null = null;
export function refreshSession(): Promise<void> {
  const revision = sessionRevision;
  refreshing ??= publicApi.post("/sessions/refresh-token", {}).then(({ data }) => {
    if (sessionRevision !== revision) throw new Error("Sessão alterada durante a renovação");
    setSession(data.user);
  }).catch((error) => { if (sessionRevision === revision) clearSession(); throw error; }).finally(() => { refreshing = null; });
  return refreshing;
}
export async function restoreSession(): Promise<void> {
  if (sessionReady.value) return;
  const revision = sessionRevision;
  restoring ??= api.get("/usuarios").then(({ data }) => { if (sessionRevision === revision) setSession(data); })
    .catch(() => { if (sessionRevision === revision) clearSession(); }).finally(() => { restoring = null; });
  return restoring;
}
export async function logoutSession(): Promise<void> {
  // Let any cookie renewal finish before asking the server to revoke and clear it.
  await refreshing?.catch(() => {});
  await publicApi.post("/sessions/logout", {});
  clearSession();
}
api.interceptors.response.use(response => response, async error => {
  const config = error.config;
  if (error.response?.status === 401 && config && !config._sessionRetried) {
    config._sessionRetried = true;
    try { await refreshSession(); } catch { return Promise.reject(error); }
    return api.request(config);
  }
  if (error.response?.status === 401) clearSession();
  return Promise.reject(error);
});

export default defineBoot(({ app }) => {
  // Conta só leitura (teste vencido sem pagamento): o layout mostra o aviso do plano.
  api.interceptors.response.use(undefined, async (error) => {
    if (error.response?.status === 402) {
      const { useAssinatura } = await import("src/composables/useAssinatura");
      useAssinatura().sinalizarBloqueio(error.response.data?.situacao);
    }
    return Promise.reject(error);
  });

  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios;
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api;
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
});

export { api, publicApi, extractApiErrorMessage };
