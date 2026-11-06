<template>
  <q-page class="flex flex-center redefinir">
    <q-card flat bordered class="redefinir__card">
      <q-card-section class="text-center">
        <img src="/icons/logo.svg" alt="Senior AI" class="redefinir__logo" />
        <div class="text-h5 text-weight-bold q-mt-md">Criar nova senha</div>
        <div class="text-grey-7">Escolha uma senha nova para entrar no Senior AI.</div>
      </q-card-section>

      <q-card-section v-if="!token" class="text-center">
        <q-banner rounded class="bg-orange-1 text-orange-10">
          Link incompleto. Abra o link que chegou no seu e-mail ou peça um novo em "Esqueci minha senha".
        </q-banner>
        <q-btn class="q-mt-md" flat no-caps color="primary" label="Voltar para o login" to="/login" />
      </q-card-section>

      <q-card-section v-else-if="concluido" class="text-center">
        <q-icon name="check_circle" color="positive" size="48px" />
        <p class="q-mt-sm">{{ concluido }}</p>
        <q-btn unelevated no-caps color="primary" label="Ir para o login" to="/login" />
      </q-card-section>

      <q-card-section v-else>
        <q-form class="q-gutter-md" @submit="salvar">
          <CampoSenha v-model="senha" label="Nova senha" icone="lock" outlined :rules="[(v: string) => isStrongPassword(v) || PASSWORD_MESSAGE]" />
          <CampoSenha
            v-model="confirmacao"
            label="Repita a nova senha"
            icone="lock_reset"
            outlined
            :rules="[(v: string) => v === senha || 'As senhas não são iguais']"
          />
          <div class="text-caption text-grey-7">Mínimo de 12 caracteres, com letra, número e um caractere especial.</div>
          <q-btn type="submit" unelevated no-caps color="primary" size="lg" class="full-width" label="Salvar nova senha" :loading="salvando" />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { isStrongPassword, PASSWORD_MESSAGE } from "src/domain/password";
import { readResetToken } from "src/domain/passwordReset";

import CampoSenha from "src/components/CampoSenha.vue";
import { extractApiErrorMessage } from "src/boot/axios";
import { useNotify } from "src/composables/UseNotify";
import { senhaService } from "src/services/senhaService";

const route = useRoute();
const router = useRouter();
const { notifyErrorWait } = useNotify();
const token = ref(readResetToken(route.query.token, route.hash));
// Preserve the credential only in memory, removing it from browser history/URLs.
onMounted(() => {
  if (route.query.token || route.hash) void router.replace({ query: { ...route.query, token: undefined }, hash: "" });
});

const senha = ref("");
const confirmacao = ref("");
const salvando = ref(false);
const concluido = ref<string | null>(null);

async function salvar() {
  if (senha.value !== confirmacao.value) return;
  salvando.value = true;
  try {
    concluido.value = await senhaService.redefinir(token.value, senha.value);
  } catch (e) {
    notifyErrorWait(extractApiErrorMessage(e));
  } finally {
    salvando.value = false;
  }
}
</script>

<style scoped>
.redefinir {
  padding: 16px;
}

.redefinir__card {
  width: min(440px, 100%);
  border-radius: 20px;
}

.redefinir__logo {
  width: 64px;
  height: 64px;
  border-radius: 18px;
}
</style>
