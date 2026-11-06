import { inject, injectable } from "tsyringe";
import IAssinaturaRepository from "@modules/assinaturas/domain/repositories/IAssinaturaRepository";
import IVendaRepository from "@modules/assinaturas/domain/repositories/IVendaRepository";
import { PagamentoGateway, vendaDoPagamento } from "@modules/assinaturas/domain/vendas";
import { Venda } from "@modules/assinaturas/infra/typeorm/entities/Venda";

/**
 * Transforma cobrança paga em venda.
 * Idempotente: o mesmo pagamento informado de novo não duplica nada.
 */
@injectable()
export class RegistrarVendaUseCase {
  constructor(
    @inject("VendaRepository")
    private vendaRepository: IVendaRepository,
    @inject("AssinaturaRepository")
    private assinaturaRepository: IAssinaturaRepository,
  ) {}

  async execute(pagamento: PagamentoGateway, estorno = false): Promise<Venda | null> {
    if (!pagamento.id) return null;
    if (estorno) return this.estornar(String(pagamento.id));

    // Estorno vence aviso atrasado de pagamento: a venda existente não muda.
    const existente = await this.vendaRepository.findById(String(pagamento.id));
    if (existente) return existente;

    const dados = vendaDoPagamento(pagamento);
    if (!dados?.gateway_assinatura_id) return null;
    const assinatura = await this.assinaturaRepository.findByGatewayAssinatura(dados.gateway_assinatura_id);
    if (!assinatura) return null;

    return this.vendaRepository.salvar({
      ...dados,
      codusuario: Number(assinatura.codusuario),
      ciclo: assinatura.ciclo,
      status: "paga",
    });
  }

  private async estornar(id: string): Promise<Venda | null> {
    const venda = await this.vendaRepository.findById(id);
    if (!venda || venda.status === "estornada") return venda;
    return this.vendaRepository.salvar({ id, status: "estornada" });
  }
}
