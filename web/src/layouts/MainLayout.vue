<template>
  <q-layout view="lHh Lpr lff" class="mf-layout">
    <q-header class="mf-header">
      <q-toolbar class="mf-toolbar">
        <q-btn flat dense round icon="menu" aria-label="Abrir menu" @click="toggleLeftDrawer" />
        <div class="mf-toolbar__titulo">
          <q-icon :name="paginaAtual.icon" />
          <span>{{ paginaAtual.label }}</span>
        </div>
        <q-space />
        <q-btn
          flat
          no-caps
          icon="campaign"
          :label="$q.screen.gt.xs ? 'Feedback' : undefined"
          class="mf-toolbar-btn"
          @click="showFeedback = true"
        />
        <q-btn flat round dense :icon="iconeTema" aria-label="Tema claro ou escuro">
          <q-tooltip>Aparência</q-tooltip>
          <q-menu auto-close anchor="bottom right" self="top right">
            <q-list dense style="min-width: 170px">
              <q-item v-for="t in OPCOES_TEMA" :key="t.valor" clickable :active="tema === t.valor" @click="escolherTema(t.valor)">
                <q-item-section avatar><q-icon :name="t.icone" /></q-item-section>
                <q-item-section>{{ t.rotulo }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <q-btn-dropdown flat no-caps dropdown-icon="expand_more" class="mf-toolbar-btn">
          <template #label>
            <q-avatar size="30px" class="avatar-gradiente">{{ iniciais }}</q-avatar>
          </template>
          <q-list class="user-menu-list">
            <q-item>
              <q-item-section>
                <q-item-label class="text-weight-bold">{{ displayUserName }}</q-item-label>
                <q-item-label caption>{{ emailUsuario }}</q-item-label>
                <q-item-label>
                  <q-chip dense square :class="isAdmin ? 'chip-perfil chip-perfil--admin' : 'chip-perfil'" :icon="isAdmin ? 'admin_panel_settings' : 'person'">
                    {{ nomePerfil }}
                  </q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable v-close-popup to="/app/assinatura">
              <q-item-section avatar><q-icon name="workspace_premium" /></q-item-section>
              <q-item-section>Meu plano</q-item-section>
            </q-item>
            <q-item clickable v-close-popup to="/app/configuracoes/alterar-senha">
              <q-item-section avatar><q-icon name="lock" /></q-item-section>
              <q-item-section>Alterar senha</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="logout">
              <q-item-section avatar><q-icon name="logout" color="negative" /></q-item-section>
              <q-item-section>Sair</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="280"
      :mini="mini"
      :mini-width="76"
      class="mf-drawer"
    >
      <div class="drawer">
        <div class="brand">
          <img class="brand__logo" src="/icons/logo.svg" alt="Senior AI" />
          <div v-if="!mini" class="brand__texto">
            <div class="brand__title">Senior AI</div>
            <div class="brand__subtitle">Assistente executivo inteligente</div>
          </div>
          <q-btn
            v-if="$q.screen.gt.sm && !mini"
            flat
            round
            dense
            size="sm"
            class="brand__recolher"
            icon="chevron_left"
            aria-label="Recolher menu"
            @click="miniMode = true"
          />
        </div>

        <div v-if="mini" class="q-px-md q-pb-sm flex flex-center">
          <q-btn
            flat
            round
            dense
            size="sm"
            class="brand__recolher"
            icon="chevron_right"
            aria-label="Expandir menu"
            @click="miniMode = false"
          />
        </div>

        <!-- Resumo recolhido: uma linha só, para telas pequenas -->
        <div v-if="!mini && !resumoAberto" class="resumo-compacto">
          <q-avatar size="32px" class="avatar-gradiente">{{ iniciais }}</q-avatar>
          <router-link to="/app/dashboard" class="resumo-compacto__texto" @click="fecharNoCelular">
            <span class="resumo-compacto__rotulo">{{ nomePerfil }}</span>
            <strong>{{ displayUserName }}</strong>
          </router-link>
          <q-btn flat round dense size="sm" icon="expand_more" class="brand__recolher" aria-label="Mostrar resumo" @click="alternarResumo">
            <q-tooltip>Mostrar resumo</q-tooltip>
          </q-btn>
        </div>

        <div v-if="!mini && resumoAberto" class="perfil">
          <q-avatar size="42px" class="avatar-gradiente">{{ iniciais }}</q-avatar>
          <div class="perfil__texto">
            <div class="perfil__nome ellipsis">{{ displayUserName }}</div>
            <div class="perfil__email ellipsis">{{ emailUsuario }}</div>
            <span class="perfil__papel" :class="{ 'perfil__papel--admin': isAdmin }">
              <q-icon :name="isAdmin ? 'admin_panel_settings' : 'person'" size="14px" />
              {{ nomePerfil }}
            </span>
          </div>
          <q-btn flat round dense size="sm" icon="expand_less" class="brand__recolher" aria-label="Ocultar resumo" @click="alternarResumo">
            <q-tooltip>Ocultar resumo</q-tooltip>
          </q-btn>
        </div>

        <div class="cta" :class="{ 'cta--compacto': !resumoAberto }">
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="add"
            :dense="!resumoAberto"
            :label="mini ? undefined : 'Nova reunião'"
            class="full-width cta__btn"
            to="/app/reunioes?nova=1"
            @click="fecharNoCelular"
          >
            <q-tooltip v-if="mini" anchor="center right" self="center left">Nova reunião</q-tooltip>
          </q-btn>
        </div>

        <q-scroll-area class="drawer__menu">
          <template v-for="secao in secoesVisiveis" :key="secao.titulo">
            <div v-if="!mini" class="secao">{{ secao.titulo }}</div>
            <q-separator v-else dark spaced class="q-mx-md" />
            <q-item
              v-for="item in secao.itens"
              :key="item.to"
              v-ripple
              clickable
              :to="item.to"
              active-class="menu__item--ativo"
              class="menu__item"
              @click="fecharNoCelular"
            >
              <q-item-section avatar>
                <q-icon :name="item.icon" />
                <q-badge
                  v-if="mini && item.badge"
                  floating
                  rounded
                  :color="item.badgeCor ?? 'negative'"
                  :label="item.badge"
                />
              </q-item-section>
              <q-item-section>{{ item.label }}</q-item-section>
              <q-item-section v-if="item.badge" side>
                <q-badge rounded :color="item.badgeCor ?? 'negative'" :label="item.badge" />
              </q-item-section>
              <q-tooltip v-if="mini" anchor="center right" self="center left">{{ item.label }}</q-tooltip>
            </q-item>
          </template>
        </q-scroll-area>

        <div class="drawer__rodape">
          <BaixarAppAndroid modo="menu" :mini="mini" />
          <q-item v-ripple clickable class="menu__item" @click="logout">
            <q-item-section avatar><q-icon name="logout" /></q-item-section>
            <q-item-section>Sair</q-item-section>
            <q-tooltip v-if="mini" anchor="center right" self="center left">Sair</q-tooltip>
          </q-item>
        </div>
      </div>
    </q-drawer>

    <q-page-container>
      <!-- Aviso do plano: teste acabando ou conta só leitura -->
      <div
        v-if="(somenteLeitura || trialAcabando) && route.name !== 'assinatura'"
        class="aviso-plano"
        :class="{ 'aviso-plano--bloqueio': somenteLeitura }"
      >
        <q-icon :name="somenteLeitura ? 'lock' : 'hourglass_bottom'" size="20px" />
        <span class="aviso-plano__texto">{{ assinatura?.situacao.mensagem }}</span>
        <q-btn unelevated dense no-caps color="primary" label="Ver plano" to="/app/assinatura" />
      </div>
      <div v-if="pessoaDaVisao" class="aviso-visao">
        <q-icon name="person" size="20px" />
        <span class="aviso-visao__texto">
          Você está vendo só as finanças de <strong>{{ pessoaDaVisao.nome }}</strong>. Elas não somam com as suas.
        </span>
        <q-btn unelevated dense no-caps color="primary" label="Voltar para as minhas" @click="visao = VISAO_EU" />
      </div>
      <AvisoVersaoApp />
      <router-view />
    </q-page-container>

    <q-dialog v-model="mostrarBloqueio">
      <q-card class="bloqueio">
        <q-card-section class="bloqueio__topo">
          <div class="bloqueio__icone"><q-icon name="workspace_premium" /></div>
          <h2>Assine o Pro para continuar lançando</h2>
          <p>{{ assinatura?.situacao.mensagem ?? "Seu teste grátis terminou." }}</p>
        </q-card-section>
        <q-card-section>
          <ul class="bloqueio__lista">
            <li v-for="r in RECURSOS_PRO.slice(0, 4)" :key="r.texto"><q-icon name="check_circle" /> {{ r.texto }}</li>
          </ul>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat no-caps label="Agora não" />
          <q-btn v-close-popup unelevated no-caps color="primary" label="Ver planos" to="/app/assinatura" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <FeedbackDialog v-model="showFeedback" />

    <q-footer class="mf-footer">
      <span>&copy; {{ new Date().getFullYear() }} Senior AI</span>
      <a href="https://www.dimitech.com.br/" target="_blank" rel="noopener noreferrer">
        Powered by DimiTech
      </a>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useQuasar } from "quasar";
import { useAuth } from "src/composables/useAuth";
import FeedbackDialog from "src/components/FeedbackDialog.vue";
import BaixarAppAndroid from "src/components/BaixarAppAndroid.vue";
import AvisoVersaoApp from "src/components/AvisoVersaoApp.vue";
import { aplicarTema, lerPreferenciaTema, type PreferenciaTema } from "src/boot/tema";
import { usePerfil } from "src/composables/usePerfil";
import { useAssinatura } from "src/composables/useAssinatura";
import { RECURSOS_PRO } from "src/services/assinaturaService";

const { logout, user, initAuth } = useAuth();
const $q = useQuasar();
const route = useRoute();

const leftDrawerOpen = ref(false);

const miniMode = ref(false);
const mini = computed(() => miniMode.value && $q.screen.gt.sm);

// Tema claro/escuro/sistema (aplicado já no boot).
const OPCOES_TEMA: { valor: PreferenciaTema; rotulo: string; icone: string }[] = [
  { valor: "sistema", rotulo: "Igual ao sistema", icone: "brightness_auto" },
  { valor: "claro", rotulo: "Claro", icone: "light_mode" },
  { valor: "escuro", rotulo: "Escuro", icone: "dark_mode" },
];
const tema = ref<PreferenciaTema>(lerPreferenciaTema());
const iconeTema = computed(() => OPCOES_TEMA.find((t) => t.valor === tema.value)!.icone);
function escolherTema(valor: PreferenciaTema) {
  tema.value = valor;
  aplicarTema(valor);
}

// Perfil + cartão de saldo ocupam muito em tela baixa ou no celular: começam
// recolhidos ali, e a escolha do usuário fica guardada neste navegador.
const CHAVE_RESUMO = "sa.menuResumo";
function lerResumo() {
  try {
    const salvo = localStorage.getItem(CHAVE_RESUMO);
    if (salvo !== null) return salvo === "1";
  } catch {
    // sem armazenamento: usa o padrão da tela
  }
  return $q.screen.gt.sm && window.innerHeight >= 820;
}
const resumoAberto = ref(lerResumo());
function alternarResumo() {
  resumoAberto.value = !resumoAberto.value;
  try {
    localStorage.setItem(CHAVE_RESUMO, resumoAberto.value ? "1" : "0");
  } catch {
    // ignora
  }
}
/** No celular o menu fica por cima da página: fecha ao escolher um destino. */
function fecharNoCelular() {
  if ($q.screen.lt.md) leftDrawerOpen.value = false;
}
const { isAdmin, nomePerfil, carregar: carregarPerfil } = usePerfil();
const {
  dados: assinatura,
  somenteLeitura,
  trialAcabando,
  mostrarBloqueio,
  carregar: carregarAssinatura,
} = useAssinatura();

interface ItemMenu {
  to: string;
  icon: string;
  label: string;
  badge?: number | undefined;
  badgeCor?: string;
}

const secoes = computed<{ titulo: string; itens: ItemMenu[]; admin?: boolean }[]>(() => [
  {
    titulo: "Principal",
    itens: [
      { to: "/app/dashboard", icon: "space_dashboard", label: "Visão geral" },
      { to: "/app/reunioes", icon: "groups", label: "Reuniões" },
    ],
  },
  {
    titulo: "Administração",
    admin: true,
    itens: [
      { to: "/app/admin", icon: "admin_panel_settings", label: "Painel admin" },
      { to: "/app/admin/vendas", icon: "point_of_sale", label: "Vendas" },
      { to: "/app/admin/usuarios", icon: "manage_accounts", label: "Usuários" },
      { to: "/app/admin/feedbacks", icon: "forum", label: "Feedbacks" },
    ],
  },
  {
    titulo: "Conta",
    itens: [
      { to: "/app/assinatura", icon: "workspace_premium", label: "Meu plano" },
      { to: "/app/meus-feedbacks", icon: "forum", label: "Meus feedbacks" },
      { to: "/app/configuracoes/alterar-senha", icon: "lock", label: "Alterar senha" },
    ],
  },
]);
const secoesVisiveis = computed(() => secoes.value.filter((s) => !s.admin || isAdmin.value));

const paginaAtual = computed(() => {
  // O item de caminho mais longo vence (/app/admin/usuarios antes de /app/admin).
  const item = secoes.value
    .flatMap((s) => s.itens)
    .filter((i) => route.path === i.to || route.path.startsWith(`${i.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0];
  return item ?? { icon: "space_dashboard", label: "Senior AI" };
});

const emailUsuario = computed(() => String((user.value as any)?.email ?? ""));
const showFeedback = ref(false);

const displayUserName = computed(() => {
  const currentUser = user.value as Record<string, unknown> | null;
  if (!currentUser) return "";

  const rawName = String(
    currentUser.nome ||
      currentUser.name ||
      currentUser.usuario ||
      currentUser.email ||
      "",
  ).trim();

  if (!rawName) return "";
  return rawName;
});

const iniciais = computed(
  () =>
    displayUserName.value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join("") || "?",
);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

onMounted(async () => {
  initAuth();
  void carregarAssinatura();
  await carregarPerfil();
});
</script>

<style scoped>
.mf-layout {
  background: var(--mf-bg);
}

.aviso-plano {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 16px 24px 0;
  padding: 10px 14px;
  border-radius: 14px;
  background: var(--mf-warning-soft);
  color: var(--mf-text);
  border: 1px solid color-mix(in srgb, var(--mf-warning) 35%, transparent);
}
.aviso-plano .q-icon {
  color: var(--mf-warning);
}
.aviso-plano--bloqueio {
  background: var(--mf-expense-soft);
  border-color: color-mix(in srgb, var(--mf-expense) 35%, transparent);
}
.aviso-plano--bloqueio .q-icon {
  color: var(--mf-expense);
}
.aviso-plano__texto {
  flex: 1;
  font-weight: 500;
}
@media (max-width: 600px) {
  .aviso-plano {
    margin: 12px 12px 0;
    flex-wrap: wrap;
  }
}

.bloqueio {
  width: 440px;
  max-width: 92vw;
  border-radius: var(--mf-radius);
}
.bloqueio__topo {
  text-align: center;
}
.bloqueio__topo h2 {
  margin: 12px 0 6px;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.3;
}
.bloqueio__topo p {
  margin: 0;
  color: var(--mf-text-muted);
}
.bloqueio__icone {
  display: inline-grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--mf-primary-soft);
  color: var(--mf-primary);
  font-size: 30px;
}
.bloqueio__lista {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
}
.bloqueio__lista li {
  display: flex;
  gap: 8px;
}
.bloqueio__lista .q-icon {
  color: var(--mf-income);
  font-size: 1.2rem;
}

.mf-header {
  background: color-mix(in srgb, var(--mf-bg) 85%, transparent);
  backdrop-filter: blur(12px);
  color: var(--mf-text);
  border-bottom: 1px solid var(--mf-border);
}

.mf-toolbar {
  min-height: 64px;
  gap: 8px;
  padding: 0 clamp(12px, 2.5vw, 24px);
}

.mf-toolbar__titulo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 1.05rem;
}

.mf-toolbar__titulo .q-icon {
  color: var(--mf-primary);
}

.mf-toolbar-btn {
  border-radius: 12px;
  font-weight: 600;
}

.avatar-gradiente {
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;
  background: linear-gradient(135deg, #2457f5, #8b5cf6);
}

.user-menu-list {
  min-width: 220px;
}

/* ---------- Menu lateral ---------- */
/* O q-drawer aplica a classe no .q-drawer__content, fora do alcance do scoped. */
:global(.q-drawer__content.mf-drawer) {
  background: linear-gradient(180deg, #0b1630 0%, #102a63 55%, #1b3f8f 100%);
  color: #dfe7ff;
}

.drawer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px 12px;
}

.brand__logo {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 24px;
  color: #fff;
  background: linear-gradient(135deg, #5b83ff, #8b5cf6);
  box-shadow: 0 8px 20px rgba(91, 131, 255, 0.35);
}

.brand__texto {
  flex: 1;
  min-width: 0;
}

.brand__title {
  font-weight: 800;
  font-size: 1.15rem;
  color: #fff;
}

.brand__subtitle {
  font-size: 0.75rem;
  opacity: 0.7;
}

.brand__recolher {
  color: #dfe7ff;
  background: rgba(255, 255, 255, 0.08);
}

.perfil {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 4px 16px 12px;
}

.perfil__texto {
  flex: 1;
  min-width: 0;
}

.aviso-visao {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin: 16px 24px 0;
  padding: 10px 14px;
  border-radius: 14px;
  background: var(--mf-warning-soft);
  color: var(--mf-text);
}

.aviso-visao__texto {
  flex: 1;
  min-width: 200px;
}

.resumo-compacto {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 16px 10px;
  padding: 8px 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.resumo-compacto__texto {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  color: #fff;
  text-decoration: none;
  line-height: 1.2;
}

.resumo-compacto__rotulo {
  font-size: 0.72rem;
  color: #b9c6e6;
}

.cta--compacto .cta__btn {
  min-height: 36px;
  box-shadow: none;
}

.perfil__nome {
  font-weight: 700;
  color: #fff;
}

.perfil__papel {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.12);
  color: #dfe7ff;
}

.perfil__papel--admin {
  background: linear-gradient(135deg, #5b83ff, #8b5cf6);
  color: #fff;
}

.chip-perfil {
  margin-left: 0;
  background: var(--mf-surface-alt);
  color: var(--mf-text-muted);
  font-weight: 700;
}

.chip-perfil--admin {
  background: var(--mf-primary-soft);
  color: var(--mf-primary);
}

.perfil__email {
  font-size: 0.78rem;
  opacity: 0.7;
}

.cta {
  padding: 0 16px 8px;
}

.cta__btn {
  border-radius: 14px;
  min-height: 44px;
  background: linear-gradient(135deg, #2457f5, #5b83ff) !important;
  box-shadow: 0 8px 18px rgba(36, 87, 245, 0.35);
}

.drawer__menu {
  flex: 1;
}

.secao {
  padding: 14px 24px 6px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.55;
}

.menu__item {
  margin: 2px 12px;
  border-radius: 12px;
  min-height: 44px;
  color: #c9d5f5;
  font-weight: 600;
}

.menu__item :deep(.q-item__section--avatar) {
  min-width: 36px;
}

.menu__item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.menu__item--ativo {
  color: #fff;
  background: rgba(91, 131, 255, 0.28);
  box-shadow: inset 3px 0 0 #8fb0ff;
}

.drawer__rodape {
  padding: 8px 0 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* ---------- Rodapé da página ---------- */
.mf-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px clamp(12px, 2.5vw, 24px);
  background: transparent;
  color: var(--mf-text-muted);
  font-size: 0.8rem;
}

.mf-footer a {
  color: inherit;
  text-decoration: none;
}

.mf-footer a:hover {
  text-decoration: underline;
}

.feedback-card {
  width: min(560px, 92vw);
  border-radius: var(--mf-radius);
}
</style>
