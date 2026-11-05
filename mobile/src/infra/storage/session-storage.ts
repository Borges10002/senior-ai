import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { sessaoValida, type Sessao } from "@/domain/models";

const CHAVE = "seniorai.sessao";

// Na web os tokens ficam só em memória; no celular, no SecureStore (Keystore/Keychain).
const web = Platform.OS === "web";
let sessaoWeb: Sessao | null = null;

export async function carregarSessao(): Promise<Sessao | null> {
  if (web) return sessaoWeb;
  try {
    const bruto = await SecureStore.getItemAsync(CHAVE);
    const sessao = bruto ? JSON.parse(bruto) : null;
    if (sessaoValida(sessao)) return sessao;
    if (bruto) await limparSessao();
    return null;
  } catch {
    return null;
  }
}

export async function salvarSessao(sessao: Sessao): Promise<void> {
  if (web) {
    sessaoWeb = sessao;
    return;
  }
  await SecureStore.setItemAsync(CHAVE, JSON.stringify(sessao), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function limparSessao(): Promise<void> {
  if (web) {
    sessaoWeb = null;
    return;
  }
  await SecureStore.deleteItemAsync(CHAVE);
}
