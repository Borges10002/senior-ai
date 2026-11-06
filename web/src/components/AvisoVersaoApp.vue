<template>
  <div v-if="mostrar && versaoApp" class="aviso-versao">
    <q-icon name="system_update" size="22px" />
    <span class="aviso-versao__texto">
      <strong>Nova versão do app Android: {{ versaoApp.versao }}</strong>
      <span v-if="versaoApp.novidades?.length" class="aviso-versao__novidades">
        — {{ versaoApp.novidades.slice(0, 2).join(" · ") }}
      </span>
    </span>
    <q-btn
      unelevated
      dense
      no-caps
      color="primary"
      icon="download"
      label="Baixar"
      :href="versaoApp.url"
      type="a"
      @click="marcarVista"
    />
    <q-btn flat dense round icon="close" aria-label="Fechar aviso" @click="marcarVista" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { useVersaoApp } from "src/composables/useVersaoApp";

const CHAVE = "mf.versaoAppVista";
const { versaoApp } = useVersaoApp();

const lerVista = () => {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
};
const vista = ref(lerVista());

// Uma vez por versão: some quando o usuário baixa ou fecha.
const mostrar = computed(() => !!versaoApp.value && vista.value !== versaoApp.value.versao);

function marcarVista() {
  if (!versaoApp.value) return;
  vista.value = versaoApp.value.versao;
  try {
    localStorage.setItem(CHAVE, versaoApp.value.versao);
  } catch {
    // Sem armazenamento (aba anônima): o aviso só some nesta visita.
  }
}
</script>

<style scoped>
.aviso-versao {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 24px 0;
  padding: 10px 14px;
  border-radius: 14px;
  background: var(--mf-income-soft);
  color: #0b6e4d;
}

.aviso-versao__texto {
  flex: 1;
  font-size: 0.92rem;
}

.aviso-versao__novidades {
  color: var(--mf-text-muted);
}

@media (max-width: 600px) {
  .aviso-versao {
    margin: 12px 12px 0;
    flex-wrap: wrap;
  }

  .aviso-versao__novidades {
    display: none;
  }
}
</style>
