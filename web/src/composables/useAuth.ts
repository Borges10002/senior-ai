import { sessionUser, setSession } from "src/services/session";
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { publicApi, logoutSession } from "src/boot/axios";
import { useNotify } from "./UseNotify";
import { usePerfil } from "./usePerfil";
import type { LoginForm } from "src/services/models";
import { useQuasar } from "quasar";

const user = sessionUser;
const loading = ref(false);

type RegisterForm = {
  name: string;
  email: string;
  password: string;
};

export function useAuth() {
  const router = useRouter();
  const { notifySuccess } = useNotify();
  const $q = useQuasar();
  const perfil = usePerfil();

  const isAuthenticated = computed(() => !!user.value);

  const login = async (credentials: LoginForm) => {
    loading.value = true;
    try {
      const response = await publicApi.post("/sessions", credentials);

      if (response.data?.user) {
        setSession(response.data.user);

        const usuarioLogado = response.data.user || {};
        perfil.definir(usuarioLogado.perfil ?? null, Number(usuarioLogado.codigo) || undefined);

        notifySuccess("Login realizado com sucesso!");
        router.push("/app/dashboard");
      } else {
        $q.notify({
          type: "negative",
          message: "Resposta inválida do servidor",
        });
      }
    } catch (error: any) {
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const register = async (payload: RegisterForm) => {
    loading.value = true;
    try {
      const normalizedName = payload.name.trim();
      const username = (payload.email.split("@")[0] || "").trim().toUpperCase();

      await publicApi.post("/usuarios", {
        nome: normalizedName,
        usuario: username,
        senha: payload.password,
        email: payload.email.trim().toLowerCase(),
        cpf: "00000000000",
      });
      notifySuccess("Cadastro realizado com sucesso!");
    } catch (error: any) {
      const message = String(error?.response?.data?.message || "");
      if (message.toLowerCase().includes("token")) {
        error.message =
          "A API rejeitou o cadastro por autenticacao. Verifique se a rota de criar usuario e publica.";
      }
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    // Keep the session visible if the server could not revoke it, so the user can retry.
    await logoutSession();
    perfil.limpar();
    notifySuccess("Logout realizado com sucesso!");
    await router.push("/login");
  };

  const initAuth = () => { user.value = sessionUser.value; };

  return {
    user: computed(() => user.value),
    loading: computed(() => loading.value),
    isAuthenticated,
    login,
    register,
    logout,
    initAuth,
  };
}
