import { DarkTheme, DefaultTheme, ThemeProvider, router } from "expo-router";
import Stack from "expo-router/stack";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { configurarAvisoAssinatura } from "@/infra/api/http-client";
import { AuthProvider, useAuth } from "@/state/auth-context";
import { AvisoAtualizacao } from "@/ui/components/aviso-atualizacao";
import { SplashAnimada } from "@/ui/components/splash-animada";
import { useTema } from "@/ui/theme";

// A splash nativa fica até a animada aparecer por cima (ela chama hide()).
void SplashScreen.preventAutoHideAsync();

function Navegacao() {
  const { usuario, carregando } = useAuth();
  const { cores } = useTema();
  const [mostrarSplash, setMostrarSplash] = useState(true);
  const fecharSplash = useCallback(() => setMostrarSplash(false), []);

  // Teste grátis vencido sem pagamento: a API responde 402 nas escritas.
  useEffect(() => {
    let aberto = false;
    configurarAvisoAssinatura((mensagem) => {
      if (aberto) return;
      aberto = true;
      Alert.alert("Assine o Pro para continuar", mensagem, [
        { text: "Agora não", style: "cancel", onPress: () => (aberto = false) },
        { text: "Ver plano", onPress: () => ((aberto = false), router.push("/assinatura")) },
      ]);
    });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      {!carregando && <Rotas usuario={!!usuario} />}
      {mostrarSplash && <SplashAnimada pronto={!carregando} onFim={fecharSplash} />}
      {!mostrarSplash && <AvisoAtualizacao />}
    </View>
  );
}

function Rotas({ usuario }: { usuario: boolean }) {
  const { usuario: conta } = useAuth();
  const { cores, escuro } = useTema();
  const base = escuro ? DarkTheme : DefaultTheme;
  const tema = {
    ...base,
    colors: {
      ...base.colors,
      background: cores.fundo,
      card: cores.superficie,
      text: cores.texto,
      border: cores.borda,
      primary: cores.primaria,
    },
  };

  return (
    <ThemeProvider value={tema}>
      <StatusBar style={escuro ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!usuario}>
          <Stack.Screen name="entrar" />
        </Stack.Protected>
        <Stack.Protected guard={!!usuario}>
          <Stack.Protected guard={(conta?.nivelAcesso ?? 0) >= 3}>
            <Stack.Screen name="vendas" options={{ headerShown: true, title: "Vendas" }} />
          </Stack.Protected>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="reuniao"
            options={{ presentation: "modal", headerShown: true, title: "Nova reunião" }}
          />
          <Stack.Screen
            name="assinatura"
            options={{ headerShown: true, title: "Meu plano" }}
          />
          <Stack.Screen
            name="alterar-senha"
            options={{ headerShown: true, title: "Alterar senha" }}
          />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Navegacao />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
