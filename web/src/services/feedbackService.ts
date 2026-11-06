import { api } from "src/boot/axios";

export type StatusFeedback = "aberto" | "andamento" | "concluido";
export type TipoFeedback = "Sugestao" | "Erro" | "Duvida";

export interface Feedback {
  id: string;
  tipo: TipoFeedback | string;
  titulo: string;
  mensagem: string;
  pagina: string;
  status: StatusFeedback;
  resposta: string | null;
  respondido_em: string | null;
  created_at: string;
  updated_at?: string;
}

export interface FeedbackAdmin extends Feedback {
  usuario: { codigo: number; nome: string; email: string } | null;
}

/** Rótulos, ícones e cores de tipo e status, usados em todas as telas de feedback. */
export const TIPOS_FEEDBACK: Record<TipoFeedback, { rotulo: string; icone: string; cor: string; fundo: string; descricao: string }> = {
  Sugestao: { rotulo: "Sugestão", icone: "lightbulb", cor: "var(--mf-income)", fundo: "var(--mf-income-soft)", descricao: "Uma ideia para melhorar o sistema" },
  Erro: { rotulo: "Erro", icone: "bug_report", cor: "var(--mf-expense)", fundo: "var(--mf-expense-soft)", descricao: "Algo não funcionou como deveria" },
  Duvida: { rotulo: "Dúvida", icone: "help", cor: "var(--mf-warning)", fundo: "var(--mf-warning-soft)", descricao: "Não entendi como usar algo" },
};

export const STATUS_FEEDBACK: Record<StatusFeedback, { rotulo: string; icone: string; cor: string; fundo: string }> = {
  aberto: { rotulo: "Aberto", icone: "mark_email_unread", cor: "var(--mf-primary)", fundo: "var(--mf-primary-soft)" },
  andamento: { rotulo: "Em andamento", icone: "autorenew", cor: "var(--mf-warning)", fundo: "var(--mf-warning-soft)" },
  concluido: { rotulo: "Concluído", icone: "task_alt", cor: "var(--mf-income)", fundo: "var(--mf-income-soft)" },
};

export const estiloTipo = (tipo: string) =>
  TIPOS_FEEDBACK[tipo as TipoFeedback] ?? { rotulo: tipo, icone: "forum", cor: "var(--mf-primary)", fundo: "var(--mf-primary-soft)", descricao: "" };

export const estiloStatus = (status: string | null | undefined) =>
  STATUS_FEEDBACK[(status as StatusFeedback) ?? "aberto"] ?? STATUS_FEEDBACK.aberto;

export const formatarDataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export const feedbackService = {
  // ---- usuário
  async enviar(dados: { tipo: TipoFeedback; titulo: string; mensagem: string; pagina: string }) {
    const { data } = await api.post<Feedback>("/feedbacks", dados);
    return data;
  },

  /** Feedbacks enviados pelo usuário logado, com status e resposta. */
  async meus() {
    const { data } = await api.get<Feedback[]>("/feedbacks");
    return data;
  },

  // ---- administrador (rotas /admin)
  async listarTodos() {
    const { data } = await api.get<FeedbackAdmin[]>("/admin/feedbacks");
    return data;
  },

  async atualizar(id: string, dados: { status?: StatusFeedback; resposta?: string | null }) {
    const { data } = await api.patch<Feedback>(`/admin/feedbacks/${id}`, dados);
    return data;
  },

  excluir: (id: string) => api.delete(`/admin/feedbacks/${id}`),
};
