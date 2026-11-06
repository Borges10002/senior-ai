export const STATUS_GRAVACAO = ["ENVIADA", "TRANSCREVENDO", "ANALISANDO", "CONCLUIDA", "FALHOU"] as const;
export type StatusGravacao = (typeof STATUS_GRAVACAO)[number];

export const TAMANHO_MAXIMO_BYTES = 4 * 1024 * 1024 * 1024; // 4 GB

/** Extensão guardada por tipo; o nome enviado pelo cliente nunca é usado. */
export const EXTENSOES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/3gpp": "3gp",
};

export function tipoAceito(mime: string): boolean {
  return Object.hasOwn(EXTENSOES, mime);
}

export function chaveDaGravacao(codusuario: number, reuniaoId: string, gravacaoId: string, mime: string): string {
  return `gravacoes/${codusuario}/${reuniaoId}/${gravacaoId}.${EXTENSOES[mime]}`;
}

export function podeReprocessar(status: StatusGravacao): boolean {
  return status === "FALHOU";
}
