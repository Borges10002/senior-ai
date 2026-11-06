import { Directory, File, Paths } from "expo-file-system";

const pasta = () => new Directory(Paths.document, "gravacoes");
const extensao = (uri: string) => (/\.mov$/i.test(uri) ? "mov" : "mp4");

/**
 * O vídeo sai do cache e fica na área do app até o envio dar certo.
 * Sem isso, uma falha de internet ou o app fechado perderia a gravação da reunião.
 */
export function guardarGravacao(reuniaoId: string, uriTemporaria: string): string {
  pasta().create({ idempotent: true, intermediates: true });
  const destino = new File(pasta(), `${reuniaoId}.${extensao(uriTemporaria)}`);
  if (destino.exists) destino.delete();
  new File(uriTemporaria).move(destino);
  return destino.uri;
}

/** Gravação desta reunião que ainda não foi enviada, se houver. */
export function gravacaoPendente(reuniaoId: string): string | null {
  for (const nome of [`${reuniaoId}.mp4`, `${reuniaoId}.mov`]) {
    const arquivo = new File(pasta(), nome);
    if (arquivo.exists) return arquivo.uri;
  }
  return null;
}

export function apagarGravacaoLocal(uri: string): void {
  const arquivo = new File(uri);
  if (arquivo.exists) arquivo.delete();
}
