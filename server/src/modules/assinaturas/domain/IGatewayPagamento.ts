import type { CicloAssinatura } from "./plano";
import type { PagamentoGateway } from "./vendas";

export interface ClienteGateway {
  nome: string;
  email: string;
  documento: string;
  referencia: string;
}

export interface NovaAssinaturaGateway {
  clienteId: string;
  valor: number;
  ciclo: CicloAssinatura;
  /** Vencimento da 1ª cobrança (YYYY-MM-DD). */
  primeiroVencimento: string;
  descricao: string;
  referencia: string;
}

export interface CobrancaGateway {
  id: string;
  status: string;
  vencimento: string;
  valor: number;
  link: string | null;
  /** Campos da cobrança usados para registrar a venda (líquido, forma, data paga). */
  dados?: PagamentoGateway;
}

/** Porta para o gateway de pagamento (Asaas hoje; trocável sem mexer nos casos de uso). */
export interface IGatewayPagamento {
  configurado(): boolean;
  criarCliente(cliente: ClienteGateway): Promise<string>;
  criarAssinatura(dados: NovaAssinaturaGateway): Promise<string>;
  /** Cobranças da assinatura, da mais recente para a mais antiga. */
  cobrancas(assinaturaId: string): Promise<CobrancaGateway[]>;
  cancelarAssinatura(assinaturaId: string): Promise<void>;
}
