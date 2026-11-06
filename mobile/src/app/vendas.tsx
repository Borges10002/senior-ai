import Stack from "expo-router/stack";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import { formatarMoeda } from "@/domain/format";
import { adminService, type PainelVendas } from "@/infra/api/services";
import { Botao, Cartao, Carregando, Icone, Secao, Tela, Texto, Vazio, type IconName } from "@/ui/components/base";
import { BarrasHorizontais, GraficoBarras, LegendaFatias, Rosca } from "@/ui/components/graficos";
import { espaco, useTema } from "@/ui/theme";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const NOME_CICLO = { MONTHLY: "Mensal", YEARLY: "Anual" } as const;
const NOME_FORMA: Record<string, string> = {
  PIX: "Pix",
  BOLETO: "Boleto",
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
  OUTROS: "Outros",
};
const CORES_FORMA = ["#0E9F6E", "#2457F5", "#D98E04", "#8B5CF6"];

const mensagemErro = (e: unknown) => (e instanceof Error ? e.message : "Não foi possível carregar as vendas.");
const rotuloMes = (mes: string) => MESES[Number(mes.slice(5, 7)) - 1];

/** Painel do administrador: vendas do plano Pro e receita que entrou. */
export default function VendasScreen() {
  const { cores } = useTema();
  const [painel, setPainel] = useState<PainelVendas | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  const carregar = useCallback(async (consultarGateway = false) => {
    const marcar = consultarGateway ? setSincronizando : setAtualizando;
    marcar(true);
    try {
      setPainel(await (consultarGateway ? adminService.sincronizarVendas() : adminService.vendas()));
      setErro(null);
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      marcar(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    adminService.vendas().then(
      (p) => ativo && setPainel(p),
      (e) => ativo && setErro(mensagemErro(e)),
    );
    return () => {
      ativo = false;
    };
  }, []);

  const cabecalho = <Stack.Screen options={{ headerShown: true, title: "Vendas" }} />;

  if (!painel) {
    return (
      <Tela onRefresh={() => carregar()} atualizando={atualizando}>
        {cabecalho}
        {erro ? <Texto cor={cores.despesa}>{erro}</Texto> : <Carregando />}
      </Tela>
    );
  }

  const r = painel.resumo;
  const variacao = r.receitaMesAnterior
    ? Math.round(((r.receitaMes - r.receitaMesAnterior) / r.receitaMesAnterior) * 100)
    : null;
  const formas = r.porForma.map((f, i) => ({
    rotulo: NOME_FORMA[f.forma] ?? f.forma,
    valor: f.valor,
    cor: CORES_FORMA[i % CORES_FORMA.length],
  }));

  return (
    <Tela onRefresh={() => carregar()} atualizando={atualizando}>
      {cabecalho}

      <Cartao style={{ backgroundColor: cores.primaria, borderColor: cores.primaria }}>
        <Texto cor={cores.sobrePrimaria} style={{ opacity: 0.85 }}>Recebido neste mês</Texto>
        <Texto variante="destaque" cor={cores.sobrePrimaria}>{formatarMoeda(r.receitaMes)}</Texto>
        <Texto variante="legenda" cor={cores.sobrePrimaria} style={{ opacity: 0.85 }}>
          {variacao === null
            ? `${r.vendasMes} venda(s) neste mês`
            : `${variacao >= 0 ? "▲" : "▼"} ${Math.abs(variacao)}% sobre o mês anterior · ${r.vendasMes} venda(s)`}
        </Texto>
      </Cartao>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: espaco.md }}>
        <Indicador icone="refresh-circle-outline" rotulo="MRR" valor={formatarMoeda(r.mrr)} detalhe="recorrente por mês" cor={cores.primaria} fundo={cores.primariaSuave} />
        <Indicador icone="ribbon-outline" rotulo="Assinantes" valor={String(r.assinantes.ativa)} detalhe={`${r.assinantes.trial} em teste`} cor="#8B5CF6" fundo={cores.superficieAlt} />
        <Indicador icone="wallet-outline" rotulo="Total recebido" valor={formatarMoeda(r.liquidoTotal)} detalhe={`${formatarMoeda(r.taxasTotal)} de taxas`} cor={cores.receita} fundo={cores.receitaSuave} />
        <Indicador icone="pricetag-outline" rotulo="Ticket médio" valor={formatarMoeda(r.ticketMedio)} detalhe={`${r.vendasTotal} venda(s)`} cor={cores.alerta} fundo={cores.alertaSuave} />
      </View>

      <Secao titulo="Receita dos últimos 12 meses">
        <Cartao>
          <GraficoBarras
            grupos={r.porMes.map((m) => ({
              rotulo: rotuloMes(m.mes),
              valores: [{ nome: "Recebido", valor: m.liquido, cor: cores.receita }],
            }))}
          />
        </Cartao>
      </Secao>

      <Secao titulo="Assinantes por situação">
        <Cartao>
          <BarrasHorizontais
            formatar={(v) => String(v)}
            itens={[
              { rotulo: "Ativas", valor: r.assinantes.ativa, cor: cores.receita },
              { rotulo: "Teste grátis", valor: r.assinantes.trial, cor: cores.primaria },
              { rotulo: "Pagamento atrasado", valor: r.assinantes.inadimplente, cor: cores.alerta },
              { rotulo: "Canceladas", valor: r.assinantes.cancelada, cor: cores.despesa },
            ]}
          />
        </Cartao>
      </Secao>

      {formas.length > 0 && (
        <Secao titulo="Forma de pagamento">
          <Cartao style={{ gap: espaco.lg }}>
            <Rosca
              fatias={formas}
              tamanho={150}
              centro={<Texto style={{ fontWeight: "800" }}>{formatarMoeda(r.receitaTotal)}</Texto>}
            />
            <LegendaFatias fatias={formas} />
          </Cartao>
        </Secao>
      )}

      <Secao titulo="Vendas recentes">
        {painel.vendas.length === 0 ? (
          <Vazio
            icone="cart-outline"
            titulo="Nenhuma venda ainda"
            descricao="Quando um assinante pagar, a venda aparece aqui. Se já houve pagamento, busque no Asaas."
          />
        ) : (
          <Cartao style={{ gap: 0 }}>
            {painel.vendas.slice(0, 30).map((v, i) => (
              <View
                key={v.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: espaco.md,
                  paddingVertical: espaco.sm,
                  borderTopWidth: i ? 1 : 0,
                  borderTopColor: cores.borda,
                }}
              >
                <Icone
                  nome={v.status === "paga" ? "checkmark" : "arrow-undo"}
                  cor={v.status === "paga" ? cores.receita : cores.despesa}
                  fundo={v.status === "paga" ? cores.receitaSuave : cores.despesaSuave}
                  tamanho={36}
                />
                <View style={{ flex: 1 }}>
                  <Texto style={{ fontWeight: "700" }} numberOfLines={1}>{v.comprador.nome}</Texto>
                  <Texto variante="legenda" secundario numberOfLines={1}>
                    {new Date(v.pago_em).toLocaleDateString("pt-BR")} · {v.ciclo ? NOME_CICLO[v.ciclo] : "—"} ·{" "}
                    {NOME_FORMA[v.forma_pagamento ?? "OUTROS"] ?? v.forma_pagamento}
                  </Texto>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Texto
                    style={{ fontWeight: "800", textDecorationLine: v.status === "paga" ? "none" : "line-through" }}
                    cor={v.status === "paga" ? cores.receita : cores.textoSecundario}
                  >
                    {formatarMoeda(v.valor_liquido ?? v.valor)}
                  </Texto>
                  {v.status === "estornada" && <Texto variante="legenda" cor={cores.despesa}>Estornada</Texto>}
                </View>
              </View>
            ))}
          </Cartao>
        )}
      </Secao>

      <Botao
        titulo={sincronizando ? "Buscando no Asaas..." : "Buscar vendas no Asaas"}
        variante="secundario"
        onPress={() => carregar(true)}
        desabilitado={sincronizando || !painel.gatewayConfigurado}
      />
      {erro && <Texto cor={cores.despesa}>{erro}</Texto>}
    </Tela>
  );
}

function Indicador({
  icone,
  rotulo,
  valor,
  detalhe,
  cor,
  fundo,
}: {
  icone: IconName;
  rotulo: string;
  valor: string;
  detalhe: string;
  cor: string;
  fundo: string;
}) {
  return (
    <Cartao style={{ flexBasis: "47%", flexGrow: 1, gap: espaco.xs }}>
      <Icone nome={icone} cor={cor} fundo={fundo} tamanho={34} />
      <Texto variante="legenda" secundario>{rotulo}</Texto>
      <Texto variante="subtitulo" numberOfLines={1}>{valor}</Texto>
      <Texto variante="legenda" secundario numberOfLines={1}>{detalhe}</Texto>
    </Cartao>
  );
}
