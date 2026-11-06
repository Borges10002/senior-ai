<template>
  <q-page class="mf-page meus">
    <header class="mf-page-header">
      <div>
        <h1 class="mf-title">Meus feedbacks</h1>
        <p class="mf-subtitle">Acompanhe o que você enviou e a resposta da equipe.</p>
      </div>
      <q-btn unelevated no-caps color="primary" icon="campaign" label="Novo feedback" @click="dialogo = true" />
    </header>

    <section class="contadores">
      <button
        v-for="f in filtros"
        :key="f.valor"
        type="button"
        class="contador"
        :class="{ 'contador--ativo': filtro === f.valor }"
        @click="filtro = f.valor"
      >
        <q-icon :name="f.icone" :style="{ color: f.cor }" />
        <span class="contador__numero">{{ contagem(f.valor) }}</span>
        <span class="mf-muted">{{ f.rotulo }}</span>
      </button>
    </section>

    <q-linear-progress v-if="carregando" indeterminate color="primary" />

    <div v-if="!carregando && !visiveis.length" class="mf-card mf-empty">
      <q-icon name="forum" size="32px" />
      <strong>{{ feedbacks.length ? "Nenhum feedback neste filtro" : "Você ainda não enviou feedbacks" }}</strong>
      Use o botão "Feedback" no topo de qualquer tela para sugerir, avisar de um erro ou tirar uma dúvida.
    </div>

    <article v-for="f in visiveis" :key="f.id" class="mf-card item">
      <div class="item__topo">
        <q-chip dense square :icon="estiloTipo(f.tipo).icone" :style="{ background: estiloTipo(f.tipo).fundo, color: estiloTipo(f.tipo).cor }">
          {{ estiloTipo(f.tipo).rotulo }}
        </q-chip>
        <span class="mf-muted">{{ formatarDataHora(f.created_at) }}</span>
        <q-space />
        <q-chip dense :icon="estiloStatus(f.status).icone" :style="{ background: estiloStatus(f.status).fundo, color: estiloStatus(f.status).cor }" class="text-weight-bold">
          {{ estiloStatus(f.status).rotulo }}
        </q-chip>
      </div>

      <h3 class="item__titulo">{{ f.titulo }}</h3>
      <p class="item__mensagem">{{ f.mensagem }}</p>

      <!-- Linha do tempo do status -->
      <div class="etapas">
        <div
          v-for="(etapa, i) in etapas"
          :key="etapa.valor"
          class="etapa"
          :class="{ 'etapa--feita': i <= indiceStatus(f.status) }"
        >
          <span class="etapa__ponto"><q-icon :name="i <= indiceStatus(f.status) ? 'check' : etapa.icone" size="14px" /></span>
          <span class="etapa__rotulo">{{ etapa.rotulo }}</span>
        </div>
      </div>

      <div v-if="f.resposta" class="resposta">
        <div class="resposta__topo">
          <q-icon name="support_agent" /> Resposta da equipe
          <span v-if="f.respondido_em" class="mf-muted">· {{ formatarDataHora(f.respondido_em) }}</span>
        </div>
        <p>{{ f.resposta }}</p>
      </div>
      <div v-else class="mf-muted sem-resposta">
        <q-icon name="schedule" /> Ainda sem resposta
      </div>
    </article>

    <FeedbackDialog v-model="dialogo" />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import FeedbackDialog from "src/components/FeedbackDialog.vue";
import { extractApiErrorMessage } from "src/boot/axios";
import { useNotify } from "src/composables/UseNotify";
import {
  estiloStatus,
  estiloTipo,
  feedbackService,
  formatarDataHora,
  STATUS_FEEDBACK,
  type Feedback,
  type StatusFeedback,
} from "src/services/feedbackService";

const { notifyErrorWait } = useNotify();
const feedbacks = ref<Feedback[]>([]);
const carregando = ref(false);
const dialogo = ref(false);
const filtro = ref<"todos" | StatusFeedback>("todos");

const etapas = (Object.keys(STATUS_FEEDBACK) as StatusFeedback[]).map((valor) => ({ valor, ...STATUS_FEEDBACK[valor] }));
const indiceStatus = (status: string) => Math.max(0, etapas.findIndex((e) => e.valor === (status || "aberto")));

const filtros = [
  { valor: "todos" as const, rotulo: "Todos", icone: "forum", cor: "var(--mf-text)" },
  ...etapas.map((e) => ({ valor: e.valor, rotulo: e.rotulo, icone: e.icone, cor: e.cor })),
];
const contagem = (valor: string) =>
  valor === "todos" ? feedbacks.value.length : feedbacks.value.filter((f) => (f.status || "aberto") === valor).length;
const visiveis = computed(() =>
  filtro.value === "todos" ? feedbacks.value : feedbacks.value.filter((f) => (f.status || "aberto") === filtro.value),
);

async function carregar() {
  carregando.value = true;
  try {
    feedbacks.value = await feedbackService.meus();
  } catch (e) {
    notifyErrorWait(extractApiErrorMessage(e));
  } finally {
    carregando.value = false;
  }
}

// Recarrega ao fechar a janela de envio (pode ter um feedback novo).
watch(dialogo, (aberto) => {
  if (!aberto) void carregar();
});
onMounted(carregar);
</script>

<style scoped>
.meus {
  max-width: 980px;
}

.contadores {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.contador {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--mf-radius);
  border: 1px solid var(--mf-border);
  background: var(--mf-surface);
  font: inherit;
  color: inherit;
  cursor: pointer;
  font-size: 1.1rem;
}

.contador--ativo {
  border-color: var(--mf-primary);
  box-shadow: 0 0 0 3px var(--mf-primary-soft);
}

.contador__numero {
  font-size: 1.3rem;
  font-weight: 800;
}

.item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item__topo {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.item__titulo {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.item__mensagem {
  margin: 0;
  white-space: pre-wrap;
  color: var(--mf-text-muted);
}

.etapas {
  display: flex;
  align-items: center;
  gap: 0;
  margin: 6px 0 2px;
}

.etapa {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  color: var(--mf-text-muted);
  font-size: 0.8rem;
  font-weight: 600;
}

.etapa:not(:last-child)::after {
  content: "";
  flex: 1;
  height: 2px;
  margin: 0 8px;
  background: var(--mf-border);
}

.etapa--feita {
  color: var(--mf-income);
}

.etapa--feita:not(:last-child)::after {
  background: var(--mf-income);
}

.etapa__ponto {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex: none;
  background: var(--mf-surface-alt);
}

.etapa--feita .etapa__ponto {
  color: #fff;
  background: var(--mf-income);
}

.resposta {
  padding: 12px 14px;
  border-radius: 14px;
  border-left: 4px solid var(--mf-primary);
  background: var(--mf-primary-soft);
}

.resposta__topo {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: var(--mf-primary);
}

.resposta p {
  margin: 6px 0 0;
  white-space: pre-wrap;
}

.sem-resposta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
}

@media (max-width: 560px) {
  .etapa__rotulo {
    display: none;
  }
}
</style>
