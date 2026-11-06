import { useFocusEffect, useLocalSearchParams, router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import { ETAPA_GRAVACAO, estaProcessando, horarioDaFala, type ResultadoReuniao } from "@/domain/gravacao";
import { formatarDataHora } from "@/domain/reuniao";
import { gravacaoService } from "@/infra/api/gravacao-service";
import { gravacaoPendente } from "@/infra/storage/gravacao-local";
import { Botao, Carregando, Cartao, Secao, Tela, Texto, Vazio } from "@/ui/components/base";
import { espaco, useTema } from "@/ui/theme";

const INTERVALO_MS = 5000;

const STATUS_AGENDA = {
  CRIADO: "Agendada",
  CONFLITO: "Horário ocupado",
  SEM_HORARIO: "Combinada, sem horário definido",
  DATA_INVALIDA: "Data não reconhecida",
} as const;

/** O que o assessor registrou sobre a reunião. Atualiza sozinho enquanto processa. */
export default function ResultadoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cores } = useTema();
  const [dados, setDados] = useState<ResultadoReuniao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState<string | null>(null);
  const [mostrarTudo, setMostrarTudo] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setDados(await gravacaoService.resultado(id));
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar a reunião.");
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
      setPendente(gravacaoPendente(id));
    }, [carregar, id]),
  );

  const processando = dados ? estaProcessando(dados.gravacoes) : false;
  useEffect(() => {
    if (!processando) return;
    const ciclo = setInterval(() => void carregar(), INTERVALO_MS);
    return () => clearInterval(ciclo);
  }, [processando, carregar]);

  if (!dados) {
    return <Tela>{erro ? <Texto cor={cores.despesa}>{erro}</Texto> : <Carregando />}</Tela>;
  }

  const gravacao = dados.gravacoes.at(-1);
  const anotacao = dados.anotacoes.at(-1);
  const trechos = mostrarTudo ? dados.transcricao : dados.transcricao.slice(0, 8);

  return (
    <Tela onRefresh={carregar}>
      <Texto variante="titulo">{dados.reuniao.titulo}</Texto>
      {erro && <Texto cor={cores.despesa}>{erro}</Texto>}

      {pendente && (
        <Cartao>
          <Texto style={{ fontWeight: "700" }}>Gravação ainda não enviada</Texto>
          <Botao
            titulo="Enviar agora"
            icone="cloud-upload-outline"
            onPress={() => router.push({ pathname: "/gravar", params: { id, reenviar: "1" } })}
          />
        </Cartao>
      )}

      {!gravacao && !pendente && (
        <Vazio
          icone="videocam-outline"
          titulo="Esta reunião não foi gravada"
          acao={<Botao titulo="Gravar" onPress={() => router.push({ pathname: "/gravar", params: { id } })} />}
        />
      )}

      {gravacao && gravacao.status !== "CONCLUIDA" && (
        <Cartao>
          <Texto style={{ fontWeight: "700" }}>{ETAPA_GRAVACAO[gravacao.status]}</Texto>
          {processando && <Carregando />}
          {gravacao.erro && <Texto cor={cores.despesa}>{gravacao.erro}</Texto>}
          {gravacao.status === "FALHOU" && (
            <Botao
              titulo="Processar novamente"
              onPress={() => void gravacaoService.reprocessar(gravacao.id).then(carregar)}
            />
          )}
        </Cartao>
      )}

      {anotacao && (
        <>
          <Secao titulo="Resumo">
            <Cartao>
              <Texto>{anotacao.resumo}</Texto>
            </Cartao>
          </Secao>

          {anotacao.decisoes.length > 0 && (
            <Secao titulo="Decisões">
              {anotacao.decisoes.map((d) => (
                <Cartao key={`${d.horario}-${d.descricao}`}>
                  <Texto>{d.descricao}</Texto>
                  <Texto variante="legenda" secundario>{`Trecho ${d.horario}`}</Texto>
                </Cartao>
              ))}
            </Secao>
          )}

          {anotacao.tarefas.length > 0 && (
            <Secao titulo="Tarefas">
              {anotacao.tarefas.map((t) => (
                <Cartao key={`${t.horario}-${t.titulo}`}>
                  <Texto style={{ fontWeight: "700" }}>{t.titulo}</Texto>
                  <Texto variante="legenda" secundario>
                    {`${t.responsavel ?? "Responsável não identificado"} · ${t.prazo ?? "Sem prazo"}`}
                  </Texto>
                </Cartao>
              ))}
            </Secao>
          )}

          {anotacao.pendencias.length > 0 && (
            <Secao titulo="Pendências">
              <Cartao>
                {anotacao.pendencias.map((p) => (
                  <Texto key={p}>{`• ${p}`}</Texto>
                ))}
              </Cartao>
            </Secao>
          )}
        </>
      )}

      {dados.agendamentos.length > 0 && (
        <Secao titulo="Agenda">
          {dados.agendamentos.map((a) => (
            <Cartao key={a.id}>
              <Texto style={{ fontWeight: "700" }}>{a.titulo}</Texto>
              <Texto variante="legenda" cor={a.status === "CRIADO" ? cores.receita : cores.alerta}>
                {STATUS_AGENDA[a.status]}
              </Texto>
              {a.inicio && <Texto secundario>{formatarDataHora(a.inicio)}</Texto>}
              {a.sugestao_inicio && <Texto secundario>{`Próximo horário livre: ${formatarDataHora(a.sugestao_inicio)}`}</Texto>}
            </Cartao>
          ))}
        </Secao>
      )}

      {dados.transcricao.length > 0 && (
        <Secao titulo="Transcrição">
          <Cartao>
            <View style={{ gap: espaco.sm }}>
              {trechos.map((t) => (
                <Texto key={t.inicio}>{`${horarioDaFala(t.inicio)}  ${t.texto}`}</Texto>
              ))}
            </View>
            {dados.transcricao.length > trechos.length && (
              <Botao titulo="Ver transcrição completa" variante="texto" onPress={() => setMostrarTudo(true)} />
            )}
          </Cartao>
          <Texto variante="legenda" secundario>A transcrição automática não identifica quem falou.</Texto>
        </Secao>
      )}
    </Tela>
  );
}
