import type { Reuniao, Sessao } from "@/domain/models";

import { request } from "./http-client";

export const authService = {
  entrar: (email: string, senha: string) =>
    request<Sessao>("/sessions", {
      method: "POST",
      body: { email: email.trim().toLowerCase(), password: senha },
      publica: true,
    }),

  /** Esqueci minha senha: a API manda o link para o e-mail, se estiver cadastrado. */
  esqueciSenha: (email: string) =>
    request<{ message: string }>("/senha/esqueci", {
      method: "POST",
      body: { email: email.trim() },
      publica: true,
    }),

  renovar: (refreshToken: string) =>
    request<Sessao>("/sessions/refresh-token", {
      method: "POST",
      body: { refreshToken },
      publica: true,
    }),

  cadastrar: (nome: string, email: string, senha: string) => {
    const emailNormalizado = email.trim().toLowerCase();
    return request("/usuarios", {
      method: "POST",
      publica: true,
      body: {
        nome: nome.trim(),
        usuario: emailNormalizado.split("@")[0].toUpperCase(),
        email: emailNormalizado,
        senha,
        cpf: "00000000000",
      },
    });
  },

  alterarSenha: (senhaAtual: string, novaSenha: string) =>
    request("/usuarios/alterar-senha", {
      method: "PUT",
      body: { senhaAtual, novaSenha, confirmarSenha: novaSenha },
    }),
};

export interface NovaReuniao {
  titulo: string;
  assunto?: string | null;
  inicio_previsto?: string | null;
}

export type AcaoReuniao = "iniciar" | "finalizar" | "cancelar";

export const reuniaoService = {
  listar: () => request<Reuniao[]>("/reunioes"),
  criar: (dados: NovaReuniao) => request<Reuniao>("/reunioes", { method: "POST", body: dados }),
  mudarStatus: (id: string, acao: AcaoReuniao) =>
    request<Reuniao>(`/reunioes/${id}/${acao}`, { method: "POST" }),
  excluir: (id: string) => request<void>(`/reunioes/${id}`, { method: "DELETE" }),
};

export interface VendaAdmin {
  id: string;
  comprador: { codigo: number; nome: string; email: string | null };
  ciclo: CicloAssinatura | null;
  valor: number;
  valor_liquido: number | null;
  forma_pagamento: string | null;
  status: "paga" | "estornada";
  pago_em: string;
}

export interface PainelVendas {
  recebedor: { codigo: number; nome: string; email: string } | null;
  gatewayConfigurado: boolean;
  resumo: {
    receitaMes: number;
    receitaMesAnterior: number;
    vendasMes: number;
    receitaTotal: number;
    liquidoTotal: number;
    taxasTotal: number;
    vendasTotal: number;
    ticketMedio: number;
    mrr: number;
    assinantes: Record<StatusAssinatura, number>;
    estornos: number;
    porMes: { mes: string; bruto: number; liquido: number; vendas: number }[];
    porCiclo: { ciclo: CicloAssinatura; vendas: number; valor: number }[];
    porForma: { forma: string; vendas: number; valor: number }[];
  };
  vendas: VendaAdmin[];
}

/** Rotas de administrador: a API recusa (403) quem não tem o perfil. */
export const adminService = {
  vendas: () => request<PainelVendas>("/admin/vendas"),
  /** Confere as cobranças direto no gateway antes de montar o painel. */
  sincronizarVendas: () => request<PainelVendas>("/admin/vendas/sincronizar", { method: "POST" }),
};

export type StatusAssinatura = "trial" | "ativa" | "inadimplente" | "cancelada";
export type CicloAssinatura = "MONTHLY" | "YEARLY";

export interface MinhaAssinatura {
  plano: {
    nome: string;
    precos: Record<CicloAssinatura, number>;
    trialDias: number;
  };
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
  situacao: {
    acesso: "completo" | "leitura";
    status: StatusAssinatura;
    diasTrial: number;
    acessoAte: string | null;
    mensagem: string;
  };
}

export const assinaturaService = {
  minha: () => request<MinhaAssinatura>("/assinatura"),
  assinar: (ciclo: CicloAssinatura, documento?: string) =>
    request<{ link: string | null; jaAssinado: boolean }>("/assinatura", {
      method: "POST",
      body: { ciclo, documento: documento || undefined },
    }),
  cancelar: () => request<MinhaAssinatura>("/assinatura", { method: "DELETE" }),
};
