import { z } from "zod";

const horario = z.string().describe('Horário do trecho de origem na transcrição, no formato "HH:MM:SS".');

/** Resultado da análise de uma reunião. É o formato exigido do modelo e validado na resposta. */
export const AnaliseSchema = z.object({
  resumo: z.string().describe("Resumo objetivo do que foi conversado."),
  assuntos: z.array(z.string()).describe("Assuntos discutidos."),
  decisoes: z.array(z.object({ descricao: z.string(), horario })).describe("Somente o que foi de fato decidido."),
  tarefas: z.array(
    z.object({
      titulo: z.string(),
      responsavel: z.string().nullable().describe("Nome citado na conversa; null se não ficou claro."),
      prazo: z.string().nullable().describe("Data no formato AAAA-MM-DD; null se não foi combinado."),
      horario,
    }),
  ),
  pendencias: z.array(z.string()).describe("Assuntos em aberto ou pontos que precisam de confirmação."),
  agendamentos: z.array(
    z.object({
      titulo: z.string(),
      inicio: z.string().nullable().describe("Data e hora com fuso, ISO 8601, ex.: 2026-11-10T15:00:00-04:00. null se o horário não foi definido."),
      duracao_minutos: z.number().nullable(),
      participantes: z.array(z.string()),
      confirmado: z.boolean().describe("true somente se a reunião foi combinada; false se foi apenas sugerida ou cogitada."),
      horario,
    }),
  ).describe("Próximas reuniões ou compromissos mencionados."),
});

export type AnaliseReuniao = z.infer<typeof AnaliseSchema>;
export type AgendamentoExtraido = AnaliseReuniao["agendamentos"][number];

export interface ContextoAnalise {
  transcricao: string;
  tituloReuniao: string;
  assunto: string | null;
  /** Data e hora da reunião, para resolver "amanhã", "terça que vem" etc. */
  dataReferencia: Date;
  fuso: string;
}

export default interface IAnalistaProvider {
  analisar(contexto: ContextoAnalise): Promise<AnaliseReuniao>;
}
