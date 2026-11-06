<template>
  <q-page class="mf-page painel-fb">
    <header class="mf-page-header">
      <div>
        <h1 class="mf-title">Feedbacks</h1>
        <p class="mf-subtitle">Sugestões, erros e dúvidas dos usuários. Mova cada um entre Aberto, Em andamento e Concluído.</p>
      </div>
      <q-btn flat no-caps icon="refresh" label="Atualizar" :loading="carregando" @click="carregar" />
    </header>

    <q-banner v-if="semPermissao" rounded class="bg-orange-1 text-orange-10">
      Esta área é restrita a administradores. Peça a um administrador para alterar
      seu perfil em Administração → Usuários.
    </q-banner>

    <template v-else>
      <!-- Filtros -->
      <section class="mf-card filtros">
        <q-input v-model="busca" dense outlined clearable placeholder="Buscar por título, mensagem, usuário ou página" class="filtros__busca">
          <template #prepend><q-icon name="search" /></template>
        </q-input>
        <div class="filtros__tipos">
          <q-chip
            v-for="t in tiposFiltro"
            :key="t.valor"
            clickable
            :outline="filtroTipo !== t.valor"
            :icon="t.icone"
            :style="filtroTipo === t.valor ? { background: t.fundo, color: t.cor } : {}"
            @click="filtroTipo = t.valor"
          >
            {{ t.rotulo }} · {{ contagemTipo(t.valor) }}
          </q-chip>
        </div>
      </section>

      <q-linear-progress v-if="carregando" indeterminate color="primary" />

      <!-- Quadro -->
      <section class="quadro">
        <div
          v-for="coluna in colunas"
          :key="coluna.valor"
          class="coluna"
          :class="{ 'coluna--alvo': arrastandoSobre === coluna.valor }"
          @dragover.prevent="arrastandoSobre = coluna.valor"
          @dragleave="arrastandoSobre = null"
          @drop.prevent="soltar(coluna.valor)"
        >
          <header class="coluna__topo" :style="{ borderColor: coluna.cor }">
            <q-icon :name="coluna.icone" :style="{ color: coluna.cor }" />
            <strong>{{ coluna.rotulo }}</strong>
            <q-badge rounded :style="{ background: coluna.fundo, color: coluna.cor }" :label="porStatus(coluna.valor).length" />
          </header>

          <div v-if="!porStatus(coluna.valor).length" class="coluna__vazia">Nenhum feedback</div>

          <article
            v-for="f in porStatus(coluna.valor)"
            :key="f.id"
            class="cartao"
            draggable="true"
            @dragstart="arrastando = f"
            @dragend="arrastando = null"
            @click="abrir(f)"
          >
            <div class="cartao__topo">
              <q-chip dense square :icon="estiloTipo(f.tipo).icone" :style="{ background: estiloTipo(f.tipo).fundo, color: estiloTipo(f.tipo).cor }">
                {{ estiloTipo(f.tipo).rotulo }}
              </q-chip>
              <q-space />
              <q-icon v-if="f.resposta" name="mark_chat_read" class="text-primary"><q-tooltip>Respondido</q-tooltip></q-icon>
            </div>
            <strong class="cartao__titulo">{{ f.titulo }}</strong>
            <p class="cartao__mensagem">{{ f.mensagem }}</p>
            <div class="cartao__rodape mf-muted">
              <span class="ellipsis"><q-icon name="person" /> {{ f.usuario?.nome ?? "Usuário removido" }}</span>
              <span>{{ formatarDataHora(f.created_at) }}</span>
            </div>
            <div class="cartao__mover" @click.stop>
              <q-btn
                v-for="destino in colunas.filter((c) => c.valor !== (f.status || 'aberto'))"
                :key="destino.valor"
                flat
                dense
                no-caps
                size="sm"
                :icon="destino.icone"
                :label="destino.rotulo"
                :style="{ color: destino.cor }"
                @click="mudarStatus(f, destino.valor)"
              />
            </div>
          </article>
        </div>
      </section>
    </template>

    <!-- Detalhe / resposta -->
    <q-dialog v-model="detalhe.aberto">
      <q-card v-if="detalhe.feedback" class="detalhe">
        <q-card-section class="detalhe__topo">
          <q-chip dense square :icon="estiloTipo(detalhe.feedback.tipo).icone" :style="{ background: estiloTipo(detalhe.feedback.tipo).fundo, color: estiloTipo(detalhe.feedback.tipo).cor }">
            {{ estiloTipo(detalhe.feedback.tipo).rotulo }}
          </q-chip>
          <q-space />
          <q-btn v-close-popup flat round dense icon="close" aria-label="Fechar" />
        </q-card-section>

        <q-card-section class="detalhe__corpo">
          <h3 class="detalhe__titulo">{{ detalhe.feedback.titulo }}</h3>
          <p class="detalhe__mensagem">{{ detalhe.feedback.mensagem }}</p>
          <div class="detalhe__meta mf-muted">
            <span><q-icon name="person" /> {{ detalhe.feedback.usuario ? `${detalhe.feedback.usuario.nome} · ${detalhe.feedback.usuario.email}` : "Usuário removido" }}</span>
            <span><q-icon name="link" /> {{ detalhe.feedback.pagina }}</span>
            <span><q-icon name="schedule" /> {{ formatarDataHora(detalhe.feedback.created_at) }}</span>
          </div>

          <div class="detalhe__status">
            <span class="mf-muted">Status</span>
            <q-btn-toggle
              v-model="detalhe.status"
              no-caps
              unelevated
              spread
              toggle-color="primary"
              :options="colunas.map((c) => ({ label: c.rotulo, value: c.valor, icon: c.icone }))"
            />
          </div>

          <q-input
            v-model="detalhe.resposta"
            outlined
            autogrow
            type="textarea"
            label="Resposta para o usuário"
            hint="O usuário vê esta resposta em Meus feedbacks"
            maxlength="2000"
            counter
            input-style="min-height: 90px"
          />
          <div v-if="detalhe.feedback.respondido_em" class="mf-muted detalhe__respondido">
            Última resposta em {{ formatarDataHora(detalhe.feedback.respondido_em) }}
          </div>
        </q-card-section>

        <q-card-actions class="detalhe__acoes">
          <q-btn flat no-caps color="negative" icon="delete_outline" label="Excluir" @click="excluir(detalhe.feedback)" />
          <q-space />
          <q-btn v-close-popup flat no-caps label="Cancelar" />
          <q-btn unelevated no-caps color="primary" icon="check" label="Salvar" :loading="salvando" @click="salvarDetalhe" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useQuasar } from "quasar";

import { extractApiErrorMessage } from "src/boot/axios";
import { useNotify } from "src/composables/UseNotify";
import {
  estiloTipo,
  feedbackService,
  formatarDataHora,
  STATUS_FEEDBACK,
  TIPOS_FEEDBACK,
  type FeedbackAdmin,
  type StatusFeedback,
} from "src/services/feedbackService";

const $q = useQuasar();
const { notifySuccess, notifyErrorWait } = useNotify();

const feedbacks = ref<FeedbackAdmin[]>([]);
const carregando = ref(false);
const salvando = ref(false);
const semPermissao = ref(false);
const busca = ref<string | null>("");
const filtroTipo = ref("todos");
const arrastando = ref<FeedbackAdmin | null>(null);
const arrastandoSobre = ref<StatusFeedback | null>(null);

const colunas = (Object.keys(STATUS_FEEDBACK) as StatusFeedback[]).map((valor) => ({ valor, ...STATUS_FEEDBACK[valor] }));
const tiposFiltro = [
  { valor: "todos", rotulo: "Todos", icone: "forum", cor: "var(--mf-primary)", fundo: "var(--mf-primary-soft)" },
  ...Object.entries(TIPOS_FEEDBACK).map(([valor, t]) => ({ valor, rotulo: t.rotulo, icone: t.icone, cor: t.cor, fundo: t.fundo })),
];

const contagemTipo = (tipo: string) =>
  tipo === "todos" ? feedbacks.value.length : feedbacks.value.filter((f) => f.tipo === tipo).length;

const filtrados = computed(() => {
  const termo = (busca.value ?? "").trim().toLowerCase();
  return feedbacks.value.filter((f) => {
    if (filtroTipo.value !== "todos" && f.tipo !== filtroTipo.value) return false;
    if (!termo) return true;
    return [f.titulo, f.mensagem, f.pagina, f.usuario?.nome, f.usuario?.email, f.resposta]
      .filter(Boolean)
      .some((t) => String(t).toLowerCase().includes(termo));
  });
});
const porStatus = (status: StatusFeedback) => filtrados.value.filter((f) => (f.status || "aberto") === status);

async function carregar() {
  carregando.value = true;
  try {
    feedbacks.value = await feedbackService.listarTodos();
    semPermissao.value = false;
  } catch (e: any) {
    if (e?.response?.status === 403) semPermissao.value = true;
    else notifyErrorWait(extractApiErrorMessage(e));
  } finally {
    carregando.value = false;
  }
}

function aplicar(atualizado: Partial<FeedbackAdmin> & { id: string }) {
  const alvo = feedbacks.value.find((f) => f.id === atualizado.id);
  if (alvo) Object.assign(alvo, atualizado, { usuario: alvo.usuario });
}

async function mudarStatus(f: FeedbackAdmin, status: StatusFeedback) {
  if ((f.status || "aberto") === status) return;
  const anterior = f.status;
  f.status = status; // otimista: o cartão já muda de coluna
  try {
    aplicar({ ...(await feedbackService.atualizar(f.id, { status })), id: f.id });
    notifySuccess(`Movido para "${STATUS_FEEDBACK[status].rotulo}"`);
  } catch (e) {
    f.status = anterior;
    notifyErrorWait(extractApiErrorMessage(e));
  }
}

function soltar(status: StatusFeedback) {
  arrastandoSobre.value = null;
  if (arrastando.value) void mudarStatus(arrastando.value, status);
  arrastando.value = null;
}

// ---- Detalhe
const detalhe = ref<{ aberto: boolean; feedback: FeedbackAdmin | null; status: StatusFeedback; resposta: string }>({
  aberto: false,
  feedback: null,
  status: "aberto",
  resposta: "",
});

function abrir(f: FeedbackAdmin) {
  detalhe.value = { aberto: true, feedback: f, status: f.status || "aberto", resposta: f.resposta ?? "" };
}

async function salvarDetalhe() {
  const f = detalhe.value.feedback;
  if (!f) return;
  salvando.value = true;
  try {
    const atualizado = await feedbackService.atualizar(f.id, {
      status: detalhe.value.status,
      resposta: detalhe.value.resposta.trim() || null,
    });
    aplicar({ ...atualizado, id: f.id });
    notifySuccess("Feedback atualizado");
    detalhe.value.aberto = false;
  } catch (e) {
    notifyErrorWait(extractApiErrorMessage(e));
  } finally {
    salvando.value = false;
  }
}

function excluir(f: FeedbackAdmin) {
  $q.dialog({
    title: "Excluir feedback",
    message: `Excluir "${f.titulo}"? O usuário deixa de vê-lo em Meus feedbacks.`,
    cancel: { flat: true, noCaps: true, label: "Cancelar" },
    ok: { color: "negative", noCaps: true, label: "Excluir" },
  }).onOk(async () => {
    try {
      await feedbackService.excluir(f.id);
      feedbacks.value = feedbacks.value.filter((x) => x.id !== f.id);
      detalhe.value.aberto = false;
      notifySuccess("Feedback excluído");
    } catch (e) {
      notifyErrorWait(extractApiErrorMessage(e));
    }
  });
}

onMounted(carregar);
</script>

<style scoped>
.painel-fb {
  max-width: 1400px;
}

.filtros {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

.filtros__busca {
  flex: 1 1 320px;
}

.filtros__tipos {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.quadro {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}

.coluna {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 200px;
  padding: 12px;
  border-radius: var(--mf-radius);
  background: var(--mf-surface-alt);
  border: 2px dashed transparent;
  transition: border-color 0.15s, background 0.15s;
}

.coluna--alvo {
  border-color: var(--mf-primary);
  background: var(--mf-primary-soft);
}

.coluna__topo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 4px 10px;
  border-bottom: 3px solid;
}

.coluna__vazia {
  padding: 24px 8px;
  text-align: center;
  color: var(--mf-text-muted);
  font-size: 0.85rem;
}

.cartao {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--mf-border);
  background: var(--mf-surface);
  cursor: grab;
  transition: box-shadow 0.15s, transform 0.15s;
}

.cartao:hover {
  box-shadow: 0 6px 16px rgba(15, 27, 45, 0.08);
  transform: translateY(-1px);
}

.cartao__topo {
  display: flex;
  align-items: center;
}

.cartao__titulo {
  line-height: 1.3;
}

.cartao__mensagem {
  margin: 0;
  font-size: 0.85rem;
  color: var(--mf-text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cartao__rodape {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.75rem;
}

.cartao__mover {
  display: flex;
  gap: 4px;
  border-top: 1px solid var(--mf-border);
  padding-top: 6px;
}

.detalhe {
  width: min(680px, 96vw);
  max-width: 96vw;
  border-radius: 20px;
}

.detalhe__topo {
  display: flex;
  align-items: center;
  padding-bottom: 0;
}

.detalhe__corpo {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detalhe__titulo {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
}

.detalhe__mensagem {
  margin: 0;
  white-space: pre-wrap;
}

.detalhe__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  font-size: 0.85rem;
}

.detalhe__status {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detalhe__respondido {
  font-size: 0.8rem;
  margin-top: -8px;
}

.detalhe__acoes {
  border-top: 1px solid var(--mf-border);
  padding: 12px 16px;
}

@media (max-width: 960px) {
  .quadro {
    grid-template-columns: 1fr;
  }
}
</style>
