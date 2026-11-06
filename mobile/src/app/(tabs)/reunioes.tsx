import { router } from "expo-router";
import { View } from "react-native";

import { ROTULO_STATUS, formatarDataHora } from "@/domain/reuniao";
import { useReunioes } from "@/state/use-reunioes";
import { Botao, Cartao, Tela, Texto, Vazio } from "@/ui/components/base";
import { espaco, useTema } from "@/ui/theme";

export default function ReunioesScreen() {
  const { cores } = useTema();
  const { reunioes, carregando, erro, recarregar, mudarStatus } = useReunioes();

  return (
    <Tela onRefresh={recarregar} atualizando={carregando}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Texto variante="titulo">Reuniões</Texto>
        <Botao titulo="Nova" icone="add" onPress={() => router.push("/reuniao")} />
      </View>
      {erro && <Texto cor={cores.despesa}>{erro}</Texto>}

      {reunioes.length === 0 && !carregando ? (
        <Vazio icone="people-outline" titulo="Nenhuma reunião cadastrada" />
      ) : (
        reunioes.map((r) => (
          <Cartao key={r.id}>
            <Texto style={{ fontWeight: "700" }}>{r.titulo}</Texto>
            <Texto variante="legenda" secundario>
              {`${formatarDataHora(r.inicio_previsto)} · ${ROTULO_STATUS[r.status]}`}
            </Texto>
            <View style={{ flexDirection: "row", gap: espaco.sm }}>
              {r.status === "AGENDADA" && (
                <>
                  <Botao titulo="Iniciar" icone="play" onPress={() => void mudarStatus(r.id, "iniciar")} />
                  <Botao titulo="Cancelar" variante="texto" onPress={() => void mudarStatus(r.id, "cancelar")} />
                </>
              )}
              {r.status === "EM_ANDAMENTO" && (
                <Botao titulo="Finalizar" icone="stop" onPress={() => void mudarStatus(r.id, "finalizar")} />
              )}
            </View>
          </Cartao>
        ))
      )}
    </Tela>
  );
}
