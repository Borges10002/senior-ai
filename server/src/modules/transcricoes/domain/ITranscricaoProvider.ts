export interface TrechoTranscrito {
  inicio: number; // segundos
  fim: number;
  texto: string;
}

/** Serviço que converte um arquivo de áudio em texto com horários. */
export default interface ITranscricaoProvider {
  transcrever(caminhoAudio: string): Promise<TrechoTranscrito[]>;
}
