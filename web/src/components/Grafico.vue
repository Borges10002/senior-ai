<template>
  <VueApexCharts :type="type" :height="height ?? 300" :series="series" :options="opcoes" />
</template>

<script setup lang="ts">
import type { ApexOptions } from "apexcharts";
import { computed } from "vue";
import VueApexCharts from "vue3-apexcharts";

import { formatarMoeda } from "src/domain/format";

type TipoGrafico = NonNullable<NonNullable<ApexOptions["chart"]>["type"]>;

const props = withDefaults(
  defineProps<{
    type: TipoGrafico;
    series: NonNullable<ApexOptions["series"]>;
    options?: ApexOptions;
    height?: number | string;
  }>(),
  { options: () => ({}), height: 300 },
);

// Tema comum a todos os gráficos do painel: fonte, cores e valores em reais.
const base: ApexOptions = {
  chart: {
    fontFamily: "Inter, Segoe UI, Roboto, sans-serif",
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: true, speed: 500 },
    foreColor: "#5b6b82",
  },
  colors: ["#0e9f6e", "#e5484d", "#2457f5", "#d98e04", "#8b5cf6", "#06b6d4", "#f97316", "#64748b"],
  dataLabels: { enabled: false },
  grid: { borderColor: "rgba(148, 163, 184, 0.25)", strokeDashArray: 4, padding: { left: 6, right: 6 } },
  legend: { position: "bottom", fontWeight: 600, markers: { shape: "circle", size: 5 }, itemMargin: { horizontal: 10 } },
  stroke: { curve: "smooth" },
  // Colunas finas e arredondadas: com poucos itens não viram blocos gigantes.
  plotOptions: { bar: { borderRadius: 6, borderRadiusApplication: "end", columnWidth: "38%", barHeight: "55%" } },
  states: { hover: { filter: { type: "lighten" } } },
  xaxis: { axisBorder: { show: false }, axisTicks: { show: false } },
  tooltip: { y: { formatter: (v: number) => formatarMoeda(v) } },
  yaxis: { labels: { formatter: (v: number) => abreviar(v) } },
  noData: { text: "Sem dados no período" },
};

function abreviar(valor: number) {
  const abs = Math.abs(valor);
  if (abs >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `R$ ${(valor / 1_000).toFixed(1)}k`;
  return `R$ ${Math.round(valor)}`;
}

const ehObjeto = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

/** Mescla objetos de configuração; arrays e funções do segundo substituem os do primeiro. */
function mesclar(a: Record<string, unknown>, b: Record<string, unknown>) {
  const resultado: Record<string, unknown> = { ...a };
  for (const [chave, valor] of Object.entries(b)) {
    const atual = resultado[chave];
    resultado[chave] = ehObjeto(atual) && ehObjeto(valor) ? mesclar(atual, valor) : valor;
  }
  return resultado;
}

const opcoes = computed(
  () => mesclar(base as Record<string, unknown>, props.options as Record<string, unknown>) as ApexOptions,
);
</script>
