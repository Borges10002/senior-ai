import type { StatusReuniao } from "./models";

export const ROTULO_STATUS: Record<StatusReuniao, { texto: string; cor: string }> = {
  AGENDADA: { texto: "Agendada", cor: "primary" },
  EM_ANDAMENTO: { texto: "Em andamento", cor: "negative" },
  FINALIZADA: { texto: "Finalizada", cor: "positive" },
  CANCELADA: { texto: "Cancelada", cor: "grey" },
};

const FORMATO = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function formatarDataHora(iso: string | null): string {
  return iso ? FORMATO.format(new Date(iso)) : "Sem horário";
}
