<template>
  <q-page class="mf-page plano-page">
    <header class="mf-page-header">
      <div>
        <div class="kicker"><q-icon name="workspace_premium" /> Plano e cobrança</div>
        <h1 class="mf-title">Minha assinatura</h1>
        <p class="mf-subtitle">Um plano só, com tudo incluído. Pague por Pix, boleto ou cartão.</p>
      </div>
      <q-btn flat round icon="refresh" :loading="carregando" aria-label="Atualizar" @click="atualizar" />
    </header>

    <div v-if="!dados && carregando" class="mf-card mf-empty">
      <q-spinner size="32px" color="primary" />
    </div>

    <div v-else-if="dados" class="grade">
      <!-- Situação atual -->
      <section class="mf-card situacao">
        <div class="situacao__topo">
          <span class="selo" :style="{ color: estilo.cor, background: estilo.fundo }">
            <q-icon :name="estilo.icone" /> {{ estilo.rotulo }}
          </span>
          <span v-if="!dados.cobrancaAtiva" class="mf-muted">Cobrança desligada neste ambiente</span>
        </div>

        <h2 class="situacao__titulo">{{ dados.plano.nome }}</h2>
        <p class="situacao__mensagem" :class="{ 'situacao__mensagem--alerta': somenteLeitura }">
          <q-icon :name="somenteLeitura ? 'lock' : 'info'" /> {{ dados.situacao.mensagem }}
        </p>

        <div v-if="dados.situacao.diasTrial > 0" class="trial">
          <div class="trial__legenda">
            <span>{{ aguardandoPrimeiraCobranca ? "Dias grátis antes da 1ª cobrança" : "Teste grátis" }}</span>
            <strong>{{ dados.situacao.diasTrial }} de {{ dados.plano.trialDias }} dias restantes</strong>
          </div>
          <div class="mf-bar"><span :style="{ width: `${progressoTrial}%` }" /></div>
        </div>

        <dl class="datas">
          <div v-if="dados.assinatura.ciclo">
            <dt>Ciclo</dt>
            <dd>{{ dados.assinatura.ciclo === "YEARLY" ? "Anual" : "Mensal" }} · {{ formatarMoeda(dados.assinatura.valor ?? 0) }}</dd>
          </div>
          <div>
            <dt>{{ aguardandoPrimeiraCobranca ? "1ª cobrança em" : "Teste grátis até" }}</dt>
            <dd>{{ formatarData(dados.assinatura.trial_fim) }}</dd>
          </div>
          <div v-if="dados.assinatura.periodo_fim">
            <dt>{{ dados.assinatura.status === "cancelada" ? "Acesso até" : "Pago até" }}</dt>
            <dd>{{ formatarData(dados.assinatura.periodo_fim) }}</dd>
          </div>
        </dl>

        <div v-if="dados.assinatura.assinado" class="situacao__acoes">
          <q-btn
            v-if="dados.assinatura.link_pagamento"
            unelevated
            no-caps
            color="primary"
            icon="pix"
            :label="aguardandoPrimeiraCobranca ? 'Pagar agora (opcional)' : 'Pagar fatura em aberto'"
            :href="dados.assinatura.link_pagamento"
            target="_blank"
            rel="noopener"
          />
          <q-btn flat no-caps color="negative" icon="cancel" label="Cancelar assinatura" @click="confirmarCancelamento" />
        </div>

        <ul class="garantias">
          <li><q-icon name="lock_open" /> Seus dados nunca são apagados por falta de pagamento: ficam disponíveis para consulta.</li>
          <li><q-icon name="event_repeat" /> Cancele quando quiser; o período pago continua valendo.</li>
          <li><q-icon name="shield" /> Pagamento processado pelo Asaas, instituição autorizada pelo Banco Central.</li>
        </ul>
      </section>

      <!-- Oferta -->
      <section v-if="!dados.assinatura.assinado" class="mf-card oferta">
        <div class="ciclos" role="tablist">
          <button
            v-for="c in ciclos"
            :key="c.valor"
            type="button"
            class="ciclos__opcao"
            :class="{ 'ciclos__opcao--ativa': ciclo === c.valor }"
            @click="ciclo = c.valor"
          >
            {{ c.rotulo }}
            <span v-if="c.valor === 'YEARLY' && economiaAnual > 0" class="ciclos__economia">-{{ economiaAnual }}%</span>
          </button>
        </div>

        <div class="preco">
          <span class="preco__valor">{{ formatarMoeda(precoPorMes) }}</span>
          <span class="preco__periodo">/mês</span>
        </div>
        <p class="mf-muted preco__detalhe">
          {{
            ciclo === "YEARLY"
              ? `${formatarMoeda(dados.plano.precos.YEARLY)} cobrados uma vez por ano`
              : "Cobrado todo mês, sem fidelidade"
          }}
        </p>

        <ul class="recursos">
          <li v-for="r in RECURSOS_PRO" :key="r.texto"><q-icon :name="r.icone" /> {{ r.texto }}</li>
        </ul>

        <q-input
          v-model="documento"
          outlined
          dense
          label="CPF ou CNPJ (para emitir a cobrança)"
          :mask="cnpj ? '##.###.###/####-##' : '###.###.###-##'"
          :rules="[(v) => !v || digitos(v).length === (cnpj ? 14 : 11) || (cnpj ? 'CNPJ incompleto' : 'CPF incompleto')]"
          hint="Só precisa informar na primeira vez"
          class="q-mb-md"
        >
          <template #prepend><q-icon name="badge" /></template>
          <template #append>
            <q-btn flat dense no-caps size="sm" :label="cnpj ? 'Usar CPF' : 'É CNPJ?'" @click="alternarDocumento" />
          </template>
        </q-input>

        <q-btn
          unelevated
          no-caps
          color="primary"
          size="lg"
          class="full-width"
          icon-right="arrow_forward"
          :label="dados.situacao.diasTrial > 0 ? 'Assinar agora (1ª cobrança no fim do teste)' : 'Assinar e pagar'"
          :loading="assinando"
          :disable="!dados.cobrancaAtiva"
          @click="assinar"
        />
        <p class="formas"><q-icon name="pix" /> Pix · <q-icon name="receipt" /> Boleto · <q-icon name="credit_card" /> Cartão</p>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { extractApiErrorMessage } from "src/boot/axios";
import { useAssinatura } from "src/composables/useAssinatura";
import { RECURSOS_PRO, STATUS_ASSINATURA, assinaturaService, type CicloAssinatura } from "src/services/assinaturaService";
import { formatarMoeda } from "src/domain/format";

const $q = useQuasar();
const { dados, somenteLeitura, carregar, definir } = useAssinatura();

const carregando = ref(false);
const assinando = ref(false);
const ciclo = ref<CicloAssinatura>("YEARLY");
const documento = ref("");
const cnpj = ref(false);

const ciclos: { valor: CicloAssinatura; rotulo: string }[] = [
  { valor: "MONTHLY", rotulo: "Mensal" },
  { valor: "YEARLY", rotulo: "Anual" },
];

const digitos = (v: string) => String(v ?? "").replace(/\D/g, "");
const formatarData = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

const estilo = computed(() => STATUS_ASSINATURA[dados.value?.assinatura.status ?? "trial"]);
// Assinou durante o teste: os dias grátis continuam e a 1ª cobrança vence no fim deles.
const aguardandoPrimeiraCobranca = computed(
  () =>
    !!dados.value?.assinatura.assinado &&
    dados.value.assinatura.status === "ativa" &&
    !dados.value.assinatura.periodo_fim &&
    dados.value.situacao.diasTrial > 0,
);
const economiaAnual = computed(() => {
  const p = dados.value?.plano.precos;
  if (!p) return 0;
  return Math.max(0, Math.round((1 - p.YEARLY / (p.MONTHLY * 12)) * 100));
});
const precoPorMes = computed(() => {
  const p = dados.value?.plano.precos;
  if (!p) return 0;
  return ciclo.value === "YEARLY" ? p.YEARLY / 12 : p.MONTHLY;
});
const progressoTrial = computed(() => {
  const d = dados.value;
  if (!d) return 0;
  return Math.round(((d.plano.trialDias - d.situacao.diasTrial) / d.plano.trialDias) * 100);
});

function alternarDocumento() {
  cnpj.value = !cnpj.value;
  documento.value = "";
}

async function atualizar() {
  carregando.value = true;
  await carregar();
  carregando.value = false;
}

async function assinar() {
  const doc = digitos(documento.value);
  if (doc && doc.length !== (cnpj.value ? 14 : 11)) {
    $q.notify({ type: "warning", message: "Confira o CPF/CNPJ informado." });
    return;
  }
  // Abre a aba já no clique: navegadores bloqueiam pop-up aberto depois de um await.
  const aba = window.open("", "_blank");
  assinando.value = true;
  try {
    const { link } = await assinaturaService.assinar(ciclo.value, doc || undefined);
    await carregar();
    if (link && aba) {
      aba.location.href = link;
    } else {
      aba?.close();
      if (link) window.location.href = link;
    }
    $q.notify({
      type: "positive",
      message: link
        ? "Assinatura criada! Conclua o pagamento na página da fatura."
        : "Assinatura criada! A fatura chega no seu e-mail.",
    });
  } catch (erro) {
    aba?.close();
    $q.notify({ type: "negative", message: extractApiErrorMessage(erro) });
  } finally {
    assinando.value = false;
  }
}

function confirmarCancelamento() {
  $q.dialog({
    title: "Cancelar assinatura?",
    message:
      "A cobrança recorrente para agora. Você mantém o acesso até o fim do período já pago e depois a conta fica só para consulta.",
    cancel: { flat: true, noCaps: true, label: "Manter assinatura" },
    ok: { unelevated: true, noCaps: true, color: "negative", label: "Cancelar" },
    persistent: true,
  }).onOk(async () => {
    try {
      definir(await assinaturaService.cancelar());
      $q.notify({ type: "info", message: "Assinatura cancelada." });
    } catch (erro) {
      $q.notify({ type: "negative", message: extractApiErrorMessage(erro) });
    }
  });
}

onMounted(atualizar);
</script>

<style scoped lang="scss">
.kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--mf-primary);
  font-weight: 600;
  font-size: 0.85rem;
}

.grade {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 20px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.mf-card {
  padding: 24px;
}

.selo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.85rem;
}

.situacao {
  &__topo {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  &__titulo {
    margin: 14px 0 4px;
    font-size: 1.5rem;
    font-weight: 700;
  }
  &__mensagem {
    display: flex;
    gap: 8px;
    color: var(--mf-text-muted);
    &--alerta {
      color: var(--mf-expense);
      font-weight: 600;
    }
  }
  &__acoes {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 16px 0;
  }
}

.trial {
  margin: 16px 0;
  &__legenda {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 0.9rem;
  }
}

.datas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin: 16px 0 0;
  dt {
    color: var(--mf-text-muted);
    font-size: 0.8rem;
  }
  dd {
    margin: 2px 0 0;
    font-weight: 600;
  }
}

.garantias,
.recursos {
  list-style: none;
  padding: 0;
  margin: 18px 0 0;
  display: grid;
  gap: 10px;
  li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    .q-icon {
      font-size: 1.2rem;
      color: var(--mf-primary);
      flex-shrink: 0;
    }
  }
}

.garantias {
  border-top: 1px solid var(--mf-border);
  padding-top: 16px;
  font-size: 0.9rem;
  color: var(--mf-text-muted);
}

.recursos {
  margin: 18px 0 22px;
  .q-icon {
    color: var(--mf-income) !important;
  }
}

.oferta {
  border: 2px solid var(--mf-primary);
}

.ciclos {
  display: inline-flex;
  padding: 4px;
  border-radius: 999px;
  background: var(--mf-surface-alt);
  &__opcao {
    border: 0;
    background: transparent;
    padding: 8px 18px;
    border-radius: 999px;
    font: inherit;
    font-weight: 600;
    color: var(--mf-text-muted);
    cursor: pointer;
    display: inline-flex;
    gap: 6px;
    align-items: center;
    &--ativa {
      background: var(--mf-surface);
      color: var(--mf-text);
      box-shadow: 0 1px 4px rgba(15, 27, 45, 0.12);
    }
  }
  &__economia {
    font-size: 0.75rem;
    color: var(--mf-income);
    background: var(--mf-income-soft);
    padding: 1px 6px;
    border-radius: 999px;
  }
}

.preco {
  margin-top: 18px;
  &__valor {
    font-size: 2.4rem;
    font-weight: 800;
  }
  &__periodo {
    color: var(--mf-text-muted);
    margin-left: 4px;
  }
  &__detalhe {
    margin: 0;
  }
}

.formas {
  margin: 12px 0 0;
  text-align: center;
  color: var(--mf-text-muted);
  font-size: 0.85rem;
}
</style>
