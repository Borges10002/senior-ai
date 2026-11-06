import { ref } from "vue";

import { lerVersaoApp, type VersaoApp } from "src/domain/versao";

// Publicado junto com o site (web/public): edite a cada APK novo.
const ARQUIVO = "/app-versao.json";

const versaoApp = ref<VersaoApp | null>(null);
let carregamento: Promise<VersaoApp | null> | null = null;

/** Última versão do app Android, buscada uma vez por carregamento da página. */
export function useVersaoApp() {
  if (!carregamento) {
    carregamento = fetch(`${ARQUIVO}?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((dados) => (versaoApp.value = lerVersaoApp(dados)))
      .catch(() => null);
  }
  return { versaoApp, carregamento };
}
