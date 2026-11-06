<template>
  <q-item
    v-if="modo === 'menu'"
    v-ripple
    clickable
    class="menu__item"
    @click="aberto = true"
  >
    <q-item-section avatar><q-icon name="android" /></q-item-section>
    <q-item-section>Baixar app Android</q-item-section>
    <q-tooltip v-if="mini" anchor="center right" self="center left">Baixar app Android</q-tooltip>
  </q-item>

  <q-btn
    v-else
    outline
    no-caps
    color="primary"
    icon="android"
    class="full-width"
    label="Baixar o app para Android"
    @click="aberto = true"
  />

  <q-dialog v-model="aberto">
    <q-card class="baixar-app">
      <q-card-section class="baixar-app__topo">
        <div class="baixar-app__icone"><q-icon name="android" size="34px" /></div>
        <div>
          <div class="text-h6 text-weight-bold">Senior AI para Android</div>
          <div class="text-grey-7">Suas reuniões no celular, com a mesma conta do site.</div>
          <q-chip v-if="versaoApp" dense square class="q-ml-none q-mt-xs" icon="new_releases">
            Versão {{ versaoApp.versao }}<template v-if="versaoApp.data"> · {{ dataCurta(versaoApp.data) }}</template>
          </q-chip>
        </div>
      </q-card-section>

      <q-card-section v-if="versaoApp?.novidades?.length" class="q-pt-none">
        <div class="baixar-app__novidades">
          <strong>Novidades desta versão</strong>
          <ul>
            <li v-for="n in versaoApp.novidades" :key="n">{{ n }}</li>
          </ul>
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <ol class="baixar-app__passos">
          <li>Toque em <strong>Baixar APK</strong> e aguarde o download.</li>
          <li>Abra o arquivo <strong>seniorai.apk</strong> nas notificações ou em Downloads.</li>
          <li>Se o Android pedir, permita <strong>instalar apps desta fonte</strong>.</li>
          <li>Abra o Senior AI e entre com o mesmo e-mail e senha do site.</li>
        </ol>
        <div class="baixar-app__aviso">
          <q-icon name="info" size="18px" />
          <span>
            Está no computador? Abra este site no celular Android para baixar. No iPhone, use o Senior AI pelo
            navegador.
          </span>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn v-close-popup flat no-caps label="Fechar" />
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="download"
          label="Baixar APK"
          :href="versaoApp?.url ?? URL_APK_PADRAO"
          download="seniorai.apk"
          type="a"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { useVersaoApp } from "src/composables/useVersaoApp";

withDefaults(defineProps<{ modo?: "botao" | "menu"; mini?: boolean }>(), { modo: "botao", mini: false });

// Link e versão vêm de web/public/app-versao.json; este é só o reserva.
const URL_APK_PADRAO = "https://download.dimitech.com.br/seniorai/seniorai.apk";
const { versaoApp } = useVersaoApp();
const dataCurta = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR");

const aberto = ref(false);
</script>

<style scoped>
.baixar-app {
  width: min(460px, 94vw);
  border-radius: 20px;
}

.baixar-app__topo {
  display: flex;
  align-items: center;
  gap: 14px;
}

.baixar-app__icone {
  flex: none;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  color: #0e9f6e;
  background: var(--mf-income-soft);
}

.baixar-app__passos {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  line-height: 1.45;
}

.baixar-app__novidades {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--mf-primary-soft);
  color: #1638b8;
  font-size: 0.9rem;
}

.baixar-app__novidades ul {
  margin: 6px 0 0;
  padding-left: 18px;
}

.baixar-app__aviso {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  color: var(--mf-text-muted);
  background: var(--mf-surface-alt);
}
</style>
