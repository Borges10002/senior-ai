import { File, UploadType } from "expo-file-system";

import { mimeDoVideo, type ResultadoReuniao } from "@/domain/gravacao";
import { API_URL } from "@/infra/config";

import { ApiError, exigirConexaoSegura, request, tokenDaSessao } from "./http-client";

const mensagemDoEnvio = (corpo: string): string => {
  try {
    const dados = JSON.parse(corpo) as { message?: unknown };
    if (typeof dados.message === "string") return dados.message;
  } catch {
    // corpo não é JSON: usa a mensagem padrão
  }
  return "Não foi possível enviar a gravação. Tente novamente.";
};

export const gravacaoService = {
  resultado: (reuniaoId: string) => request<ResultadoReuniao>(`/reunioes/${reuniaoId}/resultado`),
  reprocessar: (gravacaoId: string) => request<void>(`/gravacoes/${gravacaoId}/reprocessar`, { method: "POST" }),

  /** Envia o vídeo com progresso de 0 a 1. Ao chamar, já houve confirmação de aviso aos participantes. */
  async enviar(reuniaoId: string, uri: string, duracaoSeg: number | null, aoProgredir: (fracao: number) => void) {
    exigirConexaoSegura();
    // A chamada renova a sessão se o token venceu durante a reunião.
    await request("/usuarios");
    const token = tokenDaSessao();
    if (!token) throw new ApiError("Sessão expirada. Entre novamente.", 401);

    const tarefa = new File(uri).createUploadTask(`${API_URL}/reunioes/${reuniaoId}/gravacoes`, {
      uploadType: UploadType.MULTIPART,
      fieldName: "video",
      mimeType: mimeDoVideo(uri),
      headers: { Authorization: `Bearer ${token}` },
      parameters: {
        consentimento: "true",
        ...(duracaoSeg !== null ? { duracao_seg: String(duracaoSeg) } : {}),
      },
      onProgress: ({ bytesSent, totalBytes }) => {
        if (totalBytes > 0) aoProgredir(Math.min(1, bytesSent / totalBytes));
      },
    });

    const resposta = await tarefa.uploadAsync();
    // uploadAsync resolve mesmo com erro HTTP.
    if (resposta.status !== 201) throw new ApiError(mensagemDoEnvio(resposta.body), resposta.status);
  },
};
