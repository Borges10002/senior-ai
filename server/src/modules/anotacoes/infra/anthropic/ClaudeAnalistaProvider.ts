import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { AnaliseSchema } from "@modules/anotacoes/domain/analise";
import type IAnalistaProvider from "@modules/anotacoes/domain/analise";
import type { AnaliseReuniao, ContextoAnalise } from "@modules/anotacoes/domain/analise";
import { INSTRUCOES, mensagemDaReuniao } from "./prompt";

export class ClaudeAnalistaProvider implements IAnalistaProvider {
  async analisar(contexto: ContextoAnalise): Promise<AnaliseReuniao> {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY não configurada.");
    const cliente = new Anthropic();

    const resposta = await cliente.beta.messages.parse({
      model: process.env.ANALISE_MODELO || "claude-opus-5-5",
      max_tokens: 16000,
      // Se a classificação de segurança recusar, o servidor tenta o modelo de reserva.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: INSTRUCOES,
      messages: [{ role: "user", content: mensagemDaReuniao(contexto) }],
      output_config: { effort: "high", format: betaZodOutputFormat(AnaliseSchema) },
    });

    if (resposta.stop_reason === "refusal") throw new Error("A análise foi recusada pelo modelo.");
    if (resposta.stop_reason === "max_tokens") throw new Error("A análise excedeu o tamanho máximo de resposta.");
    if (!resposta.parsed_output) throw new Error("A análise voltou fora do formato esperado.");
    return resposta.parsed_output;
  }
}
