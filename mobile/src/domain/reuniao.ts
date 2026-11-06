import type { Reuniao, StatusReuniao } from "./models";

export const ROTULO_STATUS: Record<StatusReuniao, string> = {
  AGENDADA: "Agendada",
  EM_ANDAMENTO: "Em andamento",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

const FORMATO = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function formatarDataHora(iso: string | null): string {
  return iso ? FORMATO.format(new Date(iso)) : "Sem horário";
}

export function contarPorStatus(reunioes: Reuniao[], status: StatusReuniao): number {
  return reunioes.filter((r) => r.status === status).length;
}

/** Próximas reuniões agendadas; as sem horário vão para o fim. */
export function proximasReunioes(reunioes: Reuniao[], limite = 5): Reuniao[] {
  return reunioes
    .filter((r) => r.status === "AGENDADA")
    .sort((a, b) => String(a.inicio_previsto ?? "9").localeCompare(String(b.inicio_previsto ?? "9")))
    .slice(0, limite);
}
