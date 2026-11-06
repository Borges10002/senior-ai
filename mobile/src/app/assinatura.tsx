import Ionicons from "@expo/vector-icons/Ionicons";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import { Alert, View } from "react-native";

import { formatarMoeda } from "@/domain/format";
import { urlHttpsSegura } from "@/domain/seguranca";
import { assinaturaService, type CicloAssinatura, type MinhaAssinatura } from "@/infra/api/services";
import {
  BarraProgresso,
  Botao,
  Campo,
  Carregando,
  Cartao,
  Icone,
  Segmentado,
  Tela,
  Texto,
  type IconName,
} from "@/ui/components/base";
import { espaco, useTema } from "@/ui/theme";

const RECURSOS: { icone: IconName; texto: string }[] = [
  { icone: "people-outline", texto: "Reuniões ilimitadas, do agendamento ao encerramento" },
  { icone: "mic-outline", texto: "Gravação e transcrição das conversas" },
  { icone: "document-text-outline", texto: "Atas geradas por inteligência artificial" },
  { icone: "checkmark-done-outline", texto: "Decisões, tarefas e responsáveis extraídos automaticamente" },
  { icone: "desktop-outline", texto: "Mesmo acesso no web e no celular" },
];

const mensagemErro = (e: unknown) =>
  e instanceof Error ? e.message : "Não foi possível carregar o plano.";

const formatarDia = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

export default function AssinaturaScreen() {
  const { cores } = useTema();
  const [dados, setDados] = useState<MinhaAssinatura | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [assinando, setAssinando] = useState(false);
  const [ciclo, setCiclo] = useState<CicloAssinatura>("YEARLY");
  const [documento, setDocumento] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setAtualizando(true);
    try {
      setDados(await assinaturaService.minha());
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    assinaturaService.minha().then(
      (d) => ativo && setDados(d),
      (e) => ativo && setErro(mensagemErro(e)),
    );
    return () => {
      ativo = false;
    };
  }, []);

  if (!dados) {
    return (
      <Tela onRefresh={carregar} atualizando={atualizando}>
        {erro ? <Texto cor={cores.despesa}>{erro}</Texto> : <Carregando />}
      </Tela>
    );
  }

  const { plano, assinatura, situacao } = dados;
  const leitura = situacao.acesso === "leitura";
  const economia = Math.max(0, Math.round((1 - plano.precos.YEARLY / (plano.precos.MONTHLY * 12)) * 100));
  const porMes = ciclo === "YEARLY" ? plano.precos.YEARLY / 12 : plano.precos.MONTHLY;
  const estilo = {
    trial: { rotulo: "Teste grátis", cor: cores.primaria, fundo: cores.primariaSuave, icone: "hourglass-outline" },
    ativa: { rotulo: "Ativa", cor: cores.receita, fundo: cores.receitaSuave, icone: "checkmark-circle-outline" },
    inadimplente: { rotulo: "Pagamento pendente", cor: cores.alerta, fundo: cores.alertaSuave, icone: "alert-circle-outline" },
    cancelada: { rotulo: "Cancelada", cor: cores.despesa, fundo: cores.despesaSuave, icone: "close-circle-outline" },
  }[assinatura.status] as { rotulo: string; cor: string; fundo: string; icone: IconName };

  async function abrir(link: string) {
    if (!urlHttpsSegura(link)) {
      setErro("Endereço de pagamento inválido.");
      return;
    }
    try {
      await WebBrowser.openBrowserAsync(link);
      await carregar();
    } catch {
      setErro("Não foi possível abrir o pagamento.");
    }
  }

  async function assinar() {
    setErro(null);
    const doc = documento.replace(/\D/g, "");
    if (doc && doc.length !== 11 && doc.length !== 14) return setErro("CPF (11) ou CNPJ (14 dígitos).");
    setAssinando(true);
    try {
      const { link } = await assinaturaService.assinar(ciclo, doc || undefined);
      await carregar();
      if (link) await abrir(link);
      else Alert.alert("Assinatura criada", "A fatura chega no seu e-mail.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível assinar agora.");
    } finally {
      setAssinando(false);
    }
  }

  function cancelar() {
    Alert.alert(
      "Cancelar assinatura?",
      "A cobrança para agora. Você mantém o acesso até o fim do período já pago.",
      [
        { text: "Manter", style: "cancel" },
        {
          text: "Cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              setDados(await assinaturaService.cancelar());
            } catch (e) {
              Alert.alert("Erro", e instanceof Error ? e.message : "Não foi possível cancelar.");
            }
          },
        },
      ],
    );
  }

  return (
    <Tela onRefresh={carregar} atualizando={atualizando}>
      <Cartao>
        <View style={{ flexDirection: "row", alignItems: "center", gap: espaco.md }}>
          <Icone nome={estilo.icone} cor={estilo.cor} fundo={estilo.fundo} />
          <View style={{ flex: 1 }}>
            <Texto variante="subtitulo">{plano.nome}</Texto>
            <Texto cor={estilo.cor} style={{ fontWeight: "700" }}>{estilo.rotulo}</Texto>
          </View>
        </View>
        <Texto cor={leitura ? cores.despesa : undefined} secundario={!leitura}>
          {situacao.mensagem}
        </Texto>
        {situacao.diasTrial > 0 && (
          <View style={{ gap: espaco.xs }}>
            <Texto variante="legenda" secundario>
              {situacao.diasTrial} de {plano.trialDias} dias de teste restantes
            </Texto>
            <BarraProgresso valor={(plano.trialDias - situacao.diasTrial) / plano.trialDias} />
          </View>
        )}
        {assinatura.periodo_fim && (
          <Texto variante="legenda" secundario>
            {assinatura.status === "cancelada" ? "Acesso até " : "Pago até "}
            {formatarDia(assinatura.periodo_fim)}
          </Texto>
        )}
        {assinatura.assinado && (
          <View style={{ gap: espaco.sm }}>
            {assinatura.link_pagamento && (
              <Botao titulo="Pagar fatura em aberto" icone="card-outline" onPress={() => abrir(assinatura.link_pagamento!)} />
            )}
            <Botao titulo="Cancelar assinatura" variante="texto" onPress={cancelar} />
          </View>
        )}
      </Cartao>

      {!assinatura.assinado && (
        <Cartao>
          <Segmentado
            opcoes={[
              { valor: "MONTHLY", rotulo: "Mensal" },
              { valor: "YEARLY", rotulo: economia ? `Anual (-${economia}%)` : "Anual" },
            ]}
            valor={ciclo}
            onChange={setCiclo}
          />
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: espaco.xs }}>
            <Texto variante="titulo">{formatarMoeda(porMes)}</Texto>
            <Texto secundario>/mês</Texto>
          </View>
          <Texto variante="legenda" secundario>
            {ciclo === "YEARLY"
              ? `${formatarMoeda(plano.precos.YEARLY)} cobrados uma vez por ano`
              : "Cobrado todo mês, sem fidelidade"}
          </Texto>

          {RECURSOS.map((r) => (
            <View key={r.texto} style={{ flexDirection: "row", gap: espaco.sm, alignItems: "center" }}>
              <Ionicons name={r.icone} size={20} color={cores.receita} />
              <Texto style={{ flex: 1 }}>{r.texto}</Texto>
            </View>
          ))}

          <Campo
            rotulo="CPF ou CNPJ (para emitir a cobrança)"
            value={documento}
            onChangeText={setDocumento}
            keyboardType="number-pad"
            maxLength={18}
            placeholder="Só na primeira vez"
            erro={erro}
          />
          <Botao
            titulo={situacao.diasTrial > 0 ? "Assinar (paga no fim do teste)" : "Assinar e pagar"}
            icone="arrow-forward"
            onPress={assinar}
            carregando={assinando}
            desabilitado={!dados.cobrancaAtiva}
          />
          <Texto variante="legenda" secundario style={{ textAlign: "center" }}>
            Pix, boleto ou cartão · pagamento seguro pelo Asaas
          </Texto>
        </Cartao>
      )}

      <Texto variante="legenda" secundario style={{ textAlign: "center" }}>
        Sem pagamento seus dados não são apagados: ficam disponíveis para consulta.
      </Texto>
    </Tela>
  );
}
