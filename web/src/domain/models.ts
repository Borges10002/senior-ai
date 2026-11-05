export type Perfil = "proprietario" | "administrador" | "participante" | "convidado";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
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
