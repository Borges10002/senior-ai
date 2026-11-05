<template>
  <q-layout view="lHh Lpr lff">
    <q-header class="bg-dark">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Abrir menu" @click="menuAberto = !menuAberto" />
        <q-toolbar-title class="text-weight-bold">Senior AI</q-toolbar-title>
        <q-btn-dropdown flat no-caps :label="sessionUser?.nome">
          <q-list>
            <q-item>
              <q-item-section>
                <q-item-label>{{ sessionUser?.nome }}</q-item-label>
                <q-item-label caption>{{ sessionUser?.email }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-separator />
            <q-item v-close-popup clickable @click="encerrar">
              <q-item-section avatar><q-icon name="logout" /></q-item-section>
              <q-item-section>Sair</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="menuAberto" show-if-above bordered :width="240">
      <q-list padding>
        <q-item v-for="item in menu" :key="item.to" clickable :to="item.to" exact>
          <q-item-section avatar><q-icon :name="item.icone" /></q-item-section>
          <q-item-section>{{ item.rotulo }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { sair } from "src/boot/axios";
import { sessionUser } from "src/services/session";

const router = useRouter();
const menuAberto = ref(false);

// Novas telas (atas, tarefas, calendário, aprovações) entram aqui conforme o roadmap.
const menu = [
  { to: "/app", icone: "dashboard", rotulo: "Início" },
  { to: "/app/reunioes", icone: "groups", rotulo: "Reuniões" },
];

async function encerrar() {
  await sair();
  await router.replace("/login");
}
</script>
