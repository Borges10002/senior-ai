<template>
  <q-page class="mf-page">
    <header class="mf-page-header">
      <div>
        <h1 class="mf-title">Vendas do plano Pro</h1>
        <p class="mf-subtitle">O que entrou de assinaturas, quem comprou e como está a base de assinantes.</p>
      </div>
      <div class="row q-gutter-sm">
        <q-btn flat no-caps icon="refresh" label="Atualizar" :loading="carregando" @click="carregar(false)" />
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="cloud_sync"
          label="Buscar no Asaas"
          :disable="painel ? !painel.gatewayConfigurado : false"
          :loading="sincronizando"
          @click="carregar(true)"
        >
          <q-tooltip>Confere as cobranças pagas direto no gateway, caso algum aviso não tenha chegado.</q-tooltip>
        </q-btn>
      </div>
    </header>

    <q-linear-progress v-if="carregando && !painel" indeterminate color="primary" />

    <template v-if="painel">

      <section class="kpis">
        <article v-for="k in kpis" :key="k.titulo" class="mf-card kpi">
          <div class="kpi__icone" :style="{ background: k.fundo, color: k.cor }">
            <q-icon :name="k.icone" />
          </div>
          <div>
            <div class="mf-muted">{{ k.titulo }}</div>
            <div class="kpi__valor">{{ k.valor }}</div>
            <div class="mf-muted kpi__detalhe" :class="k.classeDetalhe">{{ k.detalhe }}</div>
          </div>
        </article>
      </section>

      <section class="graficos graficos--largo">
        <article class="mf-card">
          <div class="q-mb-sm">
            <h2 class="mf-section-title">Receita dos últimos 12 meses</h2>
            <span class="mf-muted">Valor cobrado e o que sobrou depois das taxas do gateway</span>
          </div>
          <Grafico type="area" :height="300" :series="serieMeses" :options="opcoesMeses" />
        </article>

        <article class="mf-card">
          <div class="q-mb-sm">
            <h2 class="mf-section-title">Vendas por mês</h2>
            <span class="mf-muted">Quantidade de cobranças pagas</span>
          </div>
          <Grafico type="bar" :height="300" :series="serieQuantidade" :options="opcoesQuantidade" />
        </article>
      </section>

      <section class="graficos">
        <article class="mf-card">
          <h2 class="mf-section-title q-mb-sm">Assinantes por situação</h2>
          <Grafico type="bar" :height="260" :series="serieAssinantes" :options="opcoesAssinantes" />
        </article>

        <article class="mf-card">
          <h2 class="mf-section-title q-mb-sm">Forma de pagamento</h2>
          <div v-if="!painel.resumo.porForma.length" class="mf-empty">
            <q-icon name="payments" size="28px" />
            <strong>Nenhuma venda ainda</strong>
          </div>
          <Grafico
            v-else
            type="donut"
            :height="260"
            :series="painel.resumo.porForma.map((f) => f.valor)"
            :options="rosca(painel.resumo.porForma.map((f) => nomeForma(f.forma)), ['#0e9f6e', '#2457f5', '#d98e04', '#8b5cf6'])"
          />
        </article>

        <article class="mf-card">
          <h2 class="mf-section-title q-mb-sm">Plano escolhido</h2>
          <div v-if="!painel.resumo.porCiclo.length" class="mf-empty">
            <q-icon name="event_repeat" size="28px" />
            <strong>Nenhuma venda ainda</strong>
          </div>
          <Grafico
            v-else
            type="donut"
            :height="260"
            :series="painel.resumo.porCiclo.map((c) => c.valor)"
            :options="rosca(painel.resumo.porCiclo.map((c) => NOME_CICLO[c.ciclo]), ['#2457f5', '#0e9f6e'])"
          />
        </article>
      </section>

      <article class="mf-card">
        <div class="mf-page-header q-mb-sm">
          <div>
            <h2 class="mf-section-title">Vendas recentes</h2>
            <span class="mf-muted">{{ painel.resumo.vendasTotal }} paga(s) · {{ painel.resumo.estornos }} estornada(s)</span>
          </div>
        </div>
        <q-table
          flat
          :rows="painel.vendas"
          :columns="colunas"
          row-key="id"
          :pagination="{ rowsPerPage: 10 }"
          no-data-label="Nenhuma venda registrada ainda. Quando um assinante pagar, ela aparece aqui."
        >
          <template #body-cell-comprador="props">
            <q-td :props="props">
              <div class="text-weight-bold">{{ props.row.comprador.nome }}</div>
              <div class="mf-muted">{{ props.row.comprador.email }}</div>
            </q-td>
          </template>
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-chip
                dense
                square
                :color="props.row.status === 'paga' ? 'positive' : 'negative'"
                text-color="white"
                :label="props.row.status === 'paga' ? 'Paga' : 'Estornada'"
              />
            </q-td>
          </template>
          <template #body-cell-receita="props">
            <q-td :props="props">
              <q-icon
                :name="props.row.receitaLancada ? 'check_circle' : 'remove_circle_outline'"
                :color="props.row.receitaLancada ? 'positive' : 'grey-5'"
                size="20px"
              >
                <q-tooltip>{{ props.row.receitaLancada ? "Receita lançada no planejamento" : "Sem receita lançada" }}</q-tooltip>
              </q-icon>
            </q-td>
          </template>
        </q-table>
      </article>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import type { ApexOptions } from "apexcharts";
import type { QTableColumn } from "quasar";
import { computed, onMounted, ref } from "vue";

import Grafico from "src/components/Grafico.vue";
import { extractApiErrorMessage } from "src/boot/axios";
import { useNotify } from "src/composables/UseNotify";
import { formatarMoeda } from "src/domain/format";
import { adminService, type PainelVendas, type VendaAdmin } from "src/services/adminService";

const { notifyErrorWait } = useNotify();
const painel = ref<PainelVendas | null>(null);
const carregando = ref(false);
const sincronizando = ref(false);

const NOME_CICLO = { MONTHLY: "Mensal", YEARLY: "Anual" } as const;
const NOME_FORMA: Record<string, string> = {
  PIX: "Pix",
  BOLETO: "Boleto",
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
  OUTROS: "Outros",
};
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const nomeForma = (forma: string) => NOME_FORMA[forma] ?? forma;
const rotuloMes = (mes: string) => {
  const [ano, m] = mes.split("-");
  return `${MESES[Number(m) - 1]}/${ano.slice(2)}`;
};
const dataCurta = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

const kpis = computed(() => {
  const r = painel.value?.resumo;
  if (!r) return [];
  const variacao = r.receitaMesAnterior
    ? Math.round(((r.receitaMes - r.receitaMesAnterior) / r.receitaMesAnterior) * 100)
    : null;
  return [
    {
      titulo: "Receita do mês",
      valor: formatarMoeda(r.receitaMes),
      detalhe:
        variacao === null
          ? `${r.vendasMes} venda(s) neste mês`
          : `${variacao >= 0 ? "▲" : "▼"} ${Math.abs(variacao)}% sobre o mês anterior`,
      classeDetalhe: variacao === null ? "" : variacao >= 0 ? "mf-income" : "mf-expense",
      icone: "trending_up",
      cor: "#0e9f6e",
      fundo: "var(--mf-income-soft)",
    },
    {
      titulo: "Receita recorrente (MRR)",
      valor: formatarMoeda(r.mrr),
      detalhe: "por mês, com as assinaturas ativas",
      icone: "autorenew",
      cor: "#2457f5",
      fundo: "var(--mf-primary-soft)",
    },
    {
      titulo: "Assinantes ativos",
      valor: r.assinantes.ativa,
      detalhe: `${r.assinantes.trial} em teste grátis · ${r.assinantes.inadimplente} com pagamento atrasado`,
      icone: "workspace_premium",
      cor: "#8b5cf6",
      fundo: "#efe8ff",
    },
    {
      titulo: "Total recebido",
      valor: formatarMoeda(r.liquidoTotal),
      detalhe: `${formatarMoeda(r.receitaTotal)} cobrados · ${formatarMoeda(r.taxasTotal)} em taxas`,
      icone: "account_balance_wallet",
      cor: "#d98e04",
      fundo: "var(--mf-warning-soft)",
    },
    {
      titulo: "Ticket médio",
      valor: formatarMoeda(r.ticketMedio),
      detalhe: `${r.vendasTotal} venda(s) no total`,
      icone: "sell",
      cor: "#06b6d4",
      fundo: "#dff7fb",
    },
  ];
});

const meses = computed(() => painel.value?.resumo.porMes ?? []);

const serieMeses = computed(() => [
  { name: "Cobrado", data: meses.value.map((m) => m.bruto) },
  { name: "Recebido", data: meses.value.map((m) => m.liquido) },
]);
const opcoesMeses = computed<ApexOptions>(() => ({
  colors: ["#2457f5", "#0e9f6e"],
  xaxis: { categories: meses.value.map((m) => rotuloMes(m.mes)) },
  fill: { type: "gradient", gradient: { opacityFrom: 0.35, opacityTo: 0.02 } },
  stroke: { width: 3 },
}));

const serieQuantidade = computed(() => [{ name: "Vendas", data: meses.value.map((m) => m.vendas) }]);
const opcoesQuantidade = computed<ApexOptions>(() => ({
  colors: ["#8b5cf6"],
  xaxis: { categories: meses.value.map((m) => rotuloMes(m.mes)) },
  plotOptions: { bar: { borderRadius: 6, columnWidth: "55%" } },
  yaxis: { labels: { formatter: (v: number) => String(Math.round(v)) } },
  tooltip: { y: { formatter: (v: number) => `${v} venda(s)` } },
}));

const SITUACOES = [
  { chave: "trial", nome: "Teste grátis", cor: "#2457f5" },
  { chave: "ativa", nome: "Ativa", cor: "#0e9f6e" },
  { chave: "inadimplente", nome: "Atrasada", cor: "#d98e04" },
  { chave: "cancelada", nome: "Cancelada", cor: "#e5484d" },
] as const;
const serieAssinantes = computed(() => [
  { name: "Assinantes", data: SITUACOES.map((s) => painel.value?.resumo.assinantes[s.chave] ?? 0) },
]);
const opcoesAssinantes: ApexOptions = {
  colors: SITUACOES.map((s) => s.cor),
  // Em barra horizontal o eixo x é o dos valores: só números inteiros.
  xaxis: {
    categories: SITUACOES.map((s) => s.nome),
    labels: { formatter: (v: string) => (Number.isInteger(Number(v)) ? v : "") },
  },
  plotOptions: { bar: { horizontal: true, borderRadius: 6, distributed: true, barHeight: "60%" } },
  legend: { show: false },
  dataLabels: { enabled: true },
  yaxis: { labels: { formatter: (v: number | string) => String(v) } },
  tooltip: { y: { formatter: (v: number) => `${v} assinante(s)` } },
};

function rosca(rotulos: string[], cores: string[]): ApexOptions {
  return {
    labels: rotulos,
    colors: cores,
    stroke: { width: 2, colors: ["#fff"] },
    plotOptions: {
      pie: {
        donut: {
          size: "66%",
          labels: {
            show: true,
            value: { formatter: (v: string) => formatarMoeda(Number(v)) },
            total: {
              show: true,
              label: "Total",
              formatter: (w: { globals: { seriesTotals: number[] } }) =>
                formatarMoeda(w.globals.seriesTotals.reduce((a, b) => a + b, 0)),
            },
          },
        },
      },
    },
  };
}

const colunas: QTableColumn<VendaAdmin>[] = [
  { name: "data", label: "Pago em", field: (v) => v.pago_em, format: dataCurta, align: "left", sortable: true },
  { name: "comprador", label: "Comprador", field: (v) => v.comprador.nome, align: "left" },
  { name: "plano", label: "Plano", field: (v) => (v.ciclo ? NOME_CICLO[v.ciclo] : "—"), align: "left" },
  { name: "forma", label: "Pagamento", field: (v) => nomeForma(v.forma_pagamento ?? "OUTROS"), align: "left" },
  { name: "valor", label: "Cobrado", field: (v) => v.valor, format: formatarMoeda, align: "right", sortable: true },
  {
    name: "liquido",
    label: "Recebido",
    field: (v) => v.valor_liquido ?? v.valor,
    format: formatarMoeda,
    align: "right",
  },
  { name: "status", label: "Situação", field: (v) => v.status, align: "center" },
  { name: "receita", label: "No planejamento", field: (v) => v.receitaLancada, align: "center" },
];

async function carregar(consultarGateway: boolean) {
  const indicador = consultarGateway ? sincronizando : carregando;
  indicador.value = true;
  try {
    painel.value = consultarGateway ? await adminService.sincronizarVendas() : await adminService.vendas();
  } catch (e) {
    notifyErrorWait(extractApiErrorMessage(e));
  } finally {
    indicador.value = false;
  }
}

onMounted(() => carregar(false));
</script>

<style scoped>
.aviso {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-radius: var(--mf-radius);
  font-size: 0.92rem;
}

.aviso--ok {
  background: var(--mf-primary-soft);
  color: #1638b8;
}

.aviso--alerta {
  background: var(--mf-warning-soft);
  color: #8a5a00;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 16px;
}

.kpi {
  display: flex;
  align-items: center;
  gap: 14px;
}

.kpi__icone {
  flex: none;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 24px;
}

.kpi__valor {
  font-size: 1.55rem;
  font-weight: 800;
  line-height: 1.2;
}

.kpi__detalhe {
  font-size: 0.8rem;
}

.graficos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.graficos--largo {
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
}

@media (max-width: 600px) {
  .graficos--largo {
    grid-template-columns: 1fr;
  }
}
</style>
