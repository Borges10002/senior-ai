import { api } from "src/boot/axios";
import type { Perfil } from "src/composables/usePerfil";

export interface ResumoAdmin {
  usuarios: {
    total: number;
    ativos: number;
    inativos: number;
    porPerfil: { nivel: number; nome: string; total: number }[];
  };
  feedbacks: {
    total: number;
    ultimos7Dias: number;
    porTipo: Record<string, number>;
  };
  reunioes: { total: number };
}

export type CicloVenda = "MONTHLY" | "YEARLY";
export type StatusAssinante = "trial" | "ativa" | "inadimplente" | "cancelada";

export interface VendaAdmin {
  id: string;
  comprador: { codigo: number; nome: string; email: string | null };
  ciclo: CicloVenda | null;
  valor: number;
  valor_liquido: number | null;
  forma_pagamento: string | null;
  status: "paga" | "estornada";
  pago_em: string;
  receitaLancada: boolean;
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
    assinantes: Record<StatusAssinante, number>;
    estornos: number;
    porMes: { mes: string; bruto: number; liquido: number; vendas: number }[];
    porCiclo: { ciclo: CicloVenda; vendas: number; valor: number }[];
    porForma: { forma: string; vendas: number; valor: number }[];
  };
  vendas: VendaAdmin[];
}

export interface OpcaoPerfil {
  nivel: number;
  nome: string;
}

export interface UsuarioAdmin {
  codigo: number;
  nome: string;
  nomeAbreviado: string;
  usuario: string;
  email: string;
  ativo: boolean;
  perfil: Perfil;
}

export const adminService = {
  async resumo() {
    const { data } = await api.get<ResumoAdmin>("/admin/resumo");
    return data;
  },

  async vendas() {
    const { data } = await api.get<PainelVendas>("/admin/vendas");
    return data;
  },

  /** Consulta as cobranças no gateway antes de montar o painel. */
  async sincronizarVendas() {
    const { data } = await api.post<PainelVendas>("/admin/vendas/sincronizar");
    return data;
  },

  async perfis() {
    const { data } = await api.get<OpcaoPerfil[]>("/admin/perfis");
    return data;
  },

  async usuarios() {
    const { data } = await api.get<UsuarioAdmin[]>("/admin/usuarios");
    return data;
  },

  async alterarUsuario(codigo: number, alteracao: { nivel?: number; ativo?: boolean }) {
    const { data } = await api.patch<UsuarioAdmin>(`/admin/usuarios/${codigo}`, alteracao);
    return data;
  },
};
