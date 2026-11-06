import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { espaco, raio, useTema } from "@/ui/theme";

import { Botao, Campo, Texto } from "./base";

interface OpcaoSelecao {
  id: string;
  nome: string;
  descricao?: string;
}

const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

export function CampoSelecao({ opcoes, valor, onChange, onCriar, rotulo, titulo, placeholder, buscaPlaceholder, vazio, criarTitulo }: {
  opcoes: OpcaoSelecao[];
  valor: string;
  onChange: (id: string) => void;
  onCriar: () => void;
  rotulo: string;
  titulo: string;
  placeholder: string;
  buscaPlaceholder: string;
  vazio: string;
  criarTitulo: string;
}) {
  const { cores } = useTema();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const selecionada = opcoes.find((opcao) => opcao.id === valor);
  const filtradas = opcoes.filter((opcao) =>
    normalizar(opcao.nome).includes(normalizar(busca.trim())),
  );

  function fechar() {
    Keyboard.dismiss();
    setAberto(false);
  }

  return (
    <View style={{ gap: espaco.xs }}>
      <Texto variante="legenda" secundario>{rotulo}</Texto>
      <Pressable
        accessibilityRole="combobox"
        accessibilityLabel={rotulo}
        accessibilityValue={{ text: selecionada?.nome ?? placeholder }}
        accessibilityState={{ expanded: aberto }}
        onPress={() => {
          Keyboard.dismiss();
          setBusca("");
          setAberto(true);
        }}
        style={[styles.campo, { backgroundColor: cores.superficie, borderColor: cores.borda }]}
      >
        <Texto secundario={!selecionada} style={{ flex: 1 }}>
          {selecionada?.nome ?? placeholder}
        </Texto>
        <Ionicons name="chevron-down" size={20} color={cores.textoSecundario} />
      </Pressable>

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={fechar}>
        <KeyboardAvoidingView style={styles.fundo} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Pressable style={StyleSheet.absoluteFill} onPress={fechar} accessibilityRole="button" accessibilityLabel={`Fechar ${titulo.toLowerCase()}`} />
          <SafeAreaView
            edges={["bottom", "left", "right"]}
            accessibilityViewIsModal
            style={[styles.painel, { backgroundColor: cores.superficie }]}
          >
            <View style={styles.cabecalho}>
              <Texto variante="subtitulo" style={{ flex: 1 }}>{titulo}</Texto>
              <Pressable onPress={fechar} accessibilityRole="button" accessibilityLabel="Fechar" style={styles.fechar}>
                <Ionicons name="close" size={24} color={cores.texto} />
              </Pressable>
            </View>
            <Campo
              accessibilityLabel={buscaPlaceholder}
              placeholder={buscaPlaceholder}
              value={busca}
              onChangeText={setBusca}
              autoCorrect={false}
              returnKeyType="search"
            />
            <FlatList
              data={filtradas}
              keyExtractor={(item) => item.id}
              extraData={valor}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              style={{ flexGrow: 0 }}
              renderItem={({ item }) => {
                const ativa = item.id === valor;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: ativa }}
                    onPress={() => {
                      onChange(item.id);
                      fechar();
                    }}
                    style={({ pressed }) => [styles.opcao, {
                      backgroundColor: ativa ? cores.primariaSuave : pressed ? cores.superficieAlt : cores.superficie,
                    }]}
                  >
                    <View style={{ flex: 1, gap: espaco.xs }}>
                      <Texto cor={ativa ? cores.primaria : cores.texto}>{item.nome}</Texto>
                      {item.descricao && <Texto variante="legenda" secundario>{item.descricao}</Texto>}
                    </View>
                    {ativa && <Ionicons name="checkmark" size={22} color={cores.primaria} />}
                  </Pressable>
                );
              }}
              ListEmptyComponent={<Texto secundario style={{ paddingVertical: espaco.xl, textAlign: "center" }}>
                {vazio}
              </Texto>}
            />
            <Botao titulo={criarTitulo} icone="add" variante="secundario" onPress={() => {
              fechar();
              onCriar();
            }} />
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  campo: { minHeight: 50, borderWidth: 1, borderRadius: raio.md, paddingHorizontal: espaco.md, flexDirection: "row", alignItems: "center", gap: espaco.sm },
  fundo: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  painel: { maxHeight: "80%", borderTopLeftRadius: raio.lg, borderTopRightRadius: raio.lg, padding: espaco.lg, gap: espaco.md },
  cabecalho: { flexDirection: "row", alignItems: "center", gap: espaco.sm },
  fechar: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  opcao: { minHeight: 52, padding: espaco.md, borderRadius: raio.sm, flexDirection: "row", alignItems: "center", gap: espaco.sm },
});
