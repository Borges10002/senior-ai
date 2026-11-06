import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { useKeepAwake } from "expo-keep-awake";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { duracaoLegivel } from "@/domain/gravacao";
import { gravacaoService } from "@/infra/api/gravacao-service";
import { reuniaoService } from "@/infra/api/services";
import { apagarGravacaoLocal, gravacaoPendente, guardarGravacao } from "@/infra/storage/gravacao-local";
import { BarraProgresso, Botao, Cartao, Tela, Texto } from "@/ui/components/base";
import { espaco, useTema } from "@/ui/theme";

type Etapa = "aviso" | "gravando" | "enviando" | "falhou";

const mensagem = (e: unknown) => (e instanceof Error ? e.message : "Não foi possível concluir.");

/** Tela do assessor: filma a reunião e entrega o vídeo para o processamento automático. */
export default function GravarScreen() {
  const { id, reenviar } = useLocalSearchParams<{ id: string; reenviar?: string }>();
  const { cores } = useTema();
  const camera = useRef<CameraView>(null);
  const [permCamera, pedirCamera] = useCameraPermissions();
  const [permMicrofone, pedirMicrofone] = useMicrophonePermissions();
  // Ao voltar para reenviar, abre direto com a gravação guardada no aparelho.
  const [arquivo, setArquivo] = useState<string | null>(() => (reenviar === "1" ? gravacaoPendente(id) : null));
  const [etapa, setEtapa] = useState<Etapa>(arquivo ? "falhou" : "aviso");
  const [segundos, setSegundos] = useState(0);
  const [progresso, setProgresso] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [cameraPronta, setCameraPronta] = useState(false);
  const inicioRef = useRef(0);

  // A tela não pode apagar no meio da reunião.
  useKeepAwake();

  useEffect(() => {
    if (etapa !== "gravando") return;
    const relogio = setInterval(() => setSegundos(Math.floor((Date.now() - inicioRef.current) / 1000)), 1000);
    return () => clearInterval(relogio);
  }, [etapa]);

  async function enviar(uri: string, duracao: number | null) {
    setEtapa("enviando");
    setErro(null);
    setProgresso(0);
    try {
      await gravacaoService.enviar(id, uri, duracao, setProgresso);
      apagarGravacaoLocal(uri);
      router.replace({ pathname: "/resultado", params: { id } });
    } catch (e) {
      setErro(mensagem(e));
      setEtapa("falhou");
    }
  }

  async function iniciar() {
    setErro(null);
    const cam = permCamera?.granted ? permCamera : await pedirCamera();
    const mic = permMicrofone?.granted ? permMicrofone : await pedirMicrofone();
    if (!cam.granted || !mic.granted) {
      setErro("Permita o uso da câmera e do microfone para gravar a reunião.");
      return;
    }
    setSegundos(0);
    setEtapa("gravando");
  }

  useEffect(() => {
    if (etapa !== "gravando" || !cameraPronta) return;
    let ativo = true;
    inicioRef.current = Date.now();

    // recordAsync só termina quando a gravação para.
    camera.current
      ?.recordAsync()
      .then(async (video) => {
        if (!ativo) return;
        if (!video?.uri) throw new Error("A gravação não gerou um arquivo.");
        const duracao = Math.round((Date.now() - inicioRef.current) / 1000);
        await reuniaoService.mudarStatus(id, "finalizar").catch(() => undefined);
        const uri = guardarGravacao(id, video.uri);
        setArquivo(uri);
        await enviar(uri, duracao);
      })
      .catch((e) => {
        setErro(mensagem(e));
        setEtapa("falhou");
      });

    return () => {
      ativo = false;
    };
    // Inicia uma única vez, quando a câmera fica pronta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa, cameraPronta]);

  if (etapa === "gravando") {
    return (
      <View style={styles.tela}>
        <CameraView
          ref={camera}
          style={StyleSheet.absoluteFill}
          mode="video"
          facing="back"
          videoQuality={Platform.OS === "android" ? "720p" : undefined}
          onCameraReady={() => setCameraPronta(true)}
        />
        <SafeAreaView style={styles.sobreposicao}>
          <View style={styles.indicador}>
            <View style={[styles.ponto, { backgroundColor: cores.despesa }]} />
            <Texto cor="#FFFFFF" style={{ fontWeight: "700" }}>{`Gravando ${duracaoLegivel(segundos)}`}</Texto>
          </View>
          <Botao titulo="Finalizar reunião" icone="stop" variante="perigo" onPress={() => camera.current?.stopRecording()} />
        </SafeAreaView>
      </View>
    );
  }

  if (etapa === "enviando") {
    return (
      <Tela>
        <Texto variante="titulo">Enviando a gravação</Texto>
        <Texto secundario>Mantenha o app aberto. A transcrição e as anotações começam em seguida.</Texto>
        <BarraProgresso valor={progresso} />
        <Texto secundario>{`${Math.round(progresso * 100)}%`}</Texto>
      </Tela>
    );
  }

  if (etapa === "falhou") {
    return (
      <Tela>
        <Texto variante="titulo">Envio não concluído</Texto>
        <Texto cor={cores.despesa}>{erro}</Texto>
        {arquivo ? (
          <>
            <Texto secundario>A gravação está guardada no aparelho.</Texto>
            <Botao titulo="Tentar enviar de novo" icone="cloud-upload-outline" onPress={() => void enviar(arquivo, null)} />
          </>
        ) : (
          <Botao titulo="Voltar" variante="secundario" onPress={() => router.back()} />
        )}
      </Tela>
    );
  }

  return (
    <Tela>
      <Texto variante="titulo">Gravar reunião</Texto>
      <Cartao>
        <Texto style={{ fontWeight: "700" }}>Avise os participantes</Texto>
        <Texto secundario>
          A reunião será filmada e transcrita. Informe todos os presentes antes de começar. Ao continuar, você confirma
          que eles foram avisados.
        </Texto>
      </Cartao>
      <Texto secundario>
        Deixe o celular apoiado, com a tela ligada e o Senior AI aberto durante toda a reunião.
      </Texto>
      {erro && <Texto cor={cores.despesa}>{erro}</Texto>}
      <Botao titulo="Participantes avisados, iniciar gravação" icone="videocam" onPress={() => void iniciar()} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: "#000000" },
  sobreposicao: { flex: 1, justifyContent: "space-between", padding: espaco.lg },
  indicador: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: espaco.sm,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.sm,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  ponto: { width: 10, height: 10, borderRadius: 5 },
});
