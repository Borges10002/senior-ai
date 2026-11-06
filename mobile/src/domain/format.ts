
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

/** Converte texto digitado ("1.234,56", "25.000", "12,5", "10") em número. */
export function parseMoeda(texto: string): number {
  const limpo = texto.replace(/[^\d,.-]/g, "");
  if (!limpo) return 0;
  // Sem vírgula, ponto seguido de grupos de 3 dígitos é milhar ("25.000"); senão é decimal ("6.5").
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : /^-?\d{1,3}(\.\d{3})+$/.test(limpo)
      ? limpo.replace(/\./g, "")
      : limpo;
  const valor = Number(normalizado);
  return Number.isFinite(valor) ? valor : 0;
}

/**
 * Formata enquanto a pessoa digita, no padrão brasileiro: pontos de milhar
 * entram sozinhos e a vírgula separa os centavos (até 2 casas). Um ponto
 * digitado no fim vira vírgula, para teclados que só têm ponto.
 */
export function formatarDigitacaoMoeda(texto: string, permitirNegativo = false): string {
  const negativo = permitirNegativo && texto.trim().startsWith("-");
  let t = texto.replace(/[^\d.,]/g, "");
  if (t.endsWith(".") && !t.slice(0, -1).includes(",")) t = `${t.slice(0, -1)},`;
  const [inteiroBruto = "", ...resto] = t.split(",");
  const inteiro = inteiroBruto.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  const comPontos = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sinal = negativo ? "-" : "";
  if (!t.includes(",")) return `${sinal}${comPontos}`;
  return `${sinal}${comPontos || "0"},${resto.join("").replace(/\D/g, "").slice(0, 2)}`;
}

/** Valor para mostrar num campo de digitação ("1.234,56"); vazio para nulo. */
export function formatarCampoMoeda(valor: number | null | undefined): string {
  if (valor == null || !Number.isFinite(valor)) return "";
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
