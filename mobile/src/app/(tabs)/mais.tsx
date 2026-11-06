import Ionicons from "@expo/vector-icons/Ionicons";
import { router, type Href } from "expo-router";
import { Alert, Pressable, View } from "react-native";

import { useAuth } from "@/state/auth-context";
import { Cartao, Icone, Segmentado, Tela, Texto, type IconName } from "@/ui/components/base";
import { definirPreferenciaTema, usePreferenciaTema } from "@/ui/tema-preferencia";
import { espaco, useTema } from "@/ui/theme";

/** Perfil Administrador no servidor (nivelacesso 3). */
const NIVEL_ADMIN = 3;

export default function MaisScreen() {
  const { usuario, sair } = useAuth();
  const { cores } = useTema();
  const preferenciaTema = usePreferenciaTema();

  const confirmarSaida = () =>
    Alert.alert("Sair", "Deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => void sair() },
    ]);

  return (
    <Tela>
      <Texto variante="titulo">Mais</Texto>

      <Cartao style={{ flexDirection: "row", alignItems: "center" }}>
        <Icone nome="person" cor={cores.primaria} fundo={cores.primariaSuave} tamanho={52} />
        <View style={{ flex: 1 }}>
          <Texto variante="subtitulo" numberOfLines={1}>{usuario?.nome}</Texto>
          <Texto secundario numberOfLines={1}>{usuario?.email}</Texto>
        </View>
      </Cartao>

      <Cartao>
        <Texto variante="legenda" secundario>Aparência</Texto>
        <Segmentado
          opcoes={[
            { valor: "sistema", rotulo: "Sistema" },
            { valor: "claro", rotulo: "Claro" },
            { valor: "escuro", rotulo: "Escuro" },
          ]}
          valor={preferenciaTema}
          onChange={definirPreferenciaTema}
        />
      </Cartao>

      <Cartao style={{ gap: 0, paddingVertical: espaco.xs }}>
        <Item icone="ribbon-outline" rotulo="Meu plano" destino="/assinatura" />
        <Item icone="lock-closed-outline" rotulo="Alterar senha" destino="/alterar-senha" />
      </Cartao>

      {(usuario?.nivelAcesso ?? 0) >= NIVEL_ADMIN && (
        <Cartao style={{ gap: 0, paddingVertical: espaco.xs }}>
          <Texto variante="legenda" secundario style={{ paddingTop: espaco.sm }}>Administração</Texto>
          <Item icone="cash-outline" rotulo="Vendas do plano Pro" destino="/vendas" />
        </Cartao>
      )}

      <Cartao style={{ gap: 0, paddingVertical: espaco.xs }}>
        <Pressable onPress={confirmarSaida} style={{ flexDirection: "row", alignItems: "center", gap: espaco.md, paddingVertical: espaco.md }}>
          <Ionicons name="log-out-outline" size={22} color={cores.despesa} />
          <Texto cor={cores.despesa} style={{ fontWeight: "700" }}>Sair</Texto>
        </Pressable>
      </Cartao>
    </Tela>
  );
}

function Item({ icone, rotulo, destino }: { icone: IconName; rotulo: string; destino: Href }) {
  const { cores } = useTema();
  return (
    <Pressable
      onPress={() => router.push(destino)}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: espaco.md,
        paddingVertical: espaco.md,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Ionicons name={icone} size={22} color={cores.primaria} />
      <Texto style={{ flex: 1 }}>{rotulo}</Texto>
      <Ionicons name="chevron-forward" size={18} color={cores.textoSecundario} />
    </Pressable>
  );
}
