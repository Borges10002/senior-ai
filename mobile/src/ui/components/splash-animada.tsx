import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

// Mesmas cores e medida da splash nativa (app.json): a troca acontece sem "pulo".
const FUNDO = "#0C0D13";
const AZUL = "#94BAFF";
const LOGO = 112;
// Curta: a abertura não deve parecer travada; só segura se a sessão ainda estiver carregando.
const DURACAO_MINIMA = 750;
const DURACAO_SAIDA = 280;

const suave = Easing.out(Easing.cubic);

/**
 * Continua a splash nativa (identidade DimiTech) enquanto a sessão é
 * restaurada: o logo "respira" com um brilho azul e uma linha fina mostra
 * o carregamento. Some sozinha quando `pronto` e o tempo mínimo passou.
 */
export function SplashAnimada({ pronto, onFim }: { pronto: boolean; onFim: () => void }) {
  const reduzirMovimento = useReducedMotion();
  const [tempoMinimo, setTempoMinimo] = useState(false);

  const pulso = useSharedValue(0);
  const brilho = useSharedValue(0);
  const linha = useSharedValue(0);
  const assinatura = useSharedValue(0);
  const saida = useSharedValue(0);

  useEffect(() => {
    if (!reduzirMovimento) {
      pulso.set(withSequence(withTiming(1, { duration: 260, easing: suave }), withTiming(0, { duration: 340, easing: suave })));
      brilho.set(withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }), -1, true));
      linha.set(withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, false));
    }
    assinatura.set(withDelay(150, withTiming(1, { duration: 400, easing: suave })));
    const timer = setTimeout(() => setTempoMinimo(true), reduzirMovimento ? 300 : DURACAO_MINIMA);
    return () => clearTimeout(timer);
  }, [reduzirMovimento, pulso, brilho, linha, assinatura]);

  useEffect(() => {
    if (!pronto || !tempoMinimo) return;
    saida.set(withTiming(1, { duration: DURACAO_SAIDA, easing: Easing.in(Easing.quad) }));
    const timer = setTimeout(onFim, DURACAO_SAIDA);
    return () => clearTimeout(timer);
  }, [pronto, tempoMinimo, saida, onFim]);

  const estiloTela = useAnimatedStyle(() => ({ opacity: 1 - saida.get() }));
  const estiloLogo = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulso.get() * 0.06 + saida.get() * 0.12 }],
  }));
  const estiloBrilho = useAnimatedStyle(() => ({
    opacity: 0.18 + brilho.get() * 0.22,
    transform: [{ scale: 1 + brilho.get() * 0.12 }],
  }));
  const estiloLinha = useAnimatedStyle(() => ({
    transform: [{ translateX: -60 + linha.get() * 120 }],
  }));
  const estiloAssinatura = useAnimatedStyle(() => ({
    opacity: assinatura.get() * 0.7,
    transform: [{ translateY: (1 - assinatura.get()) * 8 }],
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.tela, estiloTela]}
      // A versão animada já está na tela: a nativa pode sair sem corte.
      onLayout={() => SplashScreen.hide()}
      pointerEvents="none"
    >
      <View style={styles.centro}>
        <Animated.View style={[styles.brilho, estiloBrilho]} />
        <Animated.View style={estiloLogo}>
          <Image source={require("../../../assets/images/splash-icon.png")} style={styles.logo} />
        </Animated.View>
        <View style={styles.trilho}>
          <Animated.View style={[styles.progresso, estiloLinha]} />
        </View>
      </View>

      <Animated.Text style={[styles.assinatura, estiloAssinatura]}>DIMITECH</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tela: { backgroundColor: FUNDO, alignItems: "center", justifyContent: "center", zIndex: 10 },
  centro: { alignItems: "center", justifyContent: "center" },
  logo: { width: LOGO, height: LOGO },
  brilho: {
    position: "absolute",
    top: -LOGO * 0.35,
    left: -LOGO * 0.35,
    width: LOGO * 1.7,
    height: LOGO * 1.7,
    borderRadius: LOGO,
    backgroundColor: AZUL,
  },
  // Fica abaixo do logo sem mudar a posição dele (igual à splash nativa).
  trilho: {
    position: "absolute",
    top: LOGO + 36,
    left: (LOGO - 60) / 2,
    width: 60,
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: "rgba(148,186,255,0.15)",
  },
  progresso: { width: 30, height: 3, borderRadius: 2, backgroundColor: AZUL },
  assinatura: {
    position: "absolute",
    bottom: 56,
    color: AZUL,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 4,
  },
});
