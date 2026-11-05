import { useColorScheme } from "react-native";

const claro = {
  fundo: "#F4F6FB",
  superficie: "#FFFFFF",
  borda: "#E1E6F0",
  texto: "#0F1B2D",
  textoSecundario: "#5B6B82",
  primaria: "#1F4FD8",
  sobrePrimaria: "#FFFFFF",
  perigo: "#E5484D",
};

const escuro: typeof claro = {
  fundo: "#0B111C",
  superficie: "#141C2B",
  borda: "#26324A",
  texto: "#EEF2FA",
  textoSecundario: "#97A3B8",
  primaria: "#5B83FF",
  sobrePrimaria: "#FFFFFF",
  perigo: "#FF6B6F",
};

export type Cores = typeof claro;
export const espaco = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export function useTema() {
  const ehEscuro = useColorScheme() === "dark";
  return { cores: ehEscuro ? escuro : claro, escuro: ehEscuro };
}
