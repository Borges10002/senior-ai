import type { Anotacao } from "@modules/anotacoes/infra/typeorm/entities/Anotacao";

export default interface IAnotacaoRepository {
  /** Grava a anotação da gravação, substituindo a anterior se houver. */
  salvar(anotacao: Anotacao): Promise<Anotacao>;
  listByReuniao(reuniaoId: string, codusuario: number): Promise<Anotacao[]>;
}
