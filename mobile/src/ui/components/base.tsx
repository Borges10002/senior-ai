import Ionicons from "@expo/vector-icons/Ionicons";
import { useState, type ComponentProps, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatarDigitacaoMoeda } from "@/domain/format";
import { espaco, raio, useTema } from "@/ui/theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];

type Variante = "titulo" | "subtitulo" | "corpo" | "legenda" | "destaque";

const tamanhos: Record<Variante, TextStyle> = {
  titulo: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  destaque: { fontSize: 32, fontWeight: "800", letterSpacing: -0.8 },
  subtitulo: { fontSize: 17, fontWeight: "700" },
  corpo: { fontSize: 15, fontWeight: "500" },
  legenda: { fontSize: 13, fontWeight: "500" },
};

export function Texto({
  variante = "corpo",
  cor,
  secundario,
  style,
  children,
  numberOfLines,
}: {
  variante?: Variante;
  cor?: string;
  secundario?: boolean;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
  numberOfLines?: number;
}) {
  const { cores } = useTema();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        tamanhos[variante],
        { color: cor ?? (secundario ? cores.textoSecundario : cores.texto) },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Tela({
  children,
  onRefresh,
  atualizando = false,
  rolavel = true,
  rodape,
}: {
  children: ReactNode;
  onRefresh?: () => void;
  atualizando?: boolean;
  rolavel?: boolean;
  rodape?: ReactNode;
}) {
  const { cores } = useTema();
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: cores.fundo }}
    >
      {rolavel ? (
        <ScrollView
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={atualizando}
                onRefresh={onRefresh}
                tintColor={cores.primaria}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.conteudo, { flex: 1 }]}>{children}</View>
      )}
      {rodape}
    </SafeAreaView>
  );
}

export function Cartao({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const { cores } = useTema();
  const base = [
    styles.cartao,
    { backgroundColor: cores.superficie, borderColor: cores.borda },
    style,
  ];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [base, pressed && { opacity: 0.85 }]}
    >
      {children}
    </Pressable>
  );
}

export function Botao({
  titulo,
  onPress,
  variante = "primario",
  icone,
  carregando,
  desabilitado,
  style,
}: {
  titulo: string;
  onPress: () => void;
  variante?: "primario" | "secundario" | "perigo" | "texto";
  icone?: IconName;
  carregando?: boolean;
  desabilitado?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { cores } = useTema();
  const paleta = {
    primario: { fundo: cores.primaria, texto: cores.sobrePrimaria },
    secundario: { fundo: cores.primariaSuave, texto: cores.primaria },
    perigo: { fundo: cores.despesaSuave, texto: cores.despesa },
    texto: { fundo: "transparent", texto: cores.primaria },
  }[variante];
  const inativo = desabilitado || carregando;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={inativo}
      onPress={onPress}
      style={({ pressed }) => [
        styles.botao,
        { backgroundColor: paleta.fundo, opacity: inativo ? 0.6 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={paleta.texto} />
      ) : (
        <>
          {icone && <Ionicons name={icone} size={18} color={paleta.texto} />}
          <Text style={[styles.botaoTexto, { color: paleta.texto }]}>{titulo}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Campo({
  rotulo,
  erro,
  style,
  secureTextEntry,
  moeda,
  ...props
}: TextInputProps & {
  rotulo?: string;
  erro?: string | null;
  /** Valor em reais: formata no padrão brasileiro enquanto digita ("25000" vira "25.000"). */
  moeda?: boolean;
}) {
  const { cores } = useTema();
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  // Texto formatado igual ao anterior não redesenha; o contador força o campo a mostrar o formatado.
  const [, redesenhar] = useState(0);
  return (
    <View style={{ gap: espaco.xs }}>
      {rotulo && (
        <Texto variante="legenda" secundario>
          {rotulo}
        </Texto>
      )}
      <View style={{ justifyContent: "center" }}>
        <TextInput
          placeholderTextColor={cores.textoSecundario}
          secureTextEntry={secureTextEntry && !senhaVisivel}
          style={[
            styles.campo,
            {
              backgroundColor: cores.superficie,
              borderColor: erro ? cores.despesa : cores.borda,
              color: cores.texto,
            },
            secureTextEntry && { paddingRight: 48 },
            style,
          ]}
          {...(moeda && { keyboardType: "decimal-pad" as const, placeholder: "0,00" })}
          {...props}
          onChangeText={
            moeda && props.onChangeText
              ? (texto) => {
                  const formatado = formatarDigitacaoMoeda(texto);
                  if (formatado === props.value && texto !== formatado) redesenhar((n) => n + 1);
                  props.onChangeText?.(formatado);
                }
              : props.onChangeText
          }
        />
        {secureTextEntry && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={senhaVisivel ? "Ocultar senha" : "Mostrar senha"}
            hitSlop={10}
            onPress={() => setSenhaVisivel((v) => !v)}
            style={styles.olho}
          >
            <Ionicons
              name={senhaVisivel ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={cores.textoSecundario}
            />
          </Pressable>
        )}
      </View>
      {erro ? (
        <Texto variante="legenda" cor={cores.despesa}>
          {erro}
        </Texto>
      ) : null}
    </View>
  );
}

export function Segmentado<T extends string>({
  opcoes,
  valor,
  onChange,
}: {
  opcoes: { valor: T; rotulo: string; cor?: string }[];
  valor: T;
  onChange: (v: T) => void;
}) {
  const { cores } = useTema();
  return (
    <View style={[styles.segmentado, { backgroundColor: cores.superficieAlt }]}>
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <Pressable
            key={o.valor}
            accessibilityRole="button"
            accessibilityState={{ selected: ativo }}
            onPress={() => onChange(o.valor)}
            style={[
              styles.segmento,
              ativo && { backgroundColor: cores.superficie },
            ]}
          >
            <Text
              style={{
                fontWeight: "700",
                color: ativo ? (o.cor ?? cores.texto) : cores.textoSecundario,
              }}
            >
              {o.rotulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({
  rotulo,
  ativo,
  onPress,
  icone,
}: {
  rotulo: string;
  ativo?: boolean;
  onPress: () => void;
  icone?: IconName;
}) {
  const { cores } = useTema();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: ativo ? cores.primaria : cores.superficie,
          borderColor: ativo ? cores.primaria : cores.borda,
        },
      ]}
    >
      {icone && (
        <Ionicons
          name={icone}
          size={14}
          color={ativo ? cores.sobrePrimaria : cores.textoSecundario}
        />
      )}
      <Text
        style={{
          fontWeight: "600",
          color: ativo ? cores.sobrePrimaria : cores.texto,
        }}
      >
        {rotulo}
      </Text>
    </Pressable>
  );
}

export function BarraProgresso({
  valor,
  cor,
}: {
  valor: number;
  cor?: string;
}) {
  const { cores } = useTema();
  const pct = Math.max(0, Math.min(1, valor));
  return (
    <View style={[styles.barra, { backgroundColor: cores.superficieAlt }]}>
      <View
        style={{
          width: `${pct * 100}%`,
          height: "100%",
          borderRadius: raio.pill,
          backgroundColor: cor ?? cores.primaria,
        }}
      />
    </View>
  );
}

export function Vazio({
  icone,
  titulo,
  descricao,
  acao,
}: {
  icone: IconName;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  const { cores } = useTema();
  return (
    <View style={styles.vazio}>
      <View style={[styles.vazioIcone, { backgroundColor: cores.primariaSuave }]}>
        <Ionicons name={icone} size={28} color={cores.primaria} />
      </View>
      <Texto variante="subtitulo" style={{ textAlign: "center" }}>
        {titulo}
      </Texto>
      {descricao && (
        <Texto secundario style={{ textAlign: "center" }}>
          {descricao}
        </Texto>
      )}
      {acao}
    </View>
  );
}

export function Secao({
  titulo,
  acao,
  children,
}: {
  titulo: string;
  acao?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={{ gap: espaco.md }}>
      <View style={styles.secaoTopo}>
        <Texto variante="subtitulo">{titulo}</Texto>
        {acao}
      </View>
      {children}
    </View>
  );
}

export function Icone({
  nome,
  cor,
  fundo,
  tamanho = 40,
}: {
  nome: IconName;
  cor: string;
  fundo: string;
  tamanho?: number;
}) {
  return (
    <View
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: tamanho / 2.6,
        backgroundColor: fundo,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={nome} size={tamanho * 0.5} color={cor} />
    </View>
  );
}

export function Carregando() {
  const { cores } = useTema();
  return (
    <View style={{ padding: espaco.xxl, alignItems: "center" }}>
      <ActivityIndicator color={cores.primaria} />
    </View>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    padding: espaco.lg,
    paddingBottom: 120,
    gap: espaco.xl,
  },
  cartao: {
    borderRadius: raio.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: espaco.lg,
    gap: espaco.md,
  },
  botao: {
    minHeight: 50,
    borderRadius: raio.md,
    paddingHorizontal: espaco.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: espaco.sm,
  },
  botaoTexto: { fontSize: 16, fontWeight: "700" },
  campo: {
    minHeight: 50,
    borderRadius: raio.md,
    borderWidth: 1,
    paddingHorizontal: espaco.md,
    fontSize: 16,
  },
  olho: {
    position: "absolute",
    right: 14,
  },
  segmentado: {
    flexDirection: "row",
    borderRadius: raio.md,
    padding: 4,
  },
  segmento: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: raio.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: raio.pill,
    borderWidth: 1,
  },
  barra: {
    height: 8,
    borderRadius: raio.pill,
    overflow: "hidden",
  },
  vazio: {
    alignItems: "center",
    gap: espaco.sm,
    paddingVertical: espaco.xxl,
    paddingHorizontal: espaco.lg,
  },
  vazioIcone: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: espaco.sm,
  },
  secaoTopo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
