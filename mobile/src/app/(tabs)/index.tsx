import { router } from "expo-router";
import { View } from "react-native";

import { contarPorStatus, formatarDataHora, proximasReunioes } from "@/domain/reuniao";
import { useAuth } from "@/state/auth-context";
import { useReunioes } from "@/state/use-reunioes";
import { Botao, Cartao, Secao, Tela, Texto, Vazio } from "@/ui/components/base";
import { espaco, useTema } from "@/ui/theme";

export default function InicioScreen() {
  const { usuario } = useAuth();
  const { cores } = useTema();
  const { reunioes, carregando, erro, recarregar } = useReunioes();
  const proximas = proximasReunioes(reunioes);
  const indicadores = [
    { rotulo: "Agendadas", valor: contarPorStatus(reunioes, "AGENDADA") },
    { rotulo: "Em andamento", valor: contarPorStatus(reunioes, "EM_ANDAMENTO") },
    { rotulo: "Realizadas", valor: contarPorStatus(reunioes, "FINALIZADA") },
  ];

  return (
    <Tela onRefresh={recarregar} atualizando={carregando}>
      <Texto variante="titulo">Visão geral</Texto>
      <Texto secundario>{`Olá, ${usuario?.nome?.split(" ")[0] ?? ""}`}</Texto>
      {erro && <Texto cor={cores.despesa}>{erro}</Texto>}

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
