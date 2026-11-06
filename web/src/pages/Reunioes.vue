<template>
  <q-page class="mf-page">
    <div class="mf-page-header">
      <div>
        <h1 class="mf-title">Reuniões</h1>
        <p class="mf-subtitle">Agende, inicie e finalize suas reuniões.</p>
      </div>
      <q-btn unelevated no-caps color="primary" icon="add" label="Nova reunião" @click="dialogo = true" />
    </div>

    <q-card flat class="mf-card">
      <q-list separator>
        <q-item v-if="!carregando && !reunioes.length">
          <q-item-section class="mf-muted">Nenhuma reunião cadastrada.</q-item-section>
        </q-item>
        <q-item v-for="r in reunioes" :key="r.id">
          <q-item-section>
            <q-item-label class="text-weight-medium">{{ r.titulo }}</q-item-label>
            <q-item-label caption>
              {{ formatarDataHora(r.inicio_previsto) }}<span v-if="r.assunto"> · {{ r.assunto }}</span>
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="row items-center q-gutter-sm">
              <q-badge :color="ROTULO_STATUS[r.status].cor" :label="ROTULO_STATUS[r.status].texto" />
              <q-btn v-if="r.status === 'AGENDADA'" flat dense no-caps icon="play_arrow" label="Iniciar" @click="acao(r.id, 'iniciar')" />
              <q-btn v-if="r.status === 'EM_ANDAMENTO'" flat dense no-caps icon="stop" label="Finalizar" @click="acao(r.id, 'finalizar')" />
              <q-btn v-if="r.status === 'AGENDADA'" flat dense round icon="event_busy" aria-label="Cancelar reunião" @click="acao(r.id, 'cancelar')" />
              <q-btn
                v-if="r.status === 'AGENDADA' || r.status === 'CANCELADA'"
                flat
                dense
                round
                icon="delete"
                aria-label="Excluir reunião"
                @click="confirmarExclusao(r.id, r.titulo)"
              />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
      <q-inner-loading :showing="carregando" />
    </q-card>

    <q-dialog v-model="dialogo">
      <q-card style="width: 100%; max-width: 480px">
        <q-card-section class="text-h6">Nova reunião</q-card-section>
        <q-form class="q-gutter-md q-px-md q-pb-md" @submit.prevent="salvar">
          <q-input v-model="form.titulo" label="Título" outlined :rules="[(v) => !!v || 'Obrigatório']" />
          <q-input v-model="form.assunto" label="Assunto" outlined />
          <q-input v-model="form.inicio" type="datetime-local" label="Início previsto" outlined stack-label />
          <div class="row justify-end q-gutter-sm">
            <q-btn v-close-popup flat no-caps label="Cancelar" />
            <q-btn type="submit" color="primary" no-caps label="Salvar" unelevated :loading="salvando" />
          </div>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useQuasar } from "quasar";
import { useRoute } from "vue-router";
import { extractApiErrorMessage } from "src/boot/axios";
import { useReunioes } from "src/composables/useReunioes";
import { ROTULO_STATUS, formatarDataHora } from "src/domain/reuniao";
import type { AcaoReuniao } from "src/services/reuniaoService";

const $q = useQuasar();
const route = useRoute();
const { reunioes, carregando, carregar, criar, mudarStatus, excluir } = useReunioes();
const dialogo = ref(route.query.nova === "1");
const salvando = ref(false);
const form = reactive({ titulo: "", assunto: "", inicio: "" });

const avisarErro = (erro: unknown) => $q.notify({ type: "negative", message: extractApiErrorMessage(erro) });

onMounted(() => carregar().catch(avisarErro));

async function salvar() {
  salvando.value = true;
  try {
    await criar({
      titulo: form.titulo,
      assunto: form.assunto || null,
      inicio_previsto: form.inicio ? new Date(form.inicio).toISOString() : null,
    });
    Object.assign(form, { titulo: "", assunto: "", inicio: "" });
    dialogo.value = false;
  } catch (erro) {
    avisarErro(erro);
  } finally {
    salvando.value = false;
  }
}

async function acao(id: string, tipo: AcaoReuniao) {
  try {
    await mudarStatus(id, tipo);
  } catch (erro) {
    avisarErro(erro);
  }
}

function confirmarExclusao(id: string, titulo: string) {
  $q.dialog({ title: "Excluir reunião", message: `Excluir "${titulo}"?`, cancel: true }).onOk(() => {
    excluir(id).catch(avisarErro);
  });
}
</script>
