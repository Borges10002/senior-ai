import type { Sessao } from "@modules/auth/infra/typeorm/entities/Sessao";

export default interface ISessaoRepository {
  create(sessao: Sessao): Promise<Sessao>;
  findById(id: string): Promise<Sessao | null>;
  save(sessao: Sessao): Promise<Sessao>;
  revogarTodasDoUsuario(usuarioId: string): Promise<void>;
}
