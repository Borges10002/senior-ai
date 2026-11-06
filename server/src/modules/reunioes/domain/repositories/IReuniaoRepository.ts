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
  findByIdDoProprietario(id: string, codusuario: number): Promise<Reuniao | null>;
  listByProprietario(codusuario: number, filtro: FiltroReunioes): Promise<Reuniao[]>;
  save(reuniao: Reuniao): Promise<Reuniao>;
  delete(id: string): Promise<void>;
  countAll(): Promise<number>;
  /** Reuniões agendadas ou em andamento que terminam depois de `apos`. */
  periodosOcupados(codusuario: number, apos: Date): Promise<{ inicio: Date; fim: Date }[]>;
}
