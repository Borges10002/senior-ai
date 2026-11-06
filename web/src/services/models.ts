export interface ICollumns {
  name: string;
  field: string;
  label: string;
  align: "left" | "right" | "center";
  format?: Function;
  sortable: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Categoria {
  id?: string;
  nome: string;
  tipo: "Receita" | "Despesa";
}

export interface Cliente {
  id?: string;
  nome: string;
  email?: string;
  telefone?: string;
  separado?: boolean;
}

export interface Lancamento {
  id?: string;
  descricao: string;
  valor: number;
  tipo?: "Receita" | "Despesa";
  data: string;
  categoria_id?: string | Categoria | undefined;
  cliente_id?: string | Cliente | undefined;
  receber_notificacao?: boolean;
  data_notificacao?: string | null;
  pago?: boolean;
  data_pagamento?: string | null;
  repetir?: boolean;
  anotacoes_extras?: string | null;
  anotacoes_compartilhadas?: string | null;
  conta_habilitada?: boolean;
}

export interface LoginForm {
  email: string;
  password: string;
}
