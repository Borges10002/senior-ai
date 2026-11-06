<template>
  <q-page class="login-page flex flex-center">
    <div class="login-container">
        <q-card class="login-card" flat bordered>
          <q-card-section class="text-center q-pb-none">
            <div class="login-logo-shell">
              <div class="login-logo">
                <q-img
                  src="/icons/logo.svg"
                  alt="Senior AI"
                  fit="contain"
                  class="login-logo-image"
                />
              </div>
            </div>
            <div class="text-h4 text-weight-bold q-mt-md text-grey-8">
              Senior AI
            </div>
          <div class="text-subtitle2 text-grey-6 q-mb-lg">
            Faça login para continuar
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="handleLogin" class="login-form">
            <q-input
              v-model="form.email"
              label="Email"
              type="email"
              outlined
              class="q-mb-md"
              :rules="[(val) => !!val || 'Email é obrigatório']"
            >
              <template v-slot:prepend>
                <q-icon name="email" />
              </template>
            </q-input>

            <CampoSenha
              v-model="form.password"
              label="Senha"
              icone="lock"
              outlined
              class="q-mb-xs"
              :rules="[(val: string) => !!val || 'Senha é obrigatória']"
            />
            <div class="text-right q-mb-md">
              <q-btn flat dense no-caps size="sm" color="primary" label="Esqueci minha senha" @click="abrirEsqueci" />
            </div>

            <q-btn
              type="submit"
              label="Entrar"
              color="primary"
              size="lg"
              class="full-width q-py-sm"
              :loading="loading"
              no-caps
            />

            <q-btn
              flat
              no-caps
              color="primary"
              class="full-width q-mt-sm"
              label="Criar minha conta"
              @click="showRegister = true"
            />
          </q-form>
          <div class="login-form">
            <q-separator class="q-my-md" />
            <BaixarAppAndroid />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <q-dialog v-model="esqueci.aberto">
      <q-card class="esqueci-card">
        <q-card-section>
          <div class="text-h6 text-weight-bold">Esqueci minha senha</div>
          <div class="text-grey-7">Digite o e-mail da sua conta. Vamos enviar um link para você criar uma nova senha.</div>
        </q-card-section>
        <q-card-section v-if="esqueci.mensagem" class="q-pt-none">
          <q-banner rounded class="bg-green-1 text-green-10">
            <template #avatar><q-icon name="mark_email_read" /></template>
            {{ esqueci.mensagem }}
          </q-banner>
        </q-card-section>
        <q-card-section v-else class="q-pt-none">
          <q-form @submit="enviarEsqueci">
            <q-input
              v-model="esqueci.email"
              type="email"
              label="E-mail"
              outlined
              autofocus
              :rules="[(v: string) => /.+@.+\..+/.test(v) || 'Informe um e-mail válido']"
            >
              <template #prepend><q-icon name="email" /></template>
            </q-input>
            <q-btn type="submit" unelevated no-caps color="primary" class="full-width q-mt-sm" label="Enviar link" :loading="esqueci.enviando" />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat no-caps label="Fechar" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showRegister">
      <q-card class="register-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Criar conta</div>
          <q-space />
          <q-btn flat round dense icon="close" @click="showRegister = false" />
        </q-card-section>

        <q-card-section>
          <q-form @submit="handleRegister" class="q-gutter-md">
            <q-input
              v-model="registerForm.name"
              label="Nome"
              outlined
              :rules="[(val) => !!val || 'Nome e obrigatorio']"
            >
              <template #prepend>
                <q-icon name="person" />
              </template>
            </q-input>

            <q-input
              v-model="registerForm.email"
              label="Email"
              type="email"
              outlined
              :rules="[
                (val) => !!val || 'Email e obrigatorio',
                () => emailFormatValid || 'Digite um email valido',
              ]"
            >
              <template #prepend>
                <q-icon name="email" />
              </template>
            </q-input>

            <div v-if="registerForm.email" class="text-caption" :class="emailFeedbackClass">
              {{ emailFeedbackMessage }}
            </div>

            <CampoSenha
              v-model="registerForm.password"
              label="Senha"
              icone="lock"
              outlined
              :rules="[
                (val: string) => !!val || 'Senha e obrigatoria',
                () => passwordStrength.isStrong || 'Use uma senha forte',
              ]"
            />

            <div class="password-feedback q-mt-sm">
              <div
                :class="[
                  'password-strength',
                  passwordStrength.isStrong ? 'text-positive' : 'text-warning',
                ]"
              >
                Forca da senha: {{ passwordStrength.label }}
              </div>
              <div class="text-caption text-grey-7">
                A senha precisa ter no minimo 12 caracteres, letra, numero e caractere
                especial.
              </div>
            </div>

            <CampoSenha
              v-model="confirmPassword"
              label="Confirmar senha"
              icone="verified_user"
              outlined
              :rules="[
                (val: string) => !!val || 'Confirmacao obrigatoria',
                (val: string) => val === registerForm.password || 'As senhas devem ser iguais',
              ]"
            />

            <div class="row justify-end q-gutter-sm">
              <q-btn flat no-caps label="Cancelar" @click="showRegister = false" />
              <q-btn
                type="submit"
                color="primary"
                no-caps
                label="Cadastrar"
                :loading="loading"
                :disable="!canSubmitRegister"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useAuth } from "src/composables/useAuth";
import CampoSenha from "src/components/CampoSenha.vue";
import BaixarAppAndroid from "src/components/BaixarAppAndroid.vue";
import { extractApiErrorMessage } from "src/boot/axios";
import { senhaService } from "src/services/senhaService";
import { passwordChecks } from "src/domain/password";

import type { LoginForm } from "src/services/models";
import { useNotify } from "src/composables/UseNotify";

const { login, register, loading } = useAuth();
const { notifySuccess, notifyErrorWait } = useNotify();

const form = ref<LoginForm>({
  email: "",
  password: "",
});

const showRegister = ref(false);

// Esqueci minha senha: o link chega no e-mail cadastrado.
const esqueci = ref({ aberto: false, email: "", enviando: false, mensagem: "" });
function abrirEsqueci() {
  esqueci.value = { aberto: true, email: form.value.email ?? "", enviando: false, mensagem: "" };
}
async function enviarEsqueci() {
  esqueci.value.enviando = true;
  try {
    esqueci.value.mensagem = await senhaService.esqueci(esqueci.value.email.trim());
  } catch (e) {
    notifyErrorWait(extractApiErrorMessage(e));
  } finally {
    esqueci.value.enviando = false;
  }
}
const registerForm = ref({
  name: "",
  email: "",
  password: "",
});
const confirmPassword = ref("");
const emailFormatValid = computed(() => {
  const email = registerForm.value.email.trim();
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
});

const emailFeedbackMessage = computed(() => {
  if (!registerForm.value.email.trim()) return "";
  if (!emailFormatValid.value) return "Digite um email valido";
  return "Formato de email valido";
});

const emailFeedbackClass = computed(() => {
  if (!registerForm.value.email.trim() || !emailFormatValid.value) {
    return "text-negative";
  }
  return "text-positive";
});

const passwordStrength = computed(() => {
  const password = registerForm.value.password || "";
  const checks = passwordChecks(password);

  const score = Object.values(checks).filter(Boolean).length;

  if (score === 4) {
    return { label: "forte", isStrong: true };
  }

  if (score >= 2) {
    return { label: "media", isStrong: false };
  }

  return { label: "fraca", isStrong: false };
});

const canSubmitRegister = computed(() => {
  return (
    !!registerForm.value.name.trim() &&
    emailFormatValid.value &&
    passwordStrength.value.isStrong &&
    !!confirmPassword.value &&
    confirmPassword.value === registerForm.value.password
  );
});

const handleLogin = async () => {
  try {
    await login(form.value);
  } catch (error: any) {
    notifyErrorWait(error.response?.data?.message || "Erro ao fazer login");
  }
};

const resetRegisterForm = () => {
  registerForm.value = {
    name: "",
    email: "",
    password: "",
  };
  confirmPassword.value = "";
};

const handleRegister = async () => {
  try {
    if (!passwordStrength.value.isStrong) {
      notifyErrorWait(
        "Senha fraca. Use no minimo 12 caracteres, letra, numero e caractere especial",
      );
      return;
    }

    if (registerForm.value.password !== confirmPassword.value) {
      notifyErrorWait("As senhas devem ser iguais");
      return;
    }

    await register(registerForm.value);
    form.value.email = registerForm.value.email;
    form.value.password = registerForm.value.password;
    showRegister.value = false;
    resetRegisterForm();
    notifySuccess("Conta criada. Agora faca login.");
  } catch (error: any) {
    notifyErrorWait(error.response?.data?.message || "Erro ao cadastrar usuario");
  }
};
</script>

<style scoped>
.esqueci-card {
  width: min(420px, 94vw);
  border-radius: 20px;
}

.login-page {
  background:
    radial-gradient(circle at top, rgba(34, 211, 238, 0.18), transparent 30%),
    linear-gradient(135deg, #07111f 0%, #0f2745 48%, #0ea5e9 100%);
  min-height: 100vh;
  padding: 1rem;
}

.login-container {
  width: 100%;
  max-width: 28rem;
}

.login-card {
  border-radius: 1rem;
  box-shadow: 0 28px 60px -20px rgba(2, 8, 23, 0.42);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, #f4fbff 100%);
  border: 1px solid rgba(34, 211, 238, 0.18);
}

.register-card {
  width: min(460px, 92vw);
  border-radius: 0.75rem;
}

.password-feedback {
  margin-top: -0.25rem;
}

.password-strength {
  font-weight: 700;
  text-transform: capitalize;
}

.login-logo {
  position: relative;
  z-index: 1;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, #f8fdff 100%),
    linear-gradient(135deg, rgba(34, 211, 238, 0.18), rgba(37, 99, 235, 0.18));
  border-radius: 22px;
  width: 4.9rem;
  height: 4.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid transparent;
  box-shadow:
    0 10px 20px rgba(8, 47, 73, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.login-logo::before {
  content: "";
  position: absolute;
  inset: 0;
  padding: 1.5px;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.95), rgba(37, 99, 235, 0.8));
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.login-logo-shell {
  width: fit-content;
  margin: 0 auto;
}

.login-logo-image {
  width: 3.2rem;
  height: 3.2rem;
  filter: none;
}

.login-form {
  padding: 0 1.5rem;
}

.login-card :deep(.q-field--outlined .q-field__control) {
  border-radius: 14px;
}

.login-card :deep(.q-field__prepend) {
  color: #0ea5e9;
}

.login-card :deep(.q-btn.bg-primary) {
  background: linear-gradient(135deg, #0284c7 0%, #22d3ee 100%) !important;
  box-shadow: 0 16px 28px rgba(14, 165, 233, 0.22);
}

.login-card :deep(.q-btn.text-primary) {
  color: #0369a1 !important;
}

@media (max-width: 640px) {
  .login-container {
    max-width: 100%;
    padding: 0 1rem;
  }

  .login-card {
    margin: 0;
    border-radius: 0.5rem;
  }

  .login-form {
    padding: 0 1rem;
  }

  .login-logo {
    width: 4.2rem;
    height: 4.2rem;
  }

  .login-logo-image {
    width: 2.7rem;
    height: 2.7rem;
  }

  .register-card {
    width: calc(100vw - 16px);
    border-radius: 1rem;
  }
}

@media (max-width: 480px) {
  .login-page {
    padding: 0.5rem;
  }

  .login-form {
    padding: 0 0.75rem;
  }

  .text-h4 {
    font-size: 1.9rem;
  }
}
</style>
