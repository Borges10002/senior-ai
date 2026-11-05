import { defineBoot } from "#q-app/wrappers";
import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { clearSession, getAccessToken, getRefreshToken, sessionUser, setSession } from "src/services/session";

declare module "vue" {
  interface ComponentCustomProperties {
    $api: AxiosInstance;
  }
}

const baseURL = String(process.env.API_URL).replace(/\/+$/, "");
const api = axios.create({ baseURL });
const publicApi = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Um único refresh atende vários 401 simultâneos; cada requisição tenta de novo uma vez.
let renovando: Promise<void> | null = null;
export function renovarSessao(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return Promise.reject(new Error("Sem sessão"));
  renovando ??= publicApi
    .post("/auth/refresh", { refreshToken })
    .then(({ data }) => setSession(data))
    .catch((erro) => {
      clearSession();
      throw erro;
    })
    .finally(() => {
      renovando = null;
    });
  return renovando;
}

/** Recupera a sessão ao recarregar a página (o access token vive só em memória). */
export async function restaurarSessao(): Promise<void> {
  if (sessionUser.value || !getRefreshToken()) return;
  await renovarSessao().catch(() => undefined);
}

export async function entrar(email: string, senha: string): Promise<void> {
  const { data } = await publicApi.post("/auth/login", { email, senha });
  setSession(data);
}

export async function sair(): Promise<void> {
  await api.post("/auth/logout").catch(() => undefined);
  clearSession();
}

api.interceptors.response.use(undefined, async (erro: AxiosError) => {
  const config = erro.config as (InternalAxiosRequestConfig & { _tentouRenovar?: boolean }) | undefined;
  if (erro.response?.status === 401 && config && !config._tentouRenovar) {
    config._tentouRenovar = true;
    try {
      await renovarSessao();
    } catch {
      return Promise.reject(erro);
    }
    return api.request(config);
  }
  return Promise.reject(erro);
});

export function mensagemDeErro(erro: unknown): string {
  const dados = (erro as AxiosError<{ message?: string }>)?.response?.data;
  return dados?.message || "Não foi possível concluir a operação. Tente novamente.";
}

export default defineBoot(({ app }) => {
  app.config.globalProperties.$api = api;
});

export { api };
