import { api } from "src/boot/axios";

export type StatusAssinatura = "trial" | "ativa" | "inadimplente" | "cancelada";
export type CicloAssinatura = "MONTHLY" | "YEARLY";

export interface SituacaoAcesso {
  acesso: "completo" | "leitura";
  status: StatusAssinatura;
  diasTrial: number;
  acessoAte: string | null;
  mensagem: string;
}

export interface MinhaAssinatura {
  plano: { nome: string; precos: Record<CicloAssinatura, number>; trialDias: number };
  cobrancaAtiva: boolean;
  assinatura: {
    status: StatusAssinatura;
    ciclo: CicloAssinatura | null;
    valor: number | null;
    trial_fim: string;
    periodo_fim: string | null;
    link_pagamento: string | null;
    assinado: boolean;
  };
  situacao: SituacaoAcesso;
}

export const STATUS_ASSINATURA: Record<StatusAssinatura, { rotulo: string; icone: string; cor: string; fundo: string }> = {
  trial: { rotulo: "Teste grátis", icone: "hourglass_top", cor: "var(--mf-primary)", fundo: "var(--mf-primary-soft)" },
  ativa: { rotulo: "Ativa", icone: "verified", cor: "var(--mf-income)", fundo: "var(--mf-income-soft)" },
  inadimplente: { rotulo: "Pagamento pendente", icone: "error", cor: "var(--mf-warning)", fundo: "var(--mf-warning-soft)" },
  cancelada: { rotulo: "Cancelada", icone: "block", cor: "var(--mf-expense)", fundo: "var(--mf-expense-soft)" },
};

/** O que o Pro inclui — mostrado na tela do plano e no aviso de bloqueio. */
export const RECURSOS_PRO = [
  { icone: "groups", texto: "Reuniões ilimitadas, do agendamento ao encerramento" },
  { icone: "mic", texto: "Gravação e transcrição das conversas" },
  { icone: "description", texto: "Atas geradas por inteligência artificial" },
  { icone: "task_alt", texto: "Decisões, tarefas e responsáveis extraídos automaticamente" },
  { icone: "event", texto: "Agenda com autorização antes de cada ação" },
  { icone: "smartphone", texto: "App no celular sincronizado com o web" },
];

export const assinaturaService = {
  async minha(): Promise<MinhaAssinatura> {
    return (await api.get<MinhaAssinatura>("/assinatura")).data;
  },
  async assinar(ciclo: CicloAssinatura, documento?: string): Promise<{ link: string | null; jaAssinado: boolean }> {
    return (await api.post("/assinatura", { ciclo, documento: documento || undefined })).data;
  },
  async cancelar(): Promise<MinhaAssinatura> {
    return (await api.delete<MinhaAssinatura>("/assinatura")).data;
  },
};
