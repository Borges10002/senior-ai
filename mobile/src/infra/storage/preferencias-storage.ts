import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type PreferenciaTema = "sistema" | "claro" | "escuro";

const CHAVE_TEMA = "senior-ai.tema";
const web = Platform.OS === "web";

export async function carregarPreferenciaTema(): Promise<PreferenciaTema> {
  try {
    const salvo = web ? globalThis.localStorage?.getItem(CHAVE_TEMA) : await SecureStore.getItemAsync(CHAVE_TEMA);
    return salvo === "claro" || salvo === "escuro" ? salvo : "sistema";
  } catch {
    return "sistema";
  }
}


export async function salvarPreferenciaTema(tema: PreferenciaTema): Promise<void> {
  try {
    if (web) globalThis.localStorage?.setItem(CHAVE_TEMA, tema);
    else await SecureStore.setItemAsync(CHAVE_TEMA, tema);
  } catch {
    // Sem armazenamento: a escolha vale só nesta sessão.
  }
}
