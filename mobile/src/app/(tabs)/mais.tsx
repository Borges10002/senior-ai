import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/state/auth-context";
import { espaco, useTema } from "@/ui/theme";

export default function Mais() {
  const { usuario, sair } = useAuth();
  const { cores } = useTema();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo, padding: espaco.lg }}>
      <Text style={{ color: cores.texto, fontSize: 20, fontWeight: "700" }}>{usuario?.nome}</Text>
      <Text style={{ color: cores.textoSecundario, marginBottom: espaco.xl }}>{usuario?.email}</Text>
      <View>
        <Pressable accessibilityRole="button" onPress={sair}>
          <Text style={{ color: cores.perigo, fontWeight: "700" }}>Sair</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
