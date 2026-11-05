import { ref } from "vue";
import type { Usuario } from "src/domain/models";

/**
 * Access token só em memória. O refresh token fica no sessionStorage (some ao fechar a aba).
 * Antes de produção: migrar o refresh para cookie httpOnly, como no MyFinances.
 */
const CHAVE_REFRESH = "senior-ai:refresh";

export const sessionUser = ref<Usuario | null>(null);
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  try {
    return sessionStorage.getItem(CHAVE_REFRESH);
  } catch {
    return null;
  }
}

export function setSession(dados: { accessToken: string; refreshToken: string; usuario: Usuario }): void {
  accessToken = dados.accessToken;
  sessionUser.value = dados.usuario;
  try {
    sessionStorage.setItem(CHAVE_REFRESH, dados.refreshToken);
  } catch {
    // Navegador sem storage: a sessão dura até recarregar a página.
  }
}

export function clearSession(): void {
  accessToken = null;
  sessionUser.value = null;
  try {
    sessionStorage.removeItem(CHAVE_REFRESH);
  } catch {
    // ignora
  }
}
