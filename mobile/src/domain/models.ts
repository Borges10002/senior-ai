export type Perfil = "proprietario" | "administrador" | "participante" | "convidado";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
}

export interface Sessao {
  accessToken: string;
  refreshToken: string;
  usuario: Usuario;
}

export type StatusReuniao = "AGENDADA" | "EM_ANDAMENTO" | "FINALIZADA" | "CANCELADA";

export interface Reuniao {
  id: string;
  titulo: string;
  assunto: string | null;
  status: StatusReuniao;
  inicio_previsto: string | null;
}

export const ROTULO_STATUS: Record<StatusReuniao, string> = {
  AGENDADA: "Agendada",
  EM_ANDAMENTO: "Em andamento",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

/** Confere o formato antes de usar uma sessão lida do armazenamento. */
export function sessaoValida(valor: unknown): valor is Sessao {
  const s = valor as Sessao;
  return (
    !!s &&
    typeof s.accessToken === "string" && !!s.accessToken &&
    typeof s.refreshToken === "string" && !!s.refreshToken &&
    typeof s.usuario?.id === "string"
  );
}
