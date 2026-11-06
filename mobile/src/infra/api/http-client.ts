import type { Sessao } from "@/domain/models";
import { API_URL } from "@/infra/config";
import { urlHttpsSegura } from "@/domain/seguranca";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

type SessionBridge = {
  get: () => Sessao | null;
  refresh: () => Promise<Sessao | null>;
  onExpired: () => void;
};

let bridge: SessionBridge | null = null;
let aoPrecisarAssinar: ((mensagem: string) => void) | null = null;

/** Chamado quando a API responde 402 (teste grátis vencido: conta só leitura). */
export function configurarAvisoAssinatura(callback: (mensagem: string) => void) {
  aoPrecisarAssinar = callback;
}

/** Conecta o cliente HTTP ao estado de autenticação (feito pelo AuthProvider). */
export function configurarSessao(novo: SessionBridge) {
  bridge = novo;
}

function mensagemDeErro(corpo: unknown, status: number): string {
  if (status >= 500) return "O servidor está indisponível no momento. Tente novamente mais tarde.";
  const dados = corpo as { message?: unknown; issues?: { message?: string }[] };
  if (typeof dados?.message === "string") return dados.message;
  const issues =
    (dados?.message as { issues?: { message?: string }[] })?.issues ??
    dados?.issues;
  if (Array.isArray(issues) && issues.length) {
    return issues.map((i) => i.message).filter(Boolean).join(" ");
  }
  return "Não foi possível concluir a operação.";
}

interface Opcoes {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  publica?: boolean;
}

export function exigirConexaoSegura() {
  if (!urlHttpsSegura(API_URL) && !(typeof __DEV__ !== "undefined" && __DEV__ && API_URL.startsWith("http://"))) {
    throw new ApiError("A conexão com a API exige HTTPS.", 0);
  }
}

/** Token atual, para envios que não passam por `request` (upload de vídeo). */
export const tokenDaSessao = (): string | null => bridge?.get()?.token ?? null;

async function executar(path: string, opcoes: Opcoes, token?: string) {
  if (!path.startsWith("/") || path.startsWith("//") || /[\\\r\n#]/.test(path)) {
    throw new ApiError("Caminho de API inválido.", 0);
  }
  exigirConexaoSegura();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opcoes.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    return await fetch(`${API_URL}${path}`, {
      method: opcoes.method ?? "GET",
      headers,
      body: opcoes.body !== undefined ? JSON.stringify(opcoes.body) : undefined,
      signal: controller.signal,
      redirect: "error",
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function request<T>(path: string, opcoes: Opcoes = {}): Promise<T> {
  let resposta: Response;
  try {
    const sessaoInicial = opcoes.publica ? null : bridge?.get();
    const token = sessaoInicial?.token;
    if (!opcoes.publica && !token) throw new ApiError("Sessão expirada. Entre novamente.", 401);
    resposta = await executar(path, opcoes, token);

    if (!opcoes.publica && bridge?.get()?.user.codigo !== sessaoInicial?.user.codigo) {
      throw new ApiError("Sessão alterada. Tente novamente.", 401);
    }

    if (resposta.status === 401 && !opcoes.publica && bridge) {
      const sessaoOriginal = bridge.get();
      const renovada = await bridge.refresh();
      if (!renovada) {
        if (bridge.get() === sessaoOriginal) bridge.onExpired();
        throw new ApiError("Sessão expirada. Entre novamente.", 401);
      }
      resposta = await executar(path, opcoes, renovada.token);
      if (resposta.status === 401 && bridge.get() === renovada) bridge.onExpired();
    }
  } catch (erro) {
    if (erro instanceof ApiError) throw erro;
    throw new ApiError(
      "Sem conexão com o servidor. Verifique sua internet e tente de novo.",
      0,
    );
  }

  if (resposta.status === 204) return undefined as T;

  const texto = await resposta.text();
  const corpo = texto ? safeJson(texto) : undefined;

  if (!resposta.ok) {
    const mensagem = mensagemDeErro(corpo, resposta.status);
    if (resposta.status === 402) aoPrecisarAssinar?.(mensagem);
    throw new ApiError(mensagem, resposta.status);
  }
  return corpo as T;
}

function safeJson(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
}
