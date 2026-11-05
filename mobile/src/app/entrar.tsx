import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/state/auth-context";
import { espaco, useTema } from "@/ui/theme";

export default function Entrar() {
  const { entrar } = useAuth();
  const { cores } = useTema();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function acessar() {
    setErro(null);
    setEnviando(true);
    try {
      await entrar(email.trim(), senha);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  }

  const campo = [styles.campo, { borderColor: cores.borda, color: cores.texto, backgroundColor: cores.superficie }];

  return (
    <SafeAreaView style={[styles.tela, { backgroundColor: cores.fundo }]}>
      <View style={styles.conteudo}>
        <Text style={[styles.titulo, { color: cores.texto }]}>Senior AI</Text>
        <Text style={{ color: cores.textoSecundario, marginBottom: espaco.xl }}>Seu assistente executivo inteligente</Text>
        <TextInput
          style={campo}
          placeholder="E-mail"
          placeholderTextColor={cores.textoSecundario}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={campo}
          placeholder="Senha"
          placeholderTextColor={cores.textoSecundario}
          secureTextEntry
          autoComplete="current-password"
          value={senha}
          onChangeText={setSenha}
        />
        {erro && <Text style={{ color: cores.perigo, marginBottom: espaco.md }}>{erro}</Text>}
        <Pressable
          accessibilityRole="button"
          style={[styles.botao, { backgroundColor: cores.primaria }]}
          disabled={enviando || !email || !senha}
          onPress={acessar}
        >
          {enviando ? <ActivityIndicator color={cores.sobrePrimaria} /> : <Text style={styles.textoBotao}>Entrar</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { flex: 1, justifyContent: "center", padding: espaco.xl },
  titulo: { fontSize: 32, fontWeight: "800" },
  campo: { borderWidth: 1, borderRadius: 12, padding: espaco.md, marginBottom: espaco.md, fontSize: 16 },
  botao: { borderRadius: 12, padding: espaco.lg, alignItems: "center" },
  textoBotao: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
});
