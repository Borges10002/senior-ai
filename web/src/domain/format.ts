// Mantido igual a mobile/src/domain/format.ts — altere os dois juntos.

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function formatarMoeda(valor: number): string {
  return moeda.format(Number.isFinite(valor) ? valor : 0);
}

export function nomeMes(mes: number): string {
  return MESES[mes - 1] ?? "";
}

export function nomeMesCurto(mes: number): string {
  return nomeMes(mes).slice(0, 3);
}

/** Date -> "YYYY-MM-DD" no fuso local. */
export function toISODate(data: Date): string {
  const y = data.getFullYear();
  const m = String(data.getMonth() + 1).padStart(2, "0");
  const d = String(data.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "YYYY-MM-DD" (ou ISO completo) -> Date local, sem deslocamento de fuso. */
export function fromISODate(iso: string): Date {
  const [y = 1970, m = 1, d = 1] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatarData(iso: string): string {
  const data = fromISODate(iso);
  return data.toLocaleDateString("pt-BR");
}

/** Rótulo amigável para cabeçalhos de lista: "Hoje", "Ontem" ou "Seg, 12 out". */
export function formatarDiaRelativo(iso: string): string {
  const data = fromISODate(iso);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diff = Math.round((hoje.getTime() - data.getTime()) / 86_400_000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  if (diff === -1) return "Amanhã";
  return data.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}
