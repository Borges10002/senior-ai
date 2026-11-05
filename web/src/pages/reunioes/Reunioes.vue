<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h5">Reuniões</div>
      <q-space />
      <q-btn color="primary" icon="add" label="Nova reunião" unelevated @click="dialogo = true" />
    </div>

    <q-list bordered separator class="rounded-borders">
      <q-item v-if="!carregando && !reunioes.length">
        <q-item-section class="text-grey-7">Nenhuma reunião cadastrada.</q-item-section>
      </q-item>
      <q-item v-for="r in reunioes" :key="r.id">
        <q-item-section>
          <q-item-label class="text-weight-medium">{{ r.titulo }}</q-item-label>
          <q-item-label caption>{{ formatarDataHora(r.inicio_previsto) }}<span v-if="r.assunto"> · {{ r.assunto }}</span></q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="row items-center q-gutter-sm">
            <q-badge :color="ROTULO_STATUS[r.status].cor" :label="ROTULO_STATUS[r.status].texto" />
            <q-btn v-if="r.status === 'AGENDADA'" flat dense icon="play_arrow" label="Iniciar" @click="acao(r.id, 'start')" />
            <q-btn v-if="r.status === 'EM_ANDAMENTO'" flat dense icon="stop" label="Finalizar" @click="acao(r.id, 'finish')" />
          </div>
        </q-item-section>
      </q-item>
    </q-list>
    <q-inner-loading :showing="carregando" />

    <q-dialog v-model="dialogo">
      <q-card style="width: 100%; max-width: 480px">
        <q-card-section class="text-h6">Nova reunião</q-card-section>
        <q-form class="q-gutter-md q-px-md q-pb-md" @submit.prevent="salvar">
          <q-input v-model="form.titulo" label="Título" outlined :rules="[(v) => !!v || 'Obrigatório']" />
          <q-input v-model="form.assunto" label="Assunto" outlined />
          <q-input v-model="form.inicio" type="datetime-local" label="Início previsto" outlined stack-label />
          <div class="row justify-end q-gutter-sm">
            <q-btn v-close-popup flat label="Cancelar" />
            <q-btn type="submit" color="primary" label="Salvar" unelevated :loading="salvando" />
          </div>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useQuasar } from "quasar";
import { mensagemDeErro } from "src/boot/axios";
import { useReunioes } from "src/composables/useReunioes";
import { ROTULO_STATUS, formatarDataHora } from "src/domain/reuniao";

const $q = useQuasar();
const { reunioes, carregando, carregar, criar, mudarStatus } = useReunioes();
const dialogo = ref(false);
const salvando = ref(false);
const form = reactive({ titulo: "", assunto: "", inicio: "" });

onMounted(carregar);

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
    $q.notify({ type: "negative", message: mensagemDeErro(erro) });
  } finally {
    salvando.value = false;
  }
}

async function acao(id: string, tipo: "start" | "finish") {
  try {
    await mudarStatus(id, tipo);
  } catch (erro) {
    $q.notify({ type: "negative", message: mensagemDeErro(erro) });
  }
}
</script>
