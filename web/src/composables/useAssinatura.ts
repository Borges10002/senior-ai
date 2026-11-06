import { sessionUser } from "src/services/session";
import { computed, ref } from "vue";
import { assinaturaService, type MinhaAssinatura, type SituacaoAcesso } from "src/services/assinaturaService";

// Estado global da assinatura. Quem decide o bloqueio é o backend (402);
// aqui só mostramos avisos e a tela do plano.
const dados = ref<MinhaAssinatura | null>(null);
const mostrarBloqueio = ref(false);
let carregamento: Promise<MinhaAssinatura | null> | null = null;

function carregar(): Promise<MinhaAssinatura | null> {
  if (!sessionUser.value) return Promise.resolve(null);
  carregamento ??= assinaturaService
    .minha()
    .then((d) => (dados.value = d))
    .catch(() => dados.value)
    .finally(() => {
      carregamento = null;
    });
  return carregamento;
}

function definir(novo: MinhaAssinatura) {
  dados.value = novo;
}

/** Chamado quando a API responde 402: atualiza a situação e abre o aviso. */
function sinalizarBloqueio(situacao?: SituacaoAcesso) {
  if (dados.value && situacao) dados.value = { ...dados.value, situacao };
  else void carregar();
  mostrarBloqueio.value = true;
}

export function useAssinatura() {
  return {
    dados: computed(() => dados.value),
    somenteLeitura: computed(() => dados.value?.situacao.acesso === "leitura"),
    /** Faltam poucos dias de teste e ainda não assinou. */
    trialAcabando: computed(
      () =>
        !!dados.value &&
        dados.value.cobrancaAtiva &&
        !dados.value.assinatura.assinado &&
        dados.value.situacao.diasTrial > 0 &&
        dados.value.situacao.diasTrial <= 3,
    ),
    mostrarBloqueio,
    carregar,
    definir,
    sinalizarBloqueio,
  };
}
