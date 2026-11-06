import { Dark } from "quasar";
import { defineBoot } from "#q-app/wrappers";

export type PreferenciaTema = "sistema" | "claro" | "escuro";
const CHAVE = "mf.tema";

export function lerPreferenciaTema(): PreferenciaTema {
  try {
    const salvo = localStorage.getItem(CHAVE);
    return salvo === "claro" || salvo === "escuro" ? salvo : "sistema";
  } catch {
    return "sistema";
  }
}

/** Aplica e guarda o tema: claro, escuro ou o do sistema. */
export function aplicarTema(tema: PreferenciaTema) {
  Dark.set(tema === "sistema" ? "auto" : tema === "escuro");
  try {
    localStorage.setItem(CHAVE, tema);
  } catch {
    // sem armazenamento: vale só nesta visita
  }
}

// Antes da primeira tela, para não piscar o tema errado.
export default defineBoot(() => {
  Dark.set(((t) => (t === "sistema" ? "auto" : t === "escuro"))(lerPreferenciaTema()));
});
