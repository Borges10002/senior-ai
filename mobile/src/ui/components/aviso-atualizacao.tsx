import Constants from "expo-constants";
import { useEffect, useRef, useState } from "react";
import { Linking, Modal, Platform, View } from "react-native";

import { ehMaisNova, type VersaoApp } from "@/domain/versao";
import { baixarApk, INSTALACAO_NO_APP, instalarApk, type DownloadApk } from "@/infra/atualizacao/instalador-apk";
import { buscarUltimaVersao } from "@/infra/api/versao-service";
import { useAuth } from "@/state/auth-context";
import { Botao, Icone, Texto } from "@/ui/components/base";
import { espaco, raio, useTema } from "@/ui/theme";

/** Versão instalada (a do app.json no momento do build). */
const VERSAO_INSTALADA = Constants.expoConfig?.version ?? "0.0.0";

// O APK só existe para Android; em desenvolvimento aparece também no web para testar.
const VERIFICAR = Platform.OS === "android" || __DEV__;

type Etapa = "baixando" | "pronto" | "erro" | "manual";

/**
 * Ao abrir o app e a cada login, procura uma versão nova. No Android o
 * APK é baixado sozinho e o instalador abre no fim; "Baixar pelo
 * navegador" fica como alternativa, igual ao botão do web.
 */
export function AvisoAtualizacao() {
  const { cores } = useTema();
  const { usuario } = useAuth();
  const [nova, setNova] = useState<VersaoApp | null>(null);
  const [etapa, setEtapa] = useState<Etapa>("manual");
  const [progresso, setProgresso] = useState(0);
  const arquivo = useRef<string | null>(null);
  const download = useRef<DownloadApk | null>(null);
  const codigoUsuario = usuario?.codigo ?? null;

  useEffect(() => {
    if (!VERIFICAR) return;
    let ativo = true;
    buscarUltimaVersao().then((ultima) => {
      if (!ativo || !ultima || !ehMaisNova(ultima.versao, VERSAO_INSTALADA)) return;
      setNova(ultima);
      if (!INSTALACAO_NO_APP) return;
      setEtapa("baixando");
      setProgresso(0);
      download.current?.cancelar();
      const tarefa = baixarApk(ultima.url, ultima.versao, (f) => ativo && setProgresso(f));
      download.current = tarefa;
      tarefa.concluido
        .then(async (uri) => {
          if (!ativo || !uri) return;
          arquivo.current = uri;
          setEtapa("pronto");
          await instalarApk(uri);
        })
        .catch(() => ativo && setEtapa("erro"));
    });
    return () => {
      ativo = false;
      download.current?.cancelar();
    };
  }, [codigoUsuario]);

  if (!nova) return null;

  const fechar = () => {
    download.current?.cancelar();
    setNova(null);
  };
  const instalar = () => arquivo.current && void instalarApk(arquivo.current).catch(() => setEtapa("erro"));
  const peloNavegador = () => void Linking.openURL(nova.url);
  const pct = Math.round(progresso * 100);

  return (
    <Modal transparent animationType="fade" visible onRequestClose={nova.obrigatoria ? undefined : fechar}>
      <View style={{ flex: 1, backgroundColor: "rgba(8,15,30,0.55)", justifyContent: "center", padding: espaco.xl }}>
        <View style={{ backgroundColor: cores.superficie, borderRadius: raio.lg, padding: espaco.xl, gap: espaco.md }}>
          <Icone nome="rocket-outline" cor={cores.primaria} fundo={cores.primariaSuave} tamanho={52} />
          <Texto variante="subtitulo">
            {etapa === "baixando" ? "Atualizando o Senior AI" : "Nova versão disponível"}
          </Texto>
          <Texto secundario>{`Versão ${nova.versao} · você está na ${VERSAO_INSTALADA}.`}</Texto>

          {!!nova.novidades?.length && (
            <View style={{ gap: espaco.xs, backgroundColor: cores.superficieAlt, borderRadius: raio.md, padding: espaco.md }}>
              <Texto variante="legenda" style={{ fontWeight: "700" }}>Novidades</Texto>
              {nova.novidades.map((n) => (
                <Texto key={n} variante="legenda" secundario>{`• ${n}`}</Texto>
              ))}
            </View>
          )}

          {etapa === "baixando" && (
            <View style={{ gap: espaco.xs }}>
              <View style={{ height: 10, borderRadius: 5, backgroundColor: cores.superficieAlt, overflow: "hidden" }}>
                <View style={{ width: `${pct}%`, height: "100%", backgroundColor: cores.primaria, borderRadius: 5 }} />
              </View>
              <Texto variante="legenda" secundario>{`Baixando… ${pct}%`}</Texto>
            </View>
          )}
          {etapa === "pronto" && (
            <Texto variante="legenda" secundario>
              Download concluído. Confirme a instalação na tela do Android (se pedir, permita instalar apps desta fonte).
            </Texto>
          )}
          {etapa === "erro" && (
            <Texto variante="legenda" cor={cores.alerta}>
              Não foi possível baixar aqui. Use o download pelo navegador.
            </Texto>
          )}
          {nova.obrigatoria && (
            <Texto variante="legenda" cor={cores.alerta}>
              Esta atualização é necessária para continuar usando o app.
            </Texto>
          )}

          {etapa === "pronto" && <Botao titulo="Instalar agora" icone="download-outline" onPress={instalar} />}
          <Botao
            titulo="Baixar pelo navegador"
            icone="globe-outline"
            variante={etapa === "manual" || etapa === "erro" ? undefined : "secundario"}
            onPress={peloNavegador}
          />
          {!nova.obrigatoria && <Botao titulo="Depois" variante="texto" onPress={fechar} />}
        </View>
      </View>
    </Modal>
  );
}
