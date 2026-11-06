export const STATUS_AGENDAMENTO = ["CRIADO", "CONFLITO", "SEM_HORARIO", "DATA_INVALIDA"] as const;
export type StatusAgendamento = (typeof STATUS_AGENDAMENTO)[number];

export const DURACAO_PADRAO_MIN = 60;
const MINUTO = 60_000;
const LIMITE_FUTURO_MS = 2 * 365 * 24 * 60 * MINUTO;

export interface Periodo {
  inicio: Date;
  fim: Date;
}

export interface PedidoAgendamento {
  inicio: string | null;
  duracaoMin: number | null;
}

export type Decisao =
  | { status: "CRIADO"; periodo: Periodo }
  | { status: "CONFLITO"; periodo: Periodo; sugestao: Date }
  | { status: "SEM_HORARIO" }
  | { status: "DATA_INVALIDA" };

const seSobrepoem = (a: Periodo, b: Periodo) => a.inicio < b.fim && b.inicio < a.fim;

/** Primeiro horário a partir do pedido em que a duração cabe sem sobrepor nada. */
export function proximoHorarioLivre(pedido: Periodo, ocupados: Periodo[]): Date {
  const duracao = pedido.fim.getTime() - pedido.inicio.getTime();
  const ordenados = [...ocupados].sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
  let inicio = pedido.inicio;
  for (const ocupado of ordenados) {
    if (seSobrepoem({ inicio, fim: new Date(inicio.getTime() + duracao) }, ocupado)) inicio = ocupado.fim;
  }
  return inicio;
}

function periodoDoPedido({ inicio, duracaoMin }: PedidoAgendamento): Periodo | null {
  if (!inicio) return null;
  const data = new Date(inicio);
  if (Number.isNaN(data.getTime())) return null;
  const minutos = duracaoMin && duracaoMin > 0 && duracaoMin <= 24 * 60 ? duracaoMin : DURACAO_PADRAO_MIN;
  return { inicio: data, fim: new Date(data.getTime() + minutos * MINUTO) };
}

export function periodoSolicitado(pedido: PedidoAgendamento): Periodo | null {
  return periodoDoPedido(pedido);
}

/**
 * Decide o que fazer com um agendamento extraído da conversa: cria na agenda, ou
 * registra o motivo de não criar. Nunca sobrepõe um compromisso existente (RN011).
 */
export function decidirAgendamento(pedido: PedidoAgendamento, ocupados: Periodo[], agora: Date): Decisao {
  if (!pedido.inicio) return { status: "SEM_HORARIO" };
  const periodo = periodoDoPedido(pedido);
  if (!periodo) return { status: "DATA_INVALIDA" };

  const distancia = periodo.inicio.getTime() - agora.getTime();
  if (distancia <= 0 || distancia > LIMITE_FUTURO_MS) return { status: "DATA_INVALIDA" };

  if (ocupados.some((o) => seSobrepoem(periodo, o))) {
    return { status: "CONFLITO", periodo, sugestao: proximoHorarioLivre(periodo, ocupados) };
  }
  return { status: "CRIADO", periodo };
}
