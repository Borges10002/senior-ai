<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" @hide="reiniciar">
    <q-card class="feedback">
      <header class="feedback__topo">
        <div class="feedback__icone"><q-icon name="campaign" /></div>
        <div>
          <div class="feedback__titulo">Fale com a gente</div>
          <div class="feedback__sub">Sugira uma melhoria, conte um erro ou tire uma dúvida</div>
        </div>
        <q-space />
        <q-btn v-close-popup flat round dense icon="close" color="white" aria-label="Fechar" />
      </header>

      <!-- Enviado -->
      <q-card-section v-if="enviado" class="sucesso">
        <div class="sucesso__icone"><q-icon name="mark_email_read" /></div>
        <strong>Recebemos seu feedback!</strong>
        <span class="mf-muted">
          Você acompanha o andamento e a resposta em "Meus feedbacks".
        </span>
        <div class="row q-gutter-sm justify-center q-mt-md">
          <q-btn flat no-caps color="primary" label="Enviar outro" @click="reiniciar" />
          <q-btn v-close-popup unelevated no-caps color="primary" icon="forum" label="Ver meus feedbacks" to="/app/meus-feedbacks" />
        </div>
      </q-card-section>

      <!-- Formulário -->
      <q-card-section v-else class="feedback__corpo">
        <div class="tipos" role="radiogroup" aria-label="Tipo do feedback">
          <button
            v-for="(t, chave) in TIPOS_FEEDBACK"
            :key="chave"
            type="button"
            role="radio"
            :aria-checked="form.tipo === chave"
            class="tipo"
            :class="{ 'tipo--ativo': form.tipo === chave }"
            :style="form.tipo === chave ? { borderColor: t.cor, background: t.fundo } : {}"
            @click="form.tipo = chave"
          >
            <q-icon :name="t.icone" size="26px" :style="{ color: t.cor }" />
            <strong>{{ t.rotulo }}</strong>
            <span class="tipo__descricao">{{ t.descricao }}</span>
          </button>
        </div>

        <q-input
          v-model="form.titulo"
          outlined
          label="Título"
          :placeholder="placeholderTitulo"
          counter
          maxlength="120"
          :error="tocado && form.titulo.trim().length < 3"
          error-message="Escreva um título com pelo menos 3 caracteres"
        />

        <q-input
          v-model="form.mensagem"
          outlined
          autogrow
          type="textarea"
          label="Conte os detalhes"
          :placeholder="placeholderMensagem"
          counter
          maxlength="1000"
          input-style="min-height: 110px"
          :error="tocado && form.mensagem.trim().length < 10"
          error-message="Descreva com pelo menos 10 caracteres"
        />

        <div class="pagina">
          <q-icon name="link" />
          Enviado a partir de <code>{{ pagina }}</code>
        </div>
      </q-card-section>

      <q-card-actions v-if="!enviado" align="right" class="feedback__acoes">
        <q-btn v-close-popup flat no-caps label="Cancelar" />
        <q-btn unelevated no-caps color="primary" icon="send" label="Enviar" :loading="enviando" @click="enviar" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

import { extractApiErrorMessage } from "src/boot/axios";
import { useNotify } from "src/composables/UseNotify";
import { feedbackService, TIPOS_FEEDBACK, type TipoFeedback } from "src/services/feedbackService";

defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ "update:modelValue": [aberto: boolean] }>();

const route = useRoute();
const { notifyErrorWait } = useNotify();

const form = ref<{ tipo: TipoFeedback; titulo: string; mensagem: string }>({ tipo: "Sugestao", titulo: "", mensagem: "" });
const enviando = ref(false);
const enviado = ref(false);
const tocado = ref(false);
const pagina = computed(() => route.fullPath);

const placeholderTitulo = computed(
  () =>
    ({
      Sugestao: "Ex.: Poder anexar mais de uma foto",
      Erro: "Ex.: Erro ao salvar uma reunião",
      Duvida: "Ex.: Como funciona o mês de referência?",
    })[form.value.tipo],
);
const placeholderMensagem = computed(() =>
  form.value.tipo === "Erro"
    ? "O que você estava fazendo, o que esperava que acontecesse e o que aconteceu?"
    : "Escreva com suas palavras",
);

function reiniciar() {
  form.value = { tipo: "Sugestao", titulo: "", mensagem: "" };
  enviado.value = false;
  tocado.value = false;
}

async function enviar() {
  tocado.value = true;
  if (form.value.titulo.trim().length < 3 || form.value.mensagem.trim().length < 10) return;
  enviando.value = true;
  try {
    await feedbackService.enviar({
      tipo: form.value.tipo,
      titulo: form.value.titulo.trim(),
      mensagem: form.value.mensagem.trim(),
      pagina: pagina.value,
    });
    enviado.value = true;
  } catch (e) {
    notifyErrorWait(extractApiErrorMessage(e));
  } finally {
    enviando.value = false;
  }
}
</script>

<style scoped>
.feedback {
  width: min(620px, 96vw);
  max-width: 96vw;
  border-radius: 22px;
  overflow: hidden;
}

.feedback__topo {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  color: #fff;
  background: linear-gradient(135deg, #0b1630, #2457f5);
}

.feedback__icone {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 24px;
  background: rgba(255, 255, 255, 0.15);
}

.feedback__titulo {
  font-size: 1.2rem;
  font-weight: 800;
}

.feedback__sub {
  opacity: 0.85;
  font-size: 0.9rem;
}

.feedback__corpo {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
}

.feedback__acoes {
  padding: 12px 20px 16px;
  border-top: 1px solid var(--mf-border);
}

.tipos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.tipo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 10px;
  border: 2px solid var(--mf-border);
  border-radius: 16px;
  background: var(--mf-surface);
  font: inherit;
  color: var(--mf-text);
  cursor: pointer;
  text-align: center;
  transition: border-color 0.15s, background 0.15s, transform 0.15s;
}

.tipo:hover {
  transform: translateY(-1px);
}

.tipo__descricao {
  font-size: 0.75rem;
  color: var(--mf-text-muted);
  line-height: 1.25;
}

.pagina {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--mf-text-muted);
}

.pagina code {
  padding: 1px 6px;
  border-radius: 6px;
  background: var(--mf-surface-alt);
}

.sucesso {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 32px 24px;
  text-align: center;
}

.sucesso__icone {
  width: 64px;
  height: 64px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  font-size: 32px;
  color: var(--mf-income);
  background: var(--mf-income-soft);
  margin-bottom: 6px;
}

@media (max-width: 520px) {
  .tipos {
    grid-template-columns: 1fr;
  }

  .tipo {
    flex-direction: row;
    text-align: left;
  }
}
</style>
