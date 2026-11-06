import { lerVersaoApp, type VersaoApp } from "@/domain/versao";
import { VERSAO_URL } from "@/infra/config";

/** Última versão publicada; null sem internet ou com arquivo inválido. */
export async function buscarUltimaVersao(): Promise<VersaoApp | null> {
  try {
    // O parâmetro evita receber uma cópia antiga guardada em cache.
    const resposta = await fetch(`${VERSAO_URL}?t=${Date.now()}`, { headers: { Accept: "application/json" } });
    return resposta.ok ? lerVersaoApp(await resposta.json()) : null;
  } catch {
    return null;
  }
}
