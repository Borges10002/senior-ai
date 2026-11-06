<template>
  <q-page class="mf-page">
    <header class="mf-page-header">
      <div>
        <h1 class="mf-title">Usuários</h1>
        <p class="mf-subtitle">Defina o perfil de acesso e ative ou desative contas.</p>
      </div>
      <q-btn flat no-caps icon="refresh" label="Atualizar" :loading="carregando" @click="carregar" />
    </header>

    <div class="filtros">
      <q-input v-model="busca" outlined dense clearable placeholder="Buscar por nome ou e-mail" class="filtros__busca">
        <template #prepend><q-icon name="search" /></template>
      </q-input>
      <div class="row q-gutter-sm">
        <q-chip
          v-for="f in filtros"
          :key="f.valor"
          clickable
          :outline="filtro !== f.valor"
          :color="filtro === f.valor ? 'primary' : undefined"
          :text-color="filtro === f.valor ? 'white' : undefined"
          @click="filtro = f.valor"
        >
          {{ f.rotulo }} ({{ contar(f.valor) }})
        </q-chip>
      </div>
    </div>

    <q-linear-progress v-if="carregando" indeterminate color="primary" />

    <div v-if="!carregando && visiveis.length === 0" class="mf-card mf-empty">
      <q-icon name="person_search" size="32px" />
      <strong>Nenhum usuário encontrado</strong>
      Ajuste a busca ou o filtro.
    </div>

    <div class="lista">
      <article
        v-for="u in visiveis"
        :key="u.codigo"
        class="mf-card usuario"
        :class="{ 'usuario--inativo': !u.ativo }"
      >
        <q-avatar size="44px" class="usuario__avatar" :style="{ background: corPerfil(u.perfil.nivel) }">
          {{ iniciais(u.nome) }}
        </q-avatar>

        <div class="usuario__dados">
          <div class="usuario__nome">
            {{ u.nome }}
            <q-chip v-if="u.codigo === codigoUsuario" dense color="primary" text-color="white" label="Você" />
          </div>
          <div class="mf-muted ellipsis">{{ u.email }}</div>
          <div class="usuario__tags">
            <q-chip dense square :style="{ background: corPerfil(u.perfil.nivel), color: '#fff' }" :icon="iconePerfil(u.perfil.nivel)">
              {{ u.perfil.nome }}
            </q-chip>
            <q-chip dense square :color="u.ativo ? 'green-1' : 'red-1'" :text-color="u.ativo ? 'positive' : 'negative'">
              {{ u.ativo ? "Ativa" : "Inativa" }}
            </q-chip>
          </div>
        </div>

        <div class="usuario__acoes">
          <q-select
            :model-value="u.perfil.nivel"
            :options="perfis"
            option-value="nivel"
            option-label="nome"
            emit-value
            map-options
            outlined
            dense
            label="Perfil"
            class="usuario__perfil"
            :disable="u.codigo === codigoUsuario || salvando === u.codigo"
            @update:model-value="(nivel: number) => alterarPerfil(u, nivel)"
          />
          <q-toggle
            :model-value="u.ativo"
            color="positive"
            :label="u.ativo ? 'Ativa' : 'Inativa'"
            :disable="u.codigo === codigoUsuario || salvando === u.codigo"
            @update:model-value="(ativo: boolean) => alterarStatus(u, ativo)"
          />
          <q-tooltip v-if="u.codigo === codigoUsuario" anchor="top middle" self="bottom middle">
            Você não pode alterar a própria conta. Peça a outro administrador.
          </q-tooltip>
        </div>
      </article>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useQuasar } from "quasar";

import { extractApiErrorMessage } from "src/boot/axios";
import { useNotify } from "src/composables/UseNotify";
import { usePerfil } from "src/composables/usePerfil";
import { adminService, type OpcaoPerfil, type UsuarioAdmin } from "src/services/adminService";

const $q = useQuasar();
const { notifySuccess, notifyErrorWait } = useNotify();
const { codigoUsuario, carregar: carregarPerfil } = usePerfil();

const usuarios = ref<UsuarioAdmin[]>([]);
const perfis = ref<OpcaoPerfil[]>([]);
const carregando = ref(false);
const salvando = ref<number | null>(null);
const busca = ref<string | null>("");
const filtro = ref<string>("todos");

const filtros = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "admins", rotulo: "Administradores" },
  { valor: "ativos", rotulo: "Ativos" },
  { valor: "inativos", rotulo: "Inativos" },
];

function atendeFiltro(u: UsuarioAdmin, valor: string) {
  if (valor === "admins") return u.perfil.admin;
  if (valor === "ativos") return u.ativo;
  if (valor === "inativos") return !u.ativo;
  return true;
}

const contar = (valor: string) => usuarios.value.filter((u) => atendeFiltro(u, valor)).length;

const visiveis = computed(() => {
  const termo = (busca.value ?? "").trim().toLowerCase();
  return usuarios.value.filter(
    (u) =>
      atendeFiltro(u, filtro.value) &&
      (!termo || u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo)),
  );
});

const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("") || "?";

const corPerfil = (nivel: number) => (nivel >= 3 ? "#2457f5" : nivel === 2 ? "#d98e04" : "#64748b");
const iconePerfil = (nivel: number) =>
  nivel >= 3 ? "admin_panel_settings" : nivel === 2 ? "manage_accounts" : "person";

function confirmar(titulo: string, mensagem: string, rotulo: string, perigo: boolean) {
  return new Promise<boolean>((resolve) => {
    $q.dialog({
      title: titulo,
      message: mensagem,
      cancel: { flat: true, noCaps: true, label: "Cancelar" },
      ok: { color: perigo ? "negative" : "primary", noCaps: true, label: rotulo },
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false))
      .onDismiss(() => resolve(false));
  });
}

async function salvar(u: UsuarioAdmin, alteracao: { nivel?: number; ativo?: boolean }, sucesso: string) {
  salvando.value = u.codigo;
  try {
    const atualizado = await adminService.alterarUsuario(u.codigo, alteracao);
    usuarios.value = usuarios.value.map((x) => (x.codigo === u.codigo ? atualizado : x));
    notifySuccess(sucesso);
  } catch (e) {
    notifyErrorWait(extractApiErrorMessage(e));
  } finally {
    salvando.value = null;
  }
}

async function alterarPerfil(u: UsuarioAdmin, nivel: number) {
  if (nivel === u.perfil.nivel) return;
  const novo = perfis.value.find((p) => p.nivel === nivel)?.nome ?? "";
  const rebaixando = nivel < u.perfil.nivel;
  const ok = await confirmar(
    rebaixando ? "Reduzir acesso" : "Ampliar acesso",
    `Alterar o perfil de ${u.nome} de ${u.perfil.nome} para ${novo}?` +
      (u.perfil.admin && rebaixando ? " Ele perderá o acesso à área administrativa." : "") +
      (nivel >= 3 ? " Ele poderá gerenciar usuários e ver todos os feedbacks." : ""),
    "Alterar perfil",
    rebaixando,
  );
  if (ok) await salvar(u, { nivel }, `${u.nome} agora é ${novo}`);
}

async function alterarStatus(u: UsuarioAdmin, ativo: boolean) {
  if (!ativo) {
    const ok = await confirmar(
      "Desativar conta",
      `Desativar a conta de ${u.nome}? Ele não conseguirá mais entrar no sistema.`,
      "Desativar",
      true,
    );
    if (!ok) return;
  }
  await salvar(u, { ativo }, ativo ? `Conta de ${u.nome} ativada` : `Conta de ${u.nome} desativada`);
}

async function carregar() {
  carregando.value = true;
  try {
    const [lista, opcoes] = await Promise.all([
      adminService.usuarios(),
      adminService.perfis(),
      carregarPerfil(),
    ]);
    usuarios.value = lista;
    perfis.value = opcoes;
  } catch (e) {
    notifyErrorWait(extractApiErrorMessage(e));
  } finally {
    carregando.value = false;
  }
}

onMounted(carregar);
</script>

<style scoped>
.filtros {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.filtros__busca {
  flex: 1;
  min-width: 240px;
  max-width: 420px;
}

.lista {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.usuario {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.usuario--inativo {
  opacity: 0.7;
}

.usuario__avatar {
  color: #fff;
  font-weight: 700;
}

.usuario__dados {
  flex: 1;
  min-width: 200px;
}

.usuario__nome {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 1.02rem;
}

.usuario__tags {
  margin-top: 4px;
  margin-left: -4px;
}

.usuario__acoes {
  display: flex;
  align-items: center;
  gap: 12px;
}

.usuario__perfil {
  width: 180px;
}
</style>
