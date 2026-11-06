// Mantido igual a mobile/src/domain/models.ts — altere os dois juntos.
export interface Usuario {
  codigo: number;
  usuario: string;
  nome: string;
  email: string;
  nomeAbreviado: string;
  nivelAcesso: number;
}

export interface Sessao {
  token: string;
  refreshToken: string;
  user: Usuario;
}

export type StatusReuniao = "AGENDADA" | "EM_ANDAMENTO" | "FINALIZADA" | "CANCELADA";

export interface Reuniao {
  id: string;
  titulo: string;
  assunto: string | null;
  objetivo: string | null;
  local: string | null;
  status: StatusReuniao;
  inicio_previsto: string | null;
  fim_previsto: string | null;
  iniciada_em: string | null;
  finalizada_em: string | null;
}
