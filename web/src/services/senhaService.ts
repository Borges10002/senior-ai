import { api, publicApi } from "src/boot/axios";
import { clearSession } from "src/services/session";

/** Esqueci minha senha: pedir o link por e-mail e trocar a senha com ele (sem login). */
export const senhaService = {
  async alterar(dados: { senhaAtual: string; novaSenha: string; confirmarSenha: string }): Promise<void> {
    await api.put("/usuarios/alterar-senha", dados);
    clearSession();
  },
  async esqueci(email: string): Promise<string> {
    const { data } = await publicApi.post<{ message: string }>("/senha/esqueci", { email });
    return data.message;
  },

  async redefinir(token: string, senha: string): Promise<string> {
    const { data } = await publicApi.post<{ message: string }>("/senha/redefinir", { token, senha });
    clearSession();
    return data.message;
  },
};
