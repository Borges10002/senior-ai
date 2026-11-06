import { urlApkSegura } from "./seguranca";

/** Última versão publicada do app Android (web/public/app-versao.json). */
export interface VersaoApp {
  versao: string;
  url: string;
  data?: string;
  /** Sem a opção "Depois": o usuário precisa atualizar para continuar. */
  obrigatoria?: boolean;
  novidades?: string[];
}

const partes = (v: string) => v.split(/[.-]/).map((p) => Number.parseInt(p, 10) || 0);

/** true quando `candidata` é mais nova que `atual` (ex.: 1.0.10 > 1.0.9). */
export function ehMaisNova(candidata: string, atual: string): boolean {
  const a = partes(candidata);
  const b = partes(atual);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diferenca = (a[i] ?? 0) - (b[i] ?? 0);
    if (diferenca !== 0) return diferenca > 0;
  }
  return false;
}

/** Aceita só o formato esperado; qualquer outra coisa é ignorada. */
export function lerVersaoApp(bruto: unknown): VersaoApp | null {
  const v = bruto as Partial<VersaoApp> | null;
  if (!v || typeof v.versao !== "string" || !/^\d{1,6}\.\d{1,6}\.\d{1,6}$/.test(v.versao) || typeof v.url !== "string" || !urlApkSegura(v.url)) {
    return null;
  }
  return {
    versao: v.versao,
    url: v.url,
    data: typeof v.data === "string" ? v.data : undefined,
    obrigatoria: v.obrigatoria === true,
    novidades: Array.isArray(v.novidades) ? v.novidades.filter((n) => typeof n === "string") : [],
  };
}
