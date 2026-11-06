/**
 * Regras do plano Senior AI Pro: teste grátis, cobrança recorrente e o que
 * acontece quando o pagamento não chega. Funções puras, testadas sem banco.
 */

export type StatusAssinatura = "trial" | "ativa" | "inadimplente" | "cancelada";
export type CicloAssinatura = "MONTHLY" | "YEARLY";
export type NivelAcesso = "completo" | "leitura";

export const STATUS_ASSINATURA: StatusAssinatura[] = ["trial", "ativa", "inadimplente", "cancelada"];
export const CICLOS: CicloAssinatura[] = ["MONTHLY", "YEARLY"];

const numeroEnv = (nome: string, padrao: number) => {
  const valor = Number(process.env[nome]);
  return Number.isFinite(valor) && valor > 0 ? valor : padrao;
};

/** Preços e prazos vêm do ambiente para ajustar sem novo deploy de código. */
export function configPlano() {
  return {
    nome: "Senior AI Pro",
    trialDias: numeroEnv("TRIAL_DIAS", 14),
    /** Dias extras de acesso depois do vencimento, enquanto o Pix/boleto compensa. */
    carenciaDias: numeroEnv("CARENCIA_DIAS", 3),
    precos: {
      MONTHLY: numeroEnv("PLANO_PRO_MENSAL", 19.9),
      YEARLY: numeroEnv("PLANO_PRO_ANUAL", 199),
    } as Record<CicloAssinatura, number>,
  };
}

/** Planos podem ser desligados (instalação própria, testes locais). */
export const planosAtivos = () => process.env.PLANOS_ATIVOS !== "false";

export interface EstadoAssinatura {
  status: StatusAssinatura;
  trial_fim: Date | string;
  /** Até quando o último pagamento confirmado cobre. */
  periodo_fim: Date | string | null;
}

export interface SituacaoAcesso {
  acesso: NivelAcesso;
  status: StatusAssinatura;
  /** Dias de teste restantes (0 quando não está em teste). */
  diasTrial: number;
  /** Data até a qual o acesso completo está garantido, quando conhecida. */
  acessoAte: string | null;
  mensagem: string;
}

const DIA = 24 * 60 * 60 * 1000;
const iso = (d: Date) => d.toISOString();

export function somarDias(data: Date, dias: number): Date {
  return new Date(data.getTime() + dias * DIA);
}

/** Fim do período pago por uma cobrança que vence em `vencimento`. */
export function fimDoPeriodo(vencimento: string, ciclo: CicloAssinatura): Date {
  const [ano, mes, dia] = vencimento.slice(0, 10).split("-").map(Number);
  const meses = ciclo === "YEARLY" ? 12 : 1;
  const alvo = new Date(Date.UTC(ano!, mes! - 1 + meses, 1));
  const ultimoDia = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  alvo.setUTCDate(Math.min(dia!, ultimoDia));
  // Fim do dia no horário de Brasília (03:00 UTC do dia seguinte).
  return new Date(alvo.getTime() + DIA + 3 * 60 * 60 * 1000 - 1);
}

/**
 * Decide o acesso: completo durante o teste e enquanto houver período pago
 * (mais a carência); depois disso, só leitura até assinar.
 */
export function situacaoAcesso(a: EstadoAssinatura, agora = new Date()): SituacaoAcesso {
  const { carenciaDias } = configPlano();
  const trialFim = new Date(a.trial_fim);
  const periodoFim = a.periodo_fim ? new Date(a.periodo_fim) : null;

  const emTrial = agora < trialFim;
  const diasTrial = emTrial ? Math.ceil((trialFim.getTime() - agora.getTime()) / DIA) : 0;

  // O que já foi pago vale até o fim, mesmo cancelado ou atrasado.
  const limitePago = periodoFim
    ? somarDias(periodoFim, a.status === "cancelada" ? 0 : carenciaDias)
    : null;
  const pagoEmDia = Boolean(limitePago && agora <= limitePago);

  const base = { status: a.status, diasTrial };

  if (pagoEmDia) {
    return {
      ...base,
      acesso: "completo",
      acessoAte: iso(periodoFim!),
      mensagem:
        a.status === "cancelada"
          ? "Assinatura cancelada. O acesso continua até o fim do período pago."
          : a.status === "inadimplente"
            ? "Pagamento em atraso. Regularize para não perder o acesso."
            : "Assinatura ativa.",
    };
  }

  if (emTrial && a.status !== "inadimplente") {
    return {
      ...base,
      acesso: "completo",
      acessoAte: iso(trialFim),
      // Assinou durante o teste: os dias grátis continuam e a 1ª cobrança vence no fim deles.
      mensagem:
        a.status === "ativa"
          ? `Assinatura confirmada! Você ainda tem ${diasTrial} dia(s) grátis; a 1ª cobrança vence em ${trialFim.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`
          : `Teste grátis: ${diasTrial} dia(s) restante(s).`,
    };
  }

  // Assinou e a 1ª cobrança (no fim do teste) ainda está compensando.
  if (a.status === "ativa" && !periodoFim && agora <= somarDias(trialFim, carenciaDias)) {
    return {
      ...base,
      acesso: "completo",
      acessoAte: iso(somarDias(trialFim, carenciaDias)),
      mensagem: "Aguardando a confirmação do primeiro pagamento.",
    };
  }

  return {
    ...base,
    acesso: "leitura",
    acessoAte: null,
    mensagem:
      a.status === "inadimplente"
        ? "Pagamento não identificado. Seus dados estão salvos, mas só para consulta até regularizar."
        : a.status === "cancelada"
          ? "Assinatura encerrada. Assine novamente para voltar a lançar."
          : "Seu teste grátis terminou. Assine o Pro para continuar lançando; seus dados seguem disponíveis para consulta.",
  };
}

/** CPF (11) ou CNPJ (14) só com dígitos, exigido pelo gateway. */
export function documentoValido(valor: string | null | undefined): string | null {
  const digitos = String(valor ?? "").replace(/\D/g, "");
  if (digitos.length !== 11 && digitos.length !== 14) return null;
  if (/^(\d)\1+$/.test(digitos)) return null;
  return digitos;
}
