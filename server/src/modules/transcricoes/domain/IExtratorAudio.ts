export interface ParteAudio {
  caminho: string;
  /** Posição da parte dentro da gravação, em segundos. */
  inicio: number;
}

/** Tira o áudio do vídeo e divide em partes que cabem no limite do serviço de transcrição. */
export default interface IExtratorAudio {
  extrair(caminhoVideo: string, pastaSaida: string): Promise<ParteAudio[]>;
}
