import { ref } from "vue";
import { api } from "src/boot/axios";
import type { Reuniao } from "src/domain/models";

export interface NovaReuniao {
  titulo: string;
  assunto?: string | null;
  inicio_previsto?: string | null;
  fim_previsto?: string | null;
}

export function useReunioes() {
  const reunioes = ref<Reuniao[]>([]);
  const carregando = ref(false);

  async function carregar() {
    carregando.value = true;
    try {
      reunioes.value = (await api.get<Reuniao[]>("/meetings")).data;
    } finally {
      carregando.value = false;
    }
  }

  async function criar(dados: NovaReuniao) {
    await api.post("/meetings", dados);
    await carregar();
  }

  async function mudarStatus(id: string, acao: "start" | "finish" | "cancel") {
    await api.post(`/meetings/${id}/${acao}`);
    await carregar();
  }

  return { reunioes, carregando, carregar, criar, mudarStatus };
}
