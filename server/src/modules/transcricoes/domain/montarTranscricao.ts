import type { TrechoTranscrito } from "./ITranscricaoProvider";

/** Junta as partes transcritas, levando cada horário para a posição real na gravação. */
export function juntarPartes(partes: { inicio: number; trechos: TrechoTranscrito[] }[]): TrechoTranscrito[] {
  return [...partes]
    .sort((a, b) => a.inicio - b.inicio)
    .flatMap(({ inicio, trechos }) =>
      trechos
        .map((t) => ({ inicio: t.inicio + inicio, fim: t.fim + inicio, texto: t.texto.trim() }))
        .filter((t) => t.texto),
    );
}

export function horario(segundos: number): string {
  const total = Math.floor(segundos);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/** Texto enviado para análise: cada linha mantém o horário, usado para citar o trecho de origem. */
export function textoComHorarios(trechos: Pick<TrechoTranscrito, "inicio" | "texto">[]): string {
  return trechos.map((t) => `[${horario(t.inicio)}] ${t.texto}`).join("\n");
}
