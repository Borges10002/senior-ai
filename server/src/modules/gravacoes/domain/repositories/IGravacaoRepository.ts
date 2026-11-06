import type { Gravacao } from "@modules/gravacoes/infra/typeorm/entities/Gravacao";

export default interface IGravacaoRepository {
  create(gravacao: Gravacao): Promise<Gravacao>;
  findById(id: string): Promise<Gravacao | null>;
  findByIdDoUsuario(id: string, codusuario: number): Promise<Gravacao | null>;
  listByReuniao(reuniaoId: string, codusuario: number): Promise<Gravacao[]>;
  atualizar(id: string, dados: Partial<Gravacao>): Promise<void>;
}
