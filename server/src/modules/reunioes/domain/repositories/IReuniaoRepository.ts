import type { StatusReuniao } from "@modules/reunioes/domain/reuniao";
import type { Reuniao } from "@modules/reunioes/infra/typeorm/entities/Reuniao";

export interface FiltroReunioes {
  de?: Date;
  ate?: Date;
  status?: StatusReuniao;
}

export default interface IReuniaoRepository {
  create(reuniao: Reuniao): Promise<Reuniao>;
  /** Busca já restrita ao proprietário (RN014): reunião de outro usuário volta como null. */
  findByIdDoProprietario(id: string, proprietarioId: string): Promise<Reuniao | null>;
  listByProprietario(proprietarioId: string, filtro: FiltroReunioes): Promise<Reuniao[]>;
  save(reuniao: Reuniao): Promise<Reuniao>;
  delete(id: string): Promise<void>;
}
