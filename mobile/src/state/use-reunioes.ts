import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import type { Reuniao } from "@/domain/models";
import { reuniaoService, type AcaoReuniao } from "@/infra/api/services";

const mensagem = (e: unknown) => (e instanceof Error ? e.message : "Não foi possível carregar as reuniões.");

/** Lista de reuniões, recarregada sempre que a tela volta ao foco. */
export function useReunioes() {
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    try {
      setReunioes(await reuniaoService.listar());
      setErro(null);
    } catch (e) {
      setErro(mensagem(e));
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void recarregar();
    }, [recarregar]),
  );

  const mudarStatus = useCallback(
    async (id: string, acao: AcaoReuniao) => {
      try {
        await reuniaoService.mudarStatus(id, acao);
        await recarregar();
      } catch (e) {
        setErro(mensagem(e));
      }
    },
    [recarregar],
  );

  return { reunioes, carregando, erro, recarregar, mudarStatus };
}
