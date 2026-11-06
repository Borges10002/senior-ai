/**
 * Regras das vendas do plano Pro: o que conta como venda, quem recebe a
 * receita e os números do painel do administrador. Funções puras.
 */
import type { CicloAssinatura, StatusAssinatura } from "./plano";

export type StatusVenda = "paga" | "estornada";

export const EVENTOS_PAGO = ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"];
export const EVENTOS_ESTORNO = [
  "PAYMENT_REFUNDED",
  "PAYMENT_CHARGEBACK_REQUESTED",
  "PAYMENT_CHARGEBACK_DISPUTE",
];
/** Status de cobrança do gateway que significam dinheiro recebido. */
export const STATUS_PAGO = ["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"];
export const STATUS_ESTORNO = ["REFUNDED", "CHARGEBACK_REQUESTED", "CHARGEBACK_DISPUTE"];

/** Cobrança como o gateway (Asaas) informa, no webhook ou na consulta. */
export interface PagamentoGateway {
  id?: string;
  subscription?: string;
  status?: string;
  value?: number | string;
  netValue?: number | string;
  billingType?: string;
  dueDate?: string;
  paymentDate?: string | null;
  confirmedDate?: string | null;
  clientPaymentDate?: string | null;
}

export interface DadosVenda {
  id: string;
  gateway_assinatura_id: string | null;
  valor: number;
  valor_liquido: number | null;
  forma_pagamento: string | null;
  vencimento: string | null;
  pago_em: Date;
}

const numero = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** Venda a partir da cobrança paga; null quando faltam id ou valor. */
export function vendaDoPagamento(p: PagamentoGateway, agora = new Date()): DadosVenda | null {
  const valor = numero(p.value);
  if (!p.id || valor === null || valor <= 0) return null;
  const dataPaga = p.paymentDate ?? p.confirmedDate ?? p.clientPaymentDate ?? p.dueDate;
  // Datas do Asaas vêm como YYYY-MM-DD; meio-dia evita virar o dia no fuso.
  const pago_em = dataPaga ? new Date(`${String(dataPaga).slice(0, 10)}T12:00:00-03:00`) : agora;
  return {
    id: String(p.id),
    gateway_assinatura_id: p.subscription ? String(p.subscription) : null,
    valor,
    valor_liquido: numero(p.netValue),
    forma_pagamento: p.billingType && p.billingType !== "UNDEFINED" ? p.billingType : null,
    vencimento: p.dueDate ? String(p.dueDate).slice(0, 10) : null,
    pago_em: Number.isNaN(pago_em.getTime()) ? agora : pago_em,
  };
}

/** Quanto entrou de fato: o líquido do gateway, ou o bruto se ele não informou. */
export const valorRecebido = (v: { valor: number | string; valor_liquido: number | string | null }) =>
  Number(v.valor_liquido ?? v.valor);

interface UsuarioBasico {
  codigo?: number;
  ativo?: string;
  nivelacesso: number;
}

/**
 * Quem recebe as vendas como receita: VENDAS_CODUSUARIO, se definido;
 * senão o administrador ativo mais antigo (menor código).
 */
export function recebedorDasVendas<U extends UsuarioBasico>(
  usuarios: U[],
  ehAdmin: (nivel: unknown) => boolean,
  configurado = process.env.VENDAS_CODUSUARIO,
): U | null {
  const codigo = Number(configurado);
  if (configurado && Number.isFinite(codigo)) {
    return usuarios.find((u) => Number(u.codigo) === codigo) ?? null;
  }
  return (
    usuarios
      .filter((u) => u.ativo !== "N" && ehAdmin(u.nivelacesso))
      .sort((a, b) => Number(a.codigo) - Number(b.codigo))[0] ?? null
  );
}

export interface VendaPainel {
  id: string;
  codusuario: number | string;
  ciclo: CicloAssinatura | null;
  valor: number | string;
  valor_liquido: number | string | null;
  forma_pagamento: string | null;
  status: StatusVenda;
  pago_em: Date | string;
}

export interface AssinaturaPainel {
  status: StatusAssinatura;
  ciclo: CicloAssinatura | null;
  valor: number | string | null;
  cancelada_em?: Date | string | null;
}

export interface ResumoVendas {
  receitaMes: number;
  receitaMesAnterior: number;
  vendasMes: number;
  receitaTotal: number;
  liquidoTotal: number;
  taxasTotal: number;
  vendasTotal: number;
  ticketMedio: number;
  /** Receita recorrente mensal das assinaturas ativas (anual / 12). */
  mrr: number;
  assinantes: Record<StatusAssinatura, number>;
  estornos: number;
  porMes: { mes: string; bruto: number; liquido: number; vendas: number }[];
  porCiclo: { ciclo: CicloAssinatura; vendas: number; valor: number }[];
  porForma: { forma: string; vendas: number; valor: number }[];
}

const mesDe = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" })
    .format(d)
    .slice(0, 7);

function ultimosMeses(hoje: Date, quantos: number): string[] {
  const [ano, mes] = mesDe(hoje).split("-").map(Number);
  return Array.from({ length: quantos }, (_, i) => {
    const d = new Date(Date.UTC(ano, mes - 1 - (quantos - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

const centavos = (n: number) => Math.round(n * 100) / 100;

/** Números do painel de vendas: só vendas pagas entram nas somas. */
export function resumirVendas(
  vendas: VendaPainel[],
  assinaturas: AssinaturaPainel[],
  hoje = new Date(),
  meses = 12,
): ResumoVendas {
  const pagas = vendas.filter((v) => v.status === "paga");
  const meses12 = ultimosMeses(hoje, meses);
  const mesAtual = meses12[meses12.length - 1];
  const mesAnterior = meses12[meses12.length - 2];

  const porMes = new Map(meses12.map((m) => [m, { mes: m, bruto: 0, liquido: 0, vendas: 0 }]));
  const porCiclo = new Map<CicloAssinatura, { ciclo: CicloAssinatura; vendas: number; valor: number }>();
  const porForma = new Map<string, { forma: string; vendas: number; valor: number }>();
  let receitaTotal = 0;
  let liquidoTotal = 0;

  for (const v of pagas) {
    const bruto = Number(v.valor);
    const liquido = valorRecebido(v);
    receitaTotal += bruto;
    liquidoTotal += liquido;
    const linha = porMes.get(mesDe(new Date(v.pago_em)));
    if (linha) {
      linha.bruto += bruto;
      linha.liquido += liquido;
      linha.vendas += 1;
    }
    const ciclo = v.ciclo ?? "MONTHLY";
    const c = porCiclo.get(ciclo) ?? { ciclo, vendas: 0, valor: 0 };
    c.vendas += 1;
    c.valor += bruto;
    porCiclo.set(ciclo, c);
    const forma = v.forma_pagamento ?? "OUTROS";
    const f = porForma.get(forma) ?? { forma, vendas: 0, valor: 0 };
    f.vendas += 1;
    f.valor += bruto;
    porForma.set(forma, f);
  }

  const assinantes: Record<StatusAssinatura, number> = { trial: 0, ativa: 0, inadimplente: 0, cancelada: 0 };
  let mrr = 0;
  for (const a of assinaturas) {
    assinantes[a.status] = (assinantes[a.status] ?? 0) + 1;
    if (a.status === "ativa" && a.valor != null) {
      mrr += a.ciclo === "YEARLY" ? Number(a.valor) / 12 : Number(a.valor);
    }
  }

  const linhas = [...porMes.values()].map((l) => ({
    ...l,
    bruto: centavos(l.bruto),
    liquido: centavos(l.liquido),
  }));
  const doMes = (m: string) => linhas.find((l) => l.mes === m);
  return {
    receitaMes: doMes(mesAtual)?.liquido ?? 0,
    receitaMesAnterior: doMes(mesAnterior)?.liquido ?? 0,
    vendasMes: doMes(mesAtual)?.vendas ?? 0,
    receitaTotal: centavos(receitaTotal),
    liquidoTotal: centavos(liquidoTotal),
    taxasTotal: centavos(receitaTotal - liquidoTotal),
    vendasTotal: pagas.length,
    ticketMedio: pagas.length ? centavos(receitaTotal / pagas.length) : 0,
    mrr: centavos(mrr),
    assinantes,
    estornos: vendas.length - pagas.length,
    porMes: linhas,
    porCiclo: [...porCiclo.values()].map((c) => ({ ...c, valor: centavos(c.valor) })),
    porForma: [...porForma.values()]
      .map((f) => ({ ...f, valor: centavos(f.valor) }))
      .sort((a, b) => b.valor - a.valor),
  };
}
