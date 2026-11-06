import { RecuperacaoSenha } from "@modules/accounts/infra/typeorm/entities/RecuperacaoSenha";

interface IRecuperacaoSenhaRepository {
  criar(dados: Pick<RecuperacaoSenha, "codusuario" | "token_hash" | "expira_em">): Promise<RecuperacaoSenha>;
  /** Pedido ainda não usado com este hash (pode estar vencido; quem chama confere). */
  buscarPorHash(token_hash: string): Promise<RecuperacaoSenha | null>;
  /** Consome o pedido e altera a senha na mesma transacao, com bloqueio por usuario. */
  redefinirSenha(token_hash: string, senhaHash: string): Promise<boolean>;
  /** Marca como usados todos os pedidos abertos do usuário. */
  encerrarDoUsuario(codusuario: number): Promise<void>;
}

export default IRecuperacaoSenhaRepository;
