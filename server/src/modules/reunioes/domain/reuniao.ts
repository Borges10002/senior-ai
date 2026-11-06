import AppError from "@shared/errors/AppError";

export const STATUS_REUNIAO = ["AGENDADA", "EM_ANDAMENTO", "FINALIZADA", "CANCELADA"] as const;
export type StatusReuniao = (typeof STATUS_REUNIAO)[number];

const TRANSICOES: Record<StatusReuniao, StatusReuniao[]> = {
  AGENDADA: ["EM_ANDAMENTO", "CANCELADA"],
  EM_ANDAMENTO: ["FINALIZADA"],
  FINALIZADA: [],
  CANCELADA: [],
};

export function podeMudarStatus(de: StatusReuniao, para: StatusReuniao): boolean {
  return TRANSICOES[de].includes(para);
}

export function garantirTransicao(de: StatusReuniao, para: StatusReuniao): void {
  if (!podeMudarStatus(de, para)) {
    throw new AppError(`Não é possível mudar a reunião de ${de} para ${para}.`, 409);
  }
}

/** Reunião iniciada pode ter gravação (RN013): não é excluída, só a agendada ou cancelada. */
export function podeExcluir(status: StatusReuniao): boolean {
  return status === "AGENDADA" || status === "CANCELADA";
}

const UMA_HORA = 60 * 60 * 1000;

/** Período ocupado por cada reunião; sem término previsto, conta uma hora. */
export function periodosDasReunioes(
  reunioes: { inicio_previsto: Date | null; fim_previsto: Date | null }[],
  apos: Date,
): { inicio: Date; fim: Date }[] {
  return reunioes
    .filter((r): r is { inicio_previsto: Date; fim_previsto: Date | null } => r.inicio_previsto !== null)
    .map((r) => ({
      inicio: new Date(r.inicio_previsto),
      fim: new Date(r.fim_previsto ?? new Date(r.inicio_previsto).getTime() + UMA_HORA),
    }))
    .filter((p) => p.fim > apos);
}
