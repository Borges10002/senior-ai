import { useSyncExternalStore } from "react";

import {
  carregarPreferenciaTema,
  salvarPreferenciaTema,
  type PreferenciaTema,
} from "@/infra/storage/preferencias-storage";

// Escolha de tema compartilhada por todas as telas (sem provider).
let atual: PreferenciaTema = "sistema";
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((o) => o());

void carregarPreferenciaTema().then((salva) => {
  atual = salva;
  avisar();
});

export function definirPreferenciaTema(tema: PreferenciaTema) {
  atual = tema;
  avisar();
  void salvarPreferenciaTema(tema);
}

export function usePreferenciaTema(): PreferenciaTema {
  return useSyncExternalStore(
    (ouvinte) => {
      ouvintes.add(ouvinte);
      return () => ouvintes.delete(ouvinte);
    },
    () => atual,
    () => atual,
  );
}
