import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ROTULO_STATUS, type Reuniao } from "@/domain/models";
import { reunioesService } from "@/infra/api/reunioes-service";
import { espaco, useTema } from "@/ui/theme";

export default function Reunioes() {
  const { cores } = useTema();
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setReunioes(await reunioesService.listar());
    } catch (e) {
      Alert.alert("Reuniões", e instanceof Error ? e.message : "Erro ao carregar.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar]),
  );

  async function alternar(r: Reuniao) {
    try {
      if (r.status === "AGENDADA") await reunioesService.iniciar(r.id);
      else if (r.status === "EM_ANDAMENTO") await reunioesService.finalizar(r.id);
      await carregar();
    } catch (e) {
      Alert.alert("Reuniões", e instanceof Error ? e.message : "Erro ao atualizar.");
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }} edges={["top"]}>
      <Text style={[styles.titulo, { color: cores.texto }]}>Reuniões</Text>
      <FlatList
        data={reunioes}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: espaco.lg, gap: espaco.sm }}
        refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}
        ListEmptyComponent={
          carregando ? undefined : <Text style={{ color: cores.textoSecundario }}>Nenhuma reunião cadastrada.</Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: cores.texto, fontWeight: "600" }}>{item.titulo}</Text>
              <Text style={{ color: cores.textoSecundario }}>{ROTULO_STATUS[item.status]}</Text>
            </View>
            {(item.status === "AGENDADA" || item.status === "EM_ANDAMENTO") && (
              <Pressable accessibilityRole="button" onPress={() => alternar(item)}>
                <Text style={{ color: cores.primaria, fontWeight: "700" }}>
                  {item.status === "AGENDADA" ? "Iniciar" : "Finalizar"}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 26, fontWeight: "800", paddingHorizontal: espaco.lg, paddingTop: espaco.lg },
  card: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 14, padding: espaco.lg },
});
