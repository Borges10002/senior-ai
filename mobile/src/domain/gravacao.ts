import type { Reuniao } from "./models";

export type StatusGravacao = "ENVIADA" | "TRANSCREVENDO" | "ANALISANDO" | "CONCLUIDA" | "FALHOU";

export interface Gravacao {
  id: string;
  status: StatusGravacao;
  erro: string | null;
  duracao_seg: number | null;
}

export interface Anotacao {
  id: string;
  resumo: string;
  assuntos: string[];
  decisoes: { descricao: string; horario: string }[];
  tarefas: { titulo: string; responsavel: string | null; prazo: string | null; horario: string }[];
  pendencias: string[];
}

export type StatusAgendamento = "CRIADO" | "CONFLITO" | "SEM_HORARIO" | "DATA_INVALIDA";

export interface Agendamento {
  id: string;
  titulo: string;
  inicio: string | null;
  status: StatusAgendamento;
  sugestao_inicio: string | null;
}

export interface ResultadoReuniao {
  reuniao: Reuniao;
  gravacoes: Gravacao[];
  anotacoes: Anotacao[];
  agendamentos: Agendamento[];
  transcricao: { inicio: number; fim: number; texto: string }[];
}

export const ETAPA_GRAVACAO: Record<StatusGravacao, string> = {
  ENVIADA: "Na fila para transcrever",
  TRANSCREVENDO: "Transcrevendo a conversa",
  ANALISANDO: "Anotando decisões, tarefas e agenda",
  CONCLUIDA: "Concluído",
  FALHOU: "Não foi possível processar",
};

export const estaProcessando = (gravacoes: Gravacao[]): boolean =>
  gravacoes.some((g) => g.status !== "CONCLUIDA" && g.status !== "FALHOU");

/** Android grava em MP4 e iOS em MOV. */
export function mimeDoVideo(uri: string): string {
  return /\.mov$/i.test(uri) ? "video/quicktime" : "video/mp4";
}

export function duracaoLegivel(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos));
  const h = Math.floor(total / 3600);
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return h ? `${h}:${m}:${s}` : `${m}:${s}`;
}

export function horarioDaFala(segundos: number): string {
  const total = Math.floor(segundos);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function tituloRapido(agora: Date): string {
  const data = agora.toLocaleDateString("pt-BR");
  const hora = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `Reunião de ${data} às ${hora}`;
}
