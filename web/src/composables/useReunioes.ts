import { ref } from "vue";
import type { Reuniao } from "src/domain/models";
import { reuniaoService, type AcaoReuniao, type NovaReuniao } from "src/services/reuniaoService";

export function useReunioes() {
  const reunioes = ref<Reuniao[]>([]);
  const carregando = ref(false);

  async function carregar() {
    carregando.value = true;
    try {
      reunioes.value = await reuniaoService.listar();
    } finally {
      carregando.value = false;
    }
  }

  async function criar(dados: NovaReuniao) {
    await reuniaoService.criar(dados);
    await carregar();
  }

  async function mudarStatus(id: string, acao: AcaoReuniao) {
    await reuniaoService.mudarStatus(id, acao);
    await carregar();
  }

  async function excluir(id: string) {
    await reuniaoService.excluir(id);
    await carregar();
  }

  return { reunioes, carregando, carregar, criar, mudarStatus, excluir };
}
