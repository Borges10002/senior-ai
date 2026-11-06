import { createReadStream } from "fs";
import OpenAI from "openai";
import type ITranscricaoProvider from "@modules/transcricoes/domain/ITranscricaoProvider";
import type { TrechoTranscrito } from "@modules/transcricoes/domain/ITranscricaoProvider";

/** A API do Whisper devolve horários, mas não identifica quem falou. */
export class WhisperTranscricaoProvider implements ITranscricaoProvider {
  async transcrever(caminhoAudio: string): Promise<TrechoTranscrito[]> {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY não configurada.");
    const cliente = new OpenAI();

    const resposta = await cliente.audio.transcriptions.create({
      file: createReadStream(caminhoAudio),
      model: process.env.TRANSCRICAO_MODELO || "whisper-1",
      language: "pt",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    });

    return (resposta.segments ?? []).map((s) => ({ inicio: s.start, fim: s.end, texto: s.text }));
  }
}
