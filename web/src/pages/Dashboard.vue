<template>
  <q-page class="mf-page">
    <div class="mf-page-header">
      <div>
        <h1 class="mf-title">Olá, {{ primeiroNome }}</h1>
        <p class="mf-subtitle">Sua agenda de reuniões em um só lugar.</p>
      </div>
      <q-btn unelevated no-caps color="primary" icon="add" label="Nova reunião" to="/app/reunioes?nova=1" />
    </div>

    <div class="mf-grid">
      <q-card v-for="card in cards" :key="card.rotulo" flat class="mf-card q-pa-md">
        <div class="mf-muted">{{ card.rotulo }}</div>
        <div class="text-h4 text-weight-bold">{{ card.valor }}</div>
      </q-card>
    </div>

    <h2 class="mf-section-title q-mt-lg q-mb-md">Próximas reuniões</h2>
    <q-card flat class="mf-card">
      <q-list separator>
        <q-item v-for="r in proximas" :key="r.id" clickable to="/app/reunioes">
          <q-item-section>
            <q-item-label class="text-weight-medium">{{ r.titulo }}</q-item-label>
            <q-item-label caption>{{ formatarDataHora(r.inicio_previsto) }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-if="!carregando && !proximas.length">
          <q-item-section class="mf-muted">Nenhuma reunião agendada.</q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useAuth } from "src/composables/useAuth";
import { useReunioes } from "src/composables/useReunioes";
import { formatarDataHora } from "src/domain/reuniao";

const { user } = useAuth();
const { reunioes, carregando, carregar } = useReunioes();
onMounted(carregar);

const primeiroNome = computed(() => String((user.value as { nome?: string } | null)?.nome ?? "").split(" ")[0]);
const contar = (status: string) => reunioes.value.filter((r) => r.status === status).length;
const cards = computed(() => [
  { rotulo: "Reuniões agendadas", valor: contar("AGENDADA") },
  { rotulo: "Em andamento", valor: contar("EM_ANDAMENTO") },
  { rotulo: "Reuniões realizadas", valor: contar("FINALIZADA") },
  { rotulo: "Total", valor: reunioes.value.length },
]);
const proximas = computed(() =>
  reunioes.value
    .filter((r) => r.status === "AGENDADA")
    .sort((a, b) => String(a.inicio_previsto ?? "9").localeCompare(String(b.inicio_previsto ?? "9")))
    .slice(0, 5),
);
</script>
