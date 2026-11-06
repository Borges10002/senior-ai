import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";
import { urlApkSegura } from "@/domain/seguranca";

/** Só o Android instala APK de dentro do app. */
export const INSTALACAO_NO_APP = Platform.OS === "android";

const FLAG_LER_URI = 1; // Intent.FLAG_GRANT_READ_URI_PERMISSION
const TIPO_APK = "application/vnd.android.package-archive";

export interface DownloadApk {
  /** Resolve com o arquivo baixado, ou null se foi cancelado. */
  concluido: Promise<string | null>;
  cancelar: () => void;
}

/** Baixa o APK da versão para o cache do app, informando o progresso (0 a 1). */
export function baixarApk(url: string, versao: string, onProgresso: (fracao: number) => void): DownloadApk {
  if (!urlApkSegura(url) || !/^\d{1,6}\.\d{1,6}\.\d{1,6}$/.test(versao)) {
    throw new Error("Endereço de atualização inválido.");
  }
  const destino = `${FileSystem.cacheDirectory}senior-ai-${versao}.apk`;
  const tarefa = FileSystem.createDownloadResumable(url, destino, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
    if (totalBytesExpectedToWrite > 0) onProgresso(totalBytesWritten / totalBytesExpectedToWrite);
  });
  let cancelado = false;
  return {
    concluido: tarefa.downloadAsync().then((r) => {
      if (cancelado || !r) return null;
      if (r.status !== 200) throw new Error(`Download falhou (${r.status})`);
      return r.uri;
    }),
    cancelar: () => {
      cancelado = true;
      void tarefa.cancelAsync().catch(() => undefined);
    },
  };
}

/** Abre o instalador do Android para o APK baixado (o usuário confirma na tela do sistema). */
export async function instalarApk(arquivo: string): Promise<void> {
  const data = await FileSystem.getContentUriAsync(arquivo);
  await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
    data,
    flags: FLAG_LER_URI,
    type: TIPO_APK,
  });
}
