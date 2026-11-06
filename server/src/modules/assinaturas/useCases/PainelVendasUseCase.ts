import { inject, injectable } from "tsyringe";
import type { IGatewayPagamento } from "@modules/assinaturas/domain/IGatewayPagamento";
import IAssinaturaRepository from "@modules/assinaturas/domain/repositories/IAssinaturaRepository";
import IVendaRepository from "@modules/assinaturas/domain/repositories/IVendaRepository";
import { recebedorDasVendas, resumirVendas, ResumoVendas, StatusVenda } from "@modules/assinaturas/domain/vendas";
import type { CicloAssinatura } from "@modules/assinaturas/domain/plano";
import { ehAdministrador } from "@modules/usuario/domain/perfil";
import IUsuarioRepository from "@modules/usuario/domain/repositories/IUsuarioRepository";
import { SincronizarVendasUseCase } from "./SincronizarVendasUseCase";

export interface PainelVendas {
  recebedor: { codigo: number; nome: string; email: string } | null;
  gatewayConfigurado: boolean;
  resumo: ResumoVendas;
  vendas: {
    id: string;
    comprador: { codigo: number; nome: string; email: string | null };
    ciclo: CicloAssinatura | null;
    valor: number;
    valor_liquido: number | null;
    forma_pagamento: string | null;
    status: StatusVenda;
    pago_em: string;
  }[];
}

const LIMITE_LISTA = 100;

/** Painel do administrador: vendas do plano Pro, receita e assinantes. */
@injectable()
export class PainelVendasUseCase {
  constructor(
    @inject("VendaRepository")
    private vendaRepository: IVendaRepository,
    @inject("AssinaturaRepository")
    private assinaturaRepository: IAssinaturaRepository,
    @inject("UsuarioRepository")
    private usuarioRepository: IUsuarioRepository,
    @inject("GatewayPagamento")
    private gateway: IGatewayPagamento,
    @inject(SincronizarVendasUseCase)
    private sincronizar: SincronizarVendasUseCase,
  ) {}

  async execute({ consultarGateway = false } = {}): Promise<PainelVendas> {
    await this.sincronizar.execute({ consultarGateway });
    const [vendas, assinaturas, usuarios] = await Promise.all([
      this.vendaRepository.findAll(),
      this.assinaturaRepository.findAll(),
      this.usuarioRepository.findAll(),
    ]);
    const porCodigo = new Map(usuarios.map((u) => [Number(u.codigo), u]));
    const recebedor = recebedorDasVendas(usuarios, ehAdministrador);

    return {
      recebedor: recebedor
        ? { codigo: Number(recebedor.codigo), nome: recebedor.nome, email: recebedor.email }
        : null,
      gatewayConfigurado: this.gateway.configurado(),
      resumo: resumirVendas(vendas, assinaturas),
      vendas: vendas.slice(0, LIMITE_LISTA).map((v) => {
        const comprador = porCodigo.get(Number(v.codusuario));
        return {
          id: v.id,
          comprador: {
            codigo: Number(v.codusuario),
            nome: comprador?.nome ?? `Usuário ${v.codusuario}`,
            email: comprador?.email ?? null,
          },
          ciclo: v.ciclo,
          valor: Number(v.valor),
          valor_liquido: v.valor_liquido == null ? null : Number(v.valor_liquido),
          forma_pagamento: v.forma_pagamento,
          status: v.status,
          pago_em: new Date(v.pago_em).toISOString(),
        };
      }),
    };
  }
}
