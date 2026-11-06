<template>
  <q-page class="mf-page senha-page">
    <header class="mf-page-header">
      <div>
        <div class="kicker"><q-icon name="shield" /> Segurança da conta</div>
        <h1 class="mf-title">Alterar senha</h1>
        <p class="mf-subtitle">Troque sua senha sempre que achar que ela pode ter sido exposta.</p>
      </div>
    </header>

    <div class="grade">
      <!-- Formulário -->
      <section class="mf-card form">
        <div class="form__topo">
          <div class="form__icone"><q-icon name="lock_reset" /></div>
          <div>
            <h2 class="mf-section-title">Nova senha</h2>
            <span class="mf-muted">Informe a senha atual e escolha uma nova</span>
          </div>
        </div>

        <q-form ref="formRef" class="form__campos" @submit.prevent="salvar">
          <CampoSenha
            v-model="form.senhaAtual"
            label="Senha atual"
            icone="lock"
            outlined
            autocomplete="current-password"
            :error="!!erroAtual"
            :error-message="erroAtual"
            @update:model-value="erroAtual = ''"
          />

          <q-separator class="q-my-xs" />

          <CampoSenha
            v-model="form.novaSenha"
            label="Nova senha"
            icone="key"
            outlined
            autocomplete="new-password"
            :error="!!form.novaSenha && form.novaSenha === form.senhaAtual"
            error-message="A nova senha precisa ser diferente da atual"
          />

          <!-- Força da senha -->
          <div class="forca" :class="`forca--${forca.nivel}`">
            <div class="forca__barras">
              <span v-for="i in 4" :key="i" :class="{ 'forca__barra--ativa': i <= forca.pontos }" class="forca__barra" />
            </div>
            <span class="forca__rotulo">{{ form.novaSenha ? forca.rotulo : "Digite a nova senha" }}</span>
          </div>

          <ul class="requisitos">
            <li v-for="r in requisitos" :key="r.texto" :class="{ 'requisitos__item--ok': r.ok }" class="requisitos__item">
              <q-icon :name="r.ok ? 'check_circle' : 'radio_button_unchecked'" />
              {{ r.texto }}
            </li>
          </ul>

          <CampoSenha
            v-model="form.confirmarSenha"
            label="Confirmar nova senha"
            icone="verified_user"
            outlined
            autocomplete="new-password"
            :error="!!form.confirmarSenha && form.confirmarSenha !== form.novaSenha"
            error-message="As senhas não conferem"
          >
          </CampoSenha>
          <div v-if="form.confirmarSenha && form.confirmarSenha === form.novaSenha" class="confere">
            <q-icon name="check_circle" /> As senhas conferem
          </div>

          <div class="form__acoes">
            <q-btn flat no-caps label="Limpar" :disable="salvando" @click="limpar" />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              icon="check"
              label="Salvar nova senha"
              :loading="salvando"
              :disable="!podeSalvar"
            />
          </div>
        </q-form>
      </section>

      <!-- Lateral -->
      <aside class="lateral">
        <section class="mf-card conta">
          <q-avatar size="56px" class="conta__avatar">{{ iniciais }}</q-avatar>
          <div class="conta__texto">
            <strong class="ellipsis">{{ nome || "Sua conta" }}</strong>
            <span class="mf-muted ellipsis">{{ email }}</span>
            <q-chip dense square icon="badge" class="conta__perfil">{{ nomePerfil }}</q-chip>
          </div>
        </section>

        <section class="mf-card dicas">
          <h3 class="dicas__titulo"><q-icon name="tips_and_updates" /> Dicas para uma senha segura</h3>
          <ul>
            <li><q-icon name="check" /> Use uma frase curta e fácil de lembrar, misturando números e símbolos.</li>
            <li><q-icon name="check" /> Não repita a senha de e-mail, banco ou redes sociais.</li>
            <li><q-icon name="check" /> Evite datas, nomes e sequências como 123456.</li>
            <li><q-icon name="check" /> Considere usar um gerenciador de senhas.</li>
          </ul>
        </section>
      </aside>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { senhaService } from "src/services/senhaService";
import { passwordChecks } from "src/domain/password";
import { computed, ref } from "vue";
import type { QForm } from "quasar";

import CampoSenha from "src/components/CampoSenha.vue";
import { extractApiErrorMessage } from "src/boot/axios";
import { useAuth } from "src/composables/useAuth";
import { useNotify } from "src/composables/UseNotify";
import { usePerfil } from "src/composables/usePerfil";

const { user } = useAuth();
const { nomePerfil } = usePerfil();
const { notifySuccess, notifyErrorWait } = useNotify();

const formRef = ref<QForm | null>(null);
const form = ref({ senhaAtual: "", novaSenha: "", confirmarSenha: "" });
const salvando = ref(false);
const erroAtual = ref("");

const nome = computed(() => String((user.value as { nome?: string } | null)?.nome ?? ""));
const email = computed(() => String((user.value as { email?: string } | null)?.email ?? ""));
const iniciais = computed(
  () =>
    nome.value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join("") || "?",
);

// Mesmas regras da API (passwordSecurity no servidor).
const requisitos = computed(() => {
  const s = form.value.novaSenha;
  const checks = passwordChecks(s);
  return [
    { texto: "Pelo menos 12 caracteres, dentro do tamanho máximo", ok: checks.minLength },
    { texto: "Uma letra", ok: /[A-Za-z]/.test(s) },
    { texto: "Um número", ok: /\d/.test(s) },
    { texto: "Um símbolo (ex.: ! @ # $ %)", ok: /[^A-Za-z0-9]/.test(s) },
  ];
});
const atendeRegras = computed(() => requisitos.value.every((r) => r.ok));

const forca = computed(() => {
  const s = form.value.novaSenha;
  let pontos = requisitos.value.filter((r) => r.ok).length;
  if (s.length >= 12 && pontos === 4) pontos = 4;
  else if (pontos === 4) pontos = 3;
  const niveis = [
    { nivel: "vazia", rotulo: "" },
    { nivel: "fraca", rotulo: "Fraca" },
    { nivel: "fraca", rotulo: "Fraca" },
    { nivel: "media", rotulo: atendeRegras.value ? "Boa — com 10+ caracteres fica forte" : "Média" },
    { nivel: "forte", rotulo: "Forte" },
  ];
  return { pontos, ...niveis[pontos]! };
});

const podeSalvar = computed(
  () =>
    !!form.value.senhaAtual &&
    atendeRegras.value &&
    form.value.novaSenha !== form.value.senhaAtual &&
    form.value.novaSenha === form.value.confirmarSenha,
);

function limpar() {
  form.value = { senhaAtual: "", novaSenha: "", confirmarSenha: "" };
  erroAtual.value = "";
  formRef.value?.resetValidation();
}

async function salvar() {
  if (!podeSalvar.value) return;
  salvando.value = true;
  try {
    await senhaService.alterar({ ...form.value });
    notifySuccess("Senha alterada com sucesso");
    limpar();
    window.location.assign("/login");
  } catch (e) {
    const mensagem = extractApiErrorMessage(e);
    if (/senha atual/i.test(mensagem)) erroAtual.value = "Senha atual incorreta";
    else notifyErrorWait(mensagem);
  } finally {
    salvando.value = false;
  }
}
</script>

<style scoped>
.senha-page {
  max-width: 1100px;
}

.kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--mf-primary);
  margin-bottom: 4px;
}

.grade {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 1fr);
  gap: 20px;
  align-items: start;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
}

.form__topo {
  display: flex;
  align-items: center;
  gap: 14px;
}

.form__icone {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 26px;
  color: #fff;
  background: linear-gradient(135deg, #2457f5, #8b5cf6);
  box-shadow: 0 8px 18px rgba(36, 87, 245, 0.25);
}

.form__campos {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form__acoes {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.forca {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: -4px;
}

.forca__barras {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  flex: 1;
}

.forca__barra {
  height: 6px;
  border-radius: 999px;
  background: var(--mf-surface-alt);
  transition: background 0.2s;
}

.forca--fraca .forca__barra--ativa {
  background: var(--mf-expense);
}

.forca--media .forca__barra--ativa {
  background: var(--mf-warning);
}

.forca--forte .forca__barra--ativa {
  background: var(--mf-income);
}

.forca__rotulo {
  min-width: 120px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--mf-text-muted);
}

.forca--fraca .forca__rotulo {
  color: var(--mf-expense);
}

.forca--media .forca__rotulo {
  color: var(--mf-warning);
}

.forca--forte .forca__rotulo {
  color: var(--mf-income);
}

.requisitos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 16px;
  margin: 0;
  padding: 12px 14px;
  list-style: none;
  border-radius: 14px;
  background: var(--mf-surface-alt);
}

.requisitos__item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--mf-text-muted);
  transition: color 0.2s;
}

.requisitos__item--ok {
  color: var(--mf-income);
  font-weight: 600;
}

.confere {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: -6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--mf-income);
}

.lateral {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.conta {
  display: flex;
  align-items: center;
  gap: 14px;
}

.conta__avatar {
  flex: none;
  color: #fff;
  font-weight: 800;
  background: linear-gradient(135deg, #2457f5, #8b5cf6);
}

.conta__texto {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.conta__perfil {
  align-self: flex-start;
  margin: 4px 0 0;
  background: var(--mf-primary-soft);
  color: var(--mf-primary);
}

.dicas__titulo {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  font-size: 1rem;
  font-weight: 700;
}

.dicas ul {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.88rem;
  color: var(--mf-text-muted);
}

.dicas li {
  display: flex;
  gap: 8px;
}

.dicas li .q-icon {
  margin-top: 2px;
  color: var(--mf-income);
}

@media (max-width: 860px) {
  .grade {
    grid-template-columns: 1fr;
  }

  .requisitos {
    grid-template-columns: 1fr;
  }
}
</style>
