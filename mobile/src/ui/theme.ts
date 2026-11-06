import { useColorScheme } from "react-native";

import { usePreferenciaTema } from "./tema-preferencia";

const claro = {
  fundo: "#F4F6FB",
  superficie: "#FFFFFF",
  superficieAlt: "#EEF1F8",
  borda: "#E1E6F0",
  texto: "#0F1B2D",
  textoSecundario: "#5B6B82",
  primaria: "#2457F5",
  primariaSuave: "#E3EAFF",
  sobrePrimaria: "#FFFFFF",
  receita: "#0E9F6E",
  receitaSuave: "#DDF5EC",
  despesa: "#E5484D",
  despesaSuave: "#FDE7E8",
  alerta: "#D98E04",
  alertaSuave: "#FFF3D6",
};

const escuro: typeof claro = {
  fundo: "#0B111C",
  superficie: "#141C2B",
  superficieAlt: "#1B2538",
  borda: "#26324A",
  texto: "#EEF2FA",
  textoSecundario: "#97A3B8",
  primaria: "#5B83FF",
  primariaSuave: "#1C2A52",
  sobrePrimaria: "#FFFFFF",
  receita: "#34C98E",
  receitaSuave: "#123528",
  despesa: "#FF6B6F",
  despesaSuave: "#3D1A1C",
  alerta: "#F2B33D",
  alertaSuave: "#3A2D10",
};

export type Cores = typeof claro;

export const espaco = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const raio = { sm: 10, md: 14, lg: 20, pill: 999 };

/** Tema em uso: o que o usuário escolheu em Mais, ou o do sistema. */
export function useTema() {
  const sistema = useColorScheme();
  const preferencia = usePreferenciaTema();
  const ehEscuro = preferencia === "sistema" ? sistema === "dark" : preferencia === "escuro";
  return { cores: ehEscuro ? escuro : claro, escuro: ehEscuro };
}

/** Cor para um tipo de lançamento. */
export function corDoTipo(cores: Cores, tipo: "Receita" | "Despesa") {
  return tipo === "Receita" ? cores.receita : cores.despesa;
}
