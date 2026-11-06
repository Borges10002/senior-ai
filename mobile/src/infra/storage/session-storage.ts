import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { Sessao } from "@/domain/models";

const CHAVE = "seniorai.sessao";

// Na web, tokens ficam só em memória até fechar/recarregar a página.
const web = Platform.OS === "web";
let sessaoWeb: Sessao | null = null;

export async function carregarSessao(): Promise<Sessao | null> {
  try {
    if (web) {
      globalThis.localStorage?.removeItem(CHAVE);
      return sessaoWeb;
    }
    const bruto = await SecureStore.getItemAsync(CHAVE);
    if (!bruto) return null;
    const sessao = JSON.parse(bruto) as Sessao;
    if (!sessao || typeof sessao.token !== "string" || !sessao.token ||
        typeof sessao.refreshToken !== "string" || !sessao.refreshToken ||
        !Number.isSafeInteger(sessao.user?.codigo) || typeof sessao.user?.nivelAcesso !== "number") {
      await limparSessao();
      return null;
    }
    return sessao;
  } catch {
    return null;
  }
}

export async function salvarSessao(sessao: Sessao): Promise<void> {
  const bruto = JSON.stringify(sessao);
  if (web) {
    globalThis.localStorage?.removeItem(CHAVE);
    sessaoWeb = sessao;
  } else await SecureStore.setItemAsync(CHAVE, bruto, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function limparSessao(): Promise<void> {
  if (web) {
    sessaoWeb = null;
    globalThis.localStorage?.removeItem(CHAVE);
  }
  else await SecureStore.deleteItemAsync(CHAVE);
}
