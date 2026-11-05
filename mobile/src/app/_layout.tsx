import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "@/state/auth-context";
import { useTema } from "@/ui/theme";

function Rotas() {
  const { usuario, carregando } = useAuth();
  const { cores, escuro } = useTema();

  if (carregando) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: cores.fundo }}>
        <ActivityIndicator color={cores.primaria} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={escuro ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }}>
        <Stack.Protected guard={!usuario}>
          <Stack.Screen name="entrar" />
        </Stack.Protected>
        <Stack.Protected guard={!!usuario}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Rotas />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
