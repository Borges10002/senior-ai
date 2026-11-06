<template>
  <q-page class="mf-page">
    <header class="mf-page-header">
      <div>
        <h1 class="mf-title">Painel administrativo</h1>
        <p class="mf-subtitle">Visão geral de usuários, feedbacks e uso do sistema.</p>
      </div>
      <div class="row q-gutter-sm">
        <q-btn flat no-caps icon="refresh" label="Atualizar" :loading="carregando" @click="carregar" />
        <q-btn outline no-caps color="primary" icon="point_of_sale" label="Vendas" to="/app/admin/vendas" />
        <q-btn unelevated no-caps color="primary" icon="group" label="Gerenciar usuários" to="/app/admin/usuarios" />
      </div>
    </header>

    <q-linear-progress v-if="carregando && !resumo" indeterminate color="primary" />

    <template v-if="resumo">
      <section class="kpis">
        <article v-for="k in kpis" :key="k.titulo" class="mf-card kpi">
          <div class="kpi__icone" :style="{ background: k.fundo, color: k.cor }">
            <q-icon :name="k.icone" />
          </div>
          <div>
            <div class="mf-muted">{{ k.titulo }}</div>
            <div class="kpi__valor">{{ k.valor }}</div>
            <div class="mf-muted kpi__detalhe">{{ k.detalhe }}</div>
          </div>
        </article>
      </section>

      <section class="graficos">
        <article class="mf-card">
          <div class="mf-page-header q-mb-sm">
            <div>
              <h2 class="mf-section-title">Usuários por perfil</h2>
              <span class="mf-muted">Quem tem acesso a quê</span>
            </div>
            <q-btn flat dense no-caps color="primary" label="Usuários" to="/app/admin/usuarios" />
          </div>
          <Grafico
            type="donut"
            :height="280"
            :series="resumo.usuarios.porPerfil.map((p) => p.total)"
            :options="rosca(resumo.usuarios.porPerfil.map((p) => p.nome), 'Usuários', ['#64748b', '#d98e04', '#2457f5'])"
          />
        </article>

        <article class="mf-card">
          <div class="mf-page-header q-mb-sm">
            <div>
              <h2 class="mf-section-title">Feedbacks por tipo</h2>
              <span class="mf-muted">Sugestões, erros e dúvidas recebidos</span>
            </div>
            <q-btn flat dense no-caps color="primary" label="Feedbacks" to="/app/admin/feedbacks" />
          </div>
          <div v-if="!resumo.feedbacks.total" class="mf-empty">
            <q-icon name="inbox" size="28px" />
            <strong>Nenhum feedback recebido</strong>
          </div>
          <Grafico
            v-else
            type="donut"
            :height="280"
            :series="tiposFeedback.map((t) => t.total)"
            :options="rosca(tiposFeedback.map((t) => t.nome), 'Feedbacks', ['#0e9f6e', '#e5484d', '#d98e04', '#8b5cf6'])"
          />
        </article>

        <article class="mf-card">
          <h2 class="mf-section-title q-mb-md">Status das contas</h2>
          <div class="status">
            <div class="status__linha">
              <span><q-icon name="check_circle" class="mf-income" /> Ativas</span>
              <strong>{{ resumo.usuarios.ativos }}</strong>
            </div>
            <div class="mf-bar">
              <span :style="{ width: pct(resumo.usuarios.ativos, resumo.usuarios.total) + '%', background: 'var(--mf-income)' }" />
            </div>
            <div class="status__linha">
              <span><q-icon name="block" class="mf-expense" /> Inativas</span>
              <strong>{{ resumo.usuarios.inativos }}</strong>
            </div>
            <div class="mf-bar">
              <span :style="{ width: pct(resumo.usuarios.inativos, resumo.usuarios.total) + '%', background: 'var(--mf-expense)' }" />
            </div>
            <p class="mf-muted q-mt-md q-mb-none">
              Contas inativas não conseguem entrar no sistema. Ative ou desative em
              <router-link to="/app/admin/usuarios">Usuários</router-link>.
            </p>
          </div>
        </article>
      </section>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import type { ApexOptions } from "apexcharts";
import { computed, onMounted, ref } from "vue";

import Grafico from "src/components/Grafico.vue";
import { extractApiErrorMessage } from "src/boot/axios";
import { useNotify } from "src/composables/UseNotify";
import { adminService, type ResumoAdmin } from "src/services/adminService";

const { notifyErrorWait } = useNotify();
const resumo = ref<ResumoAdmin | null>(null);
const carregando = ref(false);

const NOMES_FEEDBACK: Record<string, string> = {
  Sugestao: "Sugestões",
  Erro: "Erros",
  Duvida: "Dúvidas",
};

const pct = (parte: number, total: number) => (total ? Math.round((parte / total) * 100) : 0);

const tiposFeedback = computed(() =>
  Object.entries(resumo.value?.feedbacks.porTipo ?? {}).map(([tipo, total]) => ({
    nome: NOMES_FEEDBACK[tipo] ?? tipo,
    total,
  })),
);

const kpis = computed(() => {
  const r = resumo.value;
  if (!r) return [];
  const admins = r.usuarios.porPerfil.find((p) => p.nivel === 3)?.total ?? 0;
  return [
    {
      titulo: "Usuários",
      valor: r.usuarios.total,
      detalhe: `${r.usuarios.ativos} ativos · ${r.usuarios.inativos} inativos`,
      icone: "group",
      cor: "#2457f5",
      fundo: "var(--mf-primary-soft)",
    },
    {
      titulo: "Administradores",
      valor: admins,
      detalhe: "com acesso a esta área",
      icone: "admin_panel_settings",
      cor: "#8b5cf6",
      fundo: "#efe8ff",
    },
    {
      titulo: "Feedbacks",
      valor: r.feedbacks.total,
      detalhe: `${r.feedbacks.ultimos7Dias} nos últimos 7 dias`,
      icone: "forum",
      cor: "#d98e04",
      fundo: "var(--mf-warning-soft)",
    },
    {
      titulo: "Reuniões",
      valor: r.reunioes.total.toLocaleString("pt-BR"),
      detalhe: "registrados por todos os usuários",
      icone: "groups",
      cor: "#0e9f6e",
      fundo: "var(--mf-income-soft)",
    },
  ];
});

function rosca(rotulos: string[], totalRotulo: string, cores: string[]): ApexOptions {
  return {
    labels: rotulos,
    colors: cores,
    stroke: { width: 2, colors: ["#fff"] },
    tooltip: { y: { formatter: (v: number) => String(v) } },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            value: { formatter: (v: string) => v },
            total: { show: true, label: totalRotulo },
          },
        },
      },
    },
  };
}

async function carregar() {
  carregando.value = true;
  try {
    resumo.value = await adminService.resumo();
  } catch (e) {
    notifyErrorWait(extractApiErrorMessage(e));
  } finally {
    carregando.value = false;
  }
}

onMounted(carregar);
</script>

<style scoped>
.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
  font-size: 1.7rem;
  font-weight: 800;
  line-height: 1.2;
}

.kpi__detalhe {
  font-size: 0.82rem;
}

.graficos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status__linha {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status__linha span {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
