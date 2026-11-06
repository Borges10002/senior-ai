import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { tituloRapido } from "@/domain/gravacao";
import { contarPorStatus, formatarDataHora, proximasReunioes } from "@/domain/reuniao";
import { reuniaoService } from "@/infra/api/services";
import { useAuth } from "@/state/auth-context";
import { useReunioes } from "@/state/use-reunioes";
import { Botao, Cartao, Secao, Tela, Texto, Vazio } from "@/ui/components/base";
import { espaco, useTema } from "@/ui/theme";

export default function InicioScreen() {
  const { usuario } = useAuth();
  const { cores } = useTema();
  const { reunioes, carregando, erro, recarregar } = useReunioes();
  const [iniciando, setIniciando] = useState(false);
  const [erroInicio, setErroInicio] = useState<string | null>(null);
  const proximas = proximasReunioes(reunioes);

  /** Um toque: cria a reunião, inicia e abre a câmera. */
  async function gravarAgora() {
    setIniciando(true);
    setErroInicio(null);
    try {
      const reuniao = await reuniaoService.criar({ titulo: tituloRapido(new Date()) });
      await reuniaoService.mudarStatus(reuniao.id, "iniciar");
      router.push({ pathname: "/gravar", params: { id: reuniao.id } });
    } catch (e) {
      setErroInicio(e instanceof Error ? e.message : "Não foi possível iniciar a reunião.");
    } finally {
      setIniciando(false);
    }
  }
  const indicadores = [
    { rotulo: "Agendadas", valor: contarPorStatus(reunioes, "AGENDADA") },
    { rotulo: "Em andamento", valor: contarPorStatus(reunioes, "EM_ANDAMENTO") },
    { rotulo: "Realizadas", valor: contarPorStatus(reunioes, "FINALIZADA") },
  ];

  return (
    <Tela onRefresh={recarregar} atualizando={carregando}>
      <Texto variante="titulo">Visão geral</Texto>
      <Texto secundario>{`Olá, ${usuario?.nome?.split(" ")[0] ?? ""}`}</Texto>
      {(erro || erroInicio) && <Texto cor={cores.despesa}>{erroInicio ?? erro}</Texto>}

      <Botao titulo="Gravar reunião agora" icone="videocam" carregando={iniciando} onPress={() => void gravarAgora()} />

      <View style={{ flexDirection: "row", gap: espaco.sm }}>
        {indicadores.map((i) => (
          <Cartao key={i.rotulo} style={{ flex: 1 }}>
            <Texto variante="subtitulo">{String(i.valor)}</Texto>
            <Texto variante="legenda" secundario>{i.rotulo}</Texto>
          </Cartao>
        ))}
      </View>

      <Secao titulo="Próximas reuniões">
        {proximas.length === 0 && !carregando ? (
          <Vazio
            icone="calendar-outline"
            titulo="Nenhuma reunião agendada"
            acao={<Botao titulo="Nova reunião" onPress={() => router.push("/reuniao")} />}
          />
        ) : (
          proximas.map((r) => (
            <Cartao key={r.id} onPress={() => router.push("/reunioes")}>
              <Texto style={{ fontWeight: "700" }}>{r.titulo}</Texto>
              <Texto variante="legenda" secundario>{formatarDataHora(r.inicio_previsto)}</Texto>
            </Cartao>
          ))
        )}
      </Secao>
    </Tela>
  );
}
