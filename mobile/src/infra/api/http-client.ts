import type { Sessao } from "@/domain/models";
import { API_URL } from "@/infra/config";
import { carregarSessao, limparSessao, salvarSessao } from "@/infra/storage/session-storage";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

let aoExpirar: (() => void) | null = null;
/** O AuthProvider registra aqui o que fazer quando a sessão não pode mais ser renovada. */
export function configurarSessaoExpirada(fn: () => void) {
  aoExpirar = fn;
}

async function pedir<T>(caminho: string, init: RequestInit = {}, token?: string): Promise<T> {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (resposta.status === 204) return undefined as T;
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new ApiError(dados?.message || "Não foi possível concluir a operação.", resposta.status);
  }
  return dados as T;
}

// Um único refresh atende várias requisições que receberam 401 juntas.
let renovando: Promise<Sessao | null> | null = null;
function renovar(refreshToken: string): Promise<Sessao | null> {
  renovando ??= pedir<Sessao>("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken }) })
    .then(async (s) => (await salvarSessao(s), s))
    .catch(async () => (await limparSessao(), aoExpirar?.(), null))
    .finally(() => (renovando = null));
  return renovando;
}

/** Requisição autenticada: renova a sessão uma vez em caso de 401. */
export async function api<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const sessao = await carregarSessao();
  if (!sessao) throw new ApiError("Sessão encerrada.", 401);
  try {
    return await pedir<T>(caminho, init, sessao.accessToken);
  } catch (erro) {
    if (!(erro instanceof ApiError) || erro.status !== 401) throw erro;
    const nova = await renovar(sessao.refreshToken);
    if (!nova) throw erro;
    return pedir<T>(caminho, init, nova.accessToken);
  }
}

export async function login(email: string, senha: string): Promise<Sessao> {
  const sessao = await pedir<Sessao>("/auth/login", { method: "POST", body: JSON.stringify({ email, senha }) });
  await salvarSessao(sessao);
  return sessao;
}

export async function logout(): Promise<void> {
  await api("/auth/logout", { method: "POST" }).catch(() => undefined);
  await limparSessao();
}
