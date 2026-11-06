import { useEffect, useId, useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from "react-native-svg";

import { formatarMoeda } from "@/domain/format";
import { Texto } from "@/ui/components/base";
import { espaco, raio, useTema } from "@/ui/theme";

const CirculoAnimado = Animated.createAnimatedComponent(Circle);
const entrada = { duration: 700, easing: Easing.out(Easing.cubic) };

/** Valor de 0 a 1 que cresce ao montar e recomeça quando `chave` muda. */
function useEntrada(chave: unknown, atraso = 0): SharedValue<number> {
  const progresso = useSharedValue(0);
  useEffect(() => {
    progresso.set(0);
    progresso.set(withDelay(atraso, withTiming(1, entrada)));
  }, [chave, atraso, progresso]);
  return progresso;
}

export interface Fatia {
  rotulo: string;
  valor: number;
  cor: string;
}

/** Rosca com o total no centro; as fatias se desenham ao aparecer. */
export function Rosca({
  fatias,
  tamanho = 168,
  espessura = 22,
  centro,
}: {
  fatias: Fatia[];
  tamanho?: number;
  espessura?: number;
  centro?: ReactNode;
}) {
  const { cores } = useTema();
  const total = fatias.reduce((s, f) => s + f.valor, 0);
  const raioCirculo = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * raioCirculo;
  const progresso = useEntrada(fatias.map((f) => `${f.rotulo}:${f.valor}`).join("|"));

  let inicio = 0;
  return (
    <View style={{ width: tamanho, height: tamanho, alignSelf: "center" }}>
      <Svg width={tamanho} height={tamanho} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raioCirculo}
          stroke={cores.superficieAlt}
          strokeWidth={espessura}
          fill="none"
        />
        {total > 0 &&
          fatias.map((f) => {
            const fracao = f.valor / total;
            const deslocamento = inicio;
            inicio += fracao;
            return (
              <FatiaRosca
                key={f.rotulo}
                cor={f.cor}
                fracao={fracao}
                inicio={deslocamento}
                raio={raioCirculo}
                centro={tamanho / 2}
                espessura={espessura}
                circunferencia={circunferencia}
                progresso={progresso}
              />
            );
          })}
      </Svg>
      <View
        style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}
        pointerEvents="none"
      >
        {centro}
      </View>
    </View>
  );
}

function FatiaRosca({
  cor,
  fracao,
  inicio,
  raio: r,
  centro,
  espessura,
  circunferencia,
  progresso,
}: {
  cor: string;
  fracao: number;
  inicio: number;
  raio: number;
  centro: number;
  espessura: number;
  circunferencia: number;
  progresso: SharedValue<number>;
}) {
  // Pequeno vão entre as fatias, sem deixar fatia minúscula invisível.
  const vao = fracao > 0.02 ? 2 : 0;
  const props = useAnimatedProps(() => {
    const comprimento = Math.max(0, fracao * circunferencia - vao) * progresso.get();
    return {
      strokeDasharray: [comprimento, circunferencia],
      strokeDashoffset: -inicio * circunferencia * progresso.get(),
    };
  });
  return (
    <CirculoAnimado
      cx={centro}
      cy={centro}
      r={r}
      stroke={cor}
      strokeWidth={espessura}
      fill="none"
      animatedProps={props}
    />
  );
}

/** Legenda com valor e percentual de cada fatia. */
export function LegendaFatias({ fatias }: { fatias: Fatia[] }) {
  const total = fatias.reduce((s, f) => s + f.valor, 0);
  return (
    <View style={{ gap: espaco.sm }}>
      {fatias.map((f) => (
        <View key={f.rotulo} style={{ flexDirection: "row", alignItems: "center", gap: espaco.sm }}>
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: f.cor }} />
          <Texto style={{ flex: 1 }} numberOfLines={1}>{f.rotulo}</Texto>
          <Texto style={{ fontWeight: "700" }}>{formatarMoeda(f.valor)}</Texto>
          <Texto secundario style={{ width: 40, textAlign: "right" }}>
            {total ? Math.round((f.valor / total) * 100) : 0}%
          </Texto>
        </View>
      ))}
    </View>
  );
}

export function Legenda({ itens }: { itens: { cor: string; rotulo: string }[] }) {
  return (
    <View style={{ flexDirection: "row", gap: espaco.lg, justifyContent: "center", flexWrap: "wrap" }}>
      {itens.map((i) => (
        <View key={i.rotulo} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: i.cor }} />
          <Texto variante="legenda" secundario>{i.rotulo}</Texto>
        </View>
      ))}
    </View>
  );
}

export interface SerieLinha {
  nome: string;
  cor: string;
  valores: number[];
}

/** Linhas com área preenchida; aceita valores negativos (linha do zero aparece). */
export function GraficoLinha({
  series,
  rotulos,
  altura = 150,
}: {
  series: SerieLinha[];
  rotulos: string[];
  altura?: number;
}) {
  const { cores } = useTema();
  // Id único por gráfico: no web os degradês SVG de gráficos diferentes colidem.
  const prefixo = `area${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [largura, setLargura] = useState(0);
  const progresso = useEntrada(`${largura}:${series.map((s) => s.valores.join(",")).join("|")}`);
  const estilo = useAnimatedStyle(() => ({
    opacity: progresso.get(),
    transform: [{ translateY: (1 - progresso.get()) * 12 }],
  }));

  const todos = series.flatMap((s) => s.valores);
  const maximo = Math.max(0, ...todos);
  const minimo = Math.min(0, ...todos);
  const faixa = maximo - minimo || 1;
  const margem = 8;
  const util = altura - margem * 2;
  // Os rótulos ficam espaçados por igual embaixo; podem ser menos que os pontos.
  const pontos = Math.max(1, (series[0]?.valores.length ?? 1) - 1);
  const x = (i: number) => (largura * i) / pontos;
  const y = (v: number) => margem + util - ((v - minimo) / faixa) * util;
  const zero = y(0);

  return (
    <View style={{ gap: espaco.sm }}>
      <View style={{ height: altura }} onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
        {largura > 0 && (
          <Animated.View style={estilo}>
            <Svg width={largura} height={altura}>
              <Defs>
                {series.map((s, i) => (
                  <LinearGradient key={s.nome} id={`${prefixo}-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={s.cor} stopOpacity={0.28} />
                    <Stop offset="1" stopColor={s.cor} stopOpacity={0} />
                  </LinearGradient>
                ))}
              </Defs>
              {minimo < 0 && (
                <Path d={`M0 ${zero} H${largura}`} stroke={cores.borda} strokeWidth={1} strokeDasharray="4 4" />
              )}
              {series.map((s, i) => {
                const linha = s.valores.map((v, j) => `${j ? "L" : "M"}${x(j)} ${y(v)}`).join(" ");
                const area = `${linha} L${x(s.valores.length - 1)} ${zero} L0 ${zero} Z`;
                const ultimo = s.valores.length - 1;
                return (
                  <G key={s.nome}>
                    <Path d={area} fill={`url(#${prefixo}-${i})`} />
                    <Path d={linha} stroke={s.cor} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
                    <Circle cx={x(ultimo)} cy={y(s.valores[ultimo] ?? 0)} r={4} fill={s.cor} />
                  </G>
                );
              })}
            </Svg>
          </Animated.View>
        )}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {rotulos.map((r, i) => (
          <Texto key={`${r}-${i}`} variante="legenda" secundario style={{ fontSize: 11 }}>
            {r}
          </Texto>
        ))}
      </View>
    </View>
  );
}

export interface GrupoBarras {
  rotulo: string;
  valores: { nome: string; valor: number; cor: string }[];
}

/**
 * Barras verticais agrupadas. Tocar num grupo mostra os valores dele; o
 * último grupo começa selecionado.
 */
export function GraficoBarras({
  grupos,
  altura = 140,
  formatar = formatarMoeda,
}: {
  grupos: GrupoBarras[];
  altura?: number;
  formatar?: (v: number) => string;
}) {
  const { cores } = useTema();
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const ativo = selecionado ?? grupos.length - 1;
  const maximo = Math.max(1, ...grupos.flatMap((g) => g.valores.map((v) => v.valor)));
  const larguraBarra = grupos.length > 8 ? 6 : 10;
  const chave = grupos.map((g) => g.valores.map((v) => v.valor).join(",")).join("|");
  const destaque = grupos[ativo];

  return (
    <View style={{ gap: espaco.sm }}>
      {destaque && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: espaco.md, justifyContent: "center" }}>
          <Texto variante="legenda" style={{ fontWeight: "800" }}>{destaque.rotulo}</Texto>
          {destaque.valores.map((v) => (
            <Texto key={v.nome} variante="legenda" cor={v.cor} style={{ fontWeight: "700" }}>
              {v.nome}: {formatar(v.valor)}
            </Texto>
          ))}
        </View>
      )}
      <View style={{ flexDirection: "row", alignItems: "flex-end", height: altura, gap: 2 }}>
        {grupos.map((g, i) => (
          <Pressable
            key={`${g.rotulo}-${i}`}
            onPress={() => setSelecionado(i)}
            style={{
              flex: 1,
              alignItems: "center",
              gap: 4,
              paddingTop: 4,
              borderRadius: raio.sm,
              backgroundColor: i === ativo ? cores.primariaSuave : "transparent",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2, height: altura - 24 }}>
              {g.valores.map((v, j) => (
                <Barra
                  key={v.nome}
                  altura={Math.max(2, (v.valor / maximo) * (altura - 24))}
                  largura={larguraBarra}
                  cor={v.cor}
                  chave={chave}
                  atraso={i * 40 + j * 20}
                />
              ))}
            </View>
            <Texto variante="legenda" secundario style={{ fontSize: 10 }} numberOfLines={1}>
              {g.rotulo}
            </Texto>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Barra({
  altura,
  largura,
  cor,
  chave,
  atraso,
}: {
  altura: number;
  largura: number;
  cor: string;
  chave: string;
  atraso: number;
}) {
  const progresso = useEntrada(chave, atraso);
  const estilo = useAnimatedStyle(() => ({ height: altura * progresso.get() }));
  return <Animated.View style={[{ width: largura, backgroundColor: cor, borderRadius: 4 }, estilo]} />;
}

/** Ranking em barras horizontais (pessoas, categorias...). */
export function BarrasHorizontais({
  itens,
  formatar = formatarMoeda,
}: {
  itens: { rotulo: string; valor: number; cor: string }[];
  formatar?: (v: number) => string;
}) {
  const maximo = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <View style={{ gap: espaco.md }}>
      {itens.map((item, i) => (
        <View key={item.rotulo} style={{ gap: espaco.xs }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: espaco.sm }}>
            <Texto style={{ flex: 1 }} numberOfLines={1}>{item.rotulo}</Texto>
            <Texto style={{ fontWeight: "700" }}>{formatar(item.valor)}</Texto>
          </View>
          <BarraHorizontal fracao={item.valor / maximo} cor={item.cor} atraso={i * 60} />
        </View>
      ))}
    </View>
  );
}

function BarraHorizontal({ fracao, cor, atraso }: { fracao: number; cor: string; atraso: number }) {
  const { cores } = useTema();
  const progresso = useEntrada(fracao, atraso);
  const estilo = useAnimatedStyle(() => ({ width: `${fracao * 100 * progresso.get()}%` }));
  return (
    <View style={{ height: 10, borderRadius: raio.pill, backgroundColor: cores.superficieAlt, overflow: "hidden" }}>
      <Animated.View style={[{ height: "100%", borderRadius: raio.pill, backgroundColor: cor }, estilo]} />
    </View>
  );
}

/** Paleta para categorias; a última cor fica para "Outras". */
export const PALETA = ["#2457F5", "#E5484D", "#D98E04", "#8B5CF6", "#06B6D4", "#0E9F6E", "#94A3B8"];

/** As maiores fatias e o resto somado em "Outras". */
export function agruparFatias(itens: { nome: string; total: number }[], limite = 5): Fatia[] {
  const principais = itens.slice(0, limite).map((i, n) => ({ rotulo: i.nome, valor: i.total, cor: PALETA[n] }));
  const resto = itens.slice(limite).reduce((s, i) => s + i.total, 0);
  return resto > 0 ? [...principais, { rotulo: "Outras", valor: resto, cor: PALETA[PALETA.length - 1] }] : principais;
}
