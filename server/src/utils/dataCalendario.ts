import { z } from "zod";

/**
 * Data de calendário ("YYYY-MM-DD") para colunas `date`.
 *
 * `z.coerce.date()` transformava "2026-10-26" em meia-noite UTC e o TypeORM
 * gravava o dia pelo fuso do servidor: em UTC-3/-4 a data recuava um dia.
 * Mantendo o texto, a data gravada é sempre a que o usuário escolheu.
 */
const ISO = /^(\d{4})-(\d{2})-(\d{2})/;

export const dataCalendario = z
  .union([z.string(), z.date()])
  .transform((valor, ctx) => {
    const texto = valor instanceof Date ? valor.toISOString() : valor.trim();
    const partes = ISO.exec(texto);
    if (!partes) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data inválida, use AAAA-MM-DD" });
      return z.NEVER;
    }
    const [, ano, mes, dia] = partes.map(Number);
    const data = new Date(Date.UTC(ano!, mes! - 1, dia!));
    if (data.getUTCMonth() !== mes! - 1 || data.getUTCDate() !== dia) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data inválida" });
      return z.NEVER;
    }
    // O TypeORM grava strings em colunas `date` sem conversão de fuso.
    return texto.slice(0, 10) as unknown as Date;
  });

export const dataCalendarioOpcional = z.union([dataCalendario, z.null()]).optional();

const mesDe = (valor: unknown): string | null => {
  if (!valor) return null;
  const texto = valor instanceof Date ? valor.toISOString() : String(valor);
  return /^\d{4}-\d{2}/.test(texto) ? texto.slice(0, 7) : null;
};

/**
 * Competência gravada como o dia 1 do mês de referência. Devolve nulo quando
 * coincide com o mês do vencimento (o padrão), para não guardar redundância.
 */
export function normalizarCompetencia(competencia: unknown, vencimento: unknown): Date | null {
  const mes = mesDe(competencia);
  if (!mes || mes === mesDe(vencimento)) return null;
  return `${mes}-01` as unknown as Date;
}

/** Hoje ("YYYY-MM-DD") no fuso do app (APP_TIMEZONE, padrão America/Sao_Paulo). */
export function hojeNoFuso(agora: Date = new Date()): string {
  const fuso = process.env.APP_TIMEZONE || "America/Sao_Paulo";
  return agora.toLocaleDateString("en-CA", { timeZone: fuso });
}

/**
 * Soma meses a uma data "YYYY-MM-DD" preservando o dia (limitado ao último
 * dia do mês). `diaBase` mantém o dia original da série: 31/01 -> 28/02 -> 31/03.
 */
export function somarMeses(iso: string, meses: number, diaBase?: number): string {
  const [ano, mes, dia] = String(iso).slice(0, 10).split("-").map(Number);
  const total = ano! * 12 + (mes! - 1) + meses;
  const novoAno = Math.floor(total / 12);
  const novoMes = (total % 12) + 1;
  const ultimoDia = new Date(Date.UTC(novoAno, novoMes, 0)).getUTCDate();
  const novoDia = Math.min(diaBase ?? dia!, ultimoDia);
  return `${novoAno}-${String(novoMes).padStart(2, "0")}-${String(novoDia).padStart(2, "0")}`;
}
