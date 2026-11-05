<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Olá, {{ sessionUser?.nome }}</div>
    <div class="row q-col-gutter-md">
      <div v-for="card in cards" :key="card.rotulo" class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-7">{{ card.rotulo }}</div>
            <div class="text-h4 text-weight-bold">{{ card.valor }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <q-banner class="q-mt-lg bg-blue-1 text-grey-9" rounded>
      Atas, tarefas, calendário e o assistente por voz entram nas próximas fases do roadmap.
    </q-banner>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useReunioes } from "src/composables/useReunioes";
import { sessionUser } from "src/services/session";

const { reunioes, carregar } = useReunioes();
onMounted(carregar);

const contar = (status: string) => reunioes.value.filter((r) => r.status === status).length;
const cards = computed(() => [
  { rotulo: "Reuniões agendadas", valor: contar("AGENDADA") },
  { rotulo: "Em andamento", valor: contar("EM_ANDAMENTO") },
  { rotulo: "Reuniões realizadas", valor: contar("FINALIZADA") },
  { rotulo: "Total", valor: reunioes.value.length },
]);
</script>
