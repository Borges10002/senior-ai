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
