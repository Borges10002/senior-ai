import { execFile } from "child_process";
import { readdir } from "fs/promises";
import { join } from "path";
import { promisify } from "util";
import type IExtratorAudio from "@modules/transcricoes/domain/IExtratorAudio";
import type { ParteAudio } from "@modules/transcricoes/domain/IExtratorAudio";

const executar = promisify(execFile);

// Mono 16 kHz a 32 kbps dá cerca de 2,4 MB a cada 20 min: bem abaixo do limite de 25 MB do Whisper.
const DURACAO_PARTE_SEG = 20 * 60;

export class FfmpegExtratorAudio implements IExtratorAudio {
  async extrair(caminhoVideo: string, pastaSaida: string): Promise<ParteAudio[]> {
    await executar(
      "ffmpeg",
      [
        "-hide_banner", "-loglevel", "error", "-y",
        "-i", caminhoVideo,
        "-vn", "-ac", "1", "-ar", "16000", "-c:a", "libmp3lame", "-b:a", "32k",
        "-f", "segment", "-segment_time", String(DURACAO_PARTE_SEG), "-reset_timestamps", "1",
        join(pastaSaida, "parte-%04d.mp3"),
      ],
      { timeout: 60 * 60 * 1000, maxBuffer: 1024 * 1024 },
    );

    const arquivos = (await readdir(pastaSaida)).filter((n) => /^parte-\d+\.mp3$/.test(n)).sort();
    return arquivos.map((nome, i) => ({ caminho: join(pastaSaida, nome), inicio: i * DURACAO_PARTE_SEG }));
  }
}
