<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card class="q-pa-lg" style="width: 100%; max-width: 400px">
      <q-card-section>
        <div class="text-h5 text-weight-bold">Senior AI</div>
        <div class="text-grey-7">Seu assistente executivo inteligente</div>
      </q-card-section>
      <q-form class="q-gutter-md q-px-md q-pb-md" @submit.prevent="acessar">
        <q-input v-model="email" type="email" label="E-mail" autocomplete="username" outlined :rules="[obrigatorio]" />
        <q-input
          v-model="senha"
          type="password"
          label="Senha"
          autocomplete="current-password"
          outlined
          :rules="[obrigatorio]"
        />
        <q-btn type="submit" color="primary" label="Entrar" class="full-width" unelevated :loading="carregando" />
      </q-form>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import { entrar, mensagemDeErro } from "src/boot/axios";

const $q = useQuasar();
const router = useRouter();
const email = ref("");
const senha = ref("");
const carregando = ref(false);
const obrigatorio = (v: string) => !!v || "Obrigatório";

async function acessar() {
  carregando.value = true;
  try {
    await entrar(email.value, senha.value);
    await router.replace("/app");
  } catch (erro) {
    $q.notify({ type: "negative", message: mensagemDeErro(erro) });
  } finally {
    carregando.value = false;
  }
}
</script>
