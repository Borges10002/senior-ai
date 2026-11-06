import { inject, injectable } from "tsyringe";
import AppError from "@shared/errors/AppError";
import IUsuarioRepository from "@modules/usuario/domain/repositories/IUsuarioRepository";
import IAssinaturaRepository from "@modules/assinaturas/domain/repositories/IAssinaturaRepository";
import type { IGatewayPagamento } from "@modules/assinaturas/domain/IGatewayPagamento";
import { CicloAssinatura, configPlano, documentoValido } from "@modules/assinaturas/domain/plano";
import { hojeNoFuso } from "@utils/dataCalendario";
import { ObterAssinaturaUseCase } from "./ObterAssinaturaUseCase";

/**
 * Cria (ou reaproveita) a assinatura no gateway e devolve o link da fatura.
 * Quem assina durante o teste só paga a 1ª cobrança no fim dele.
 */
@injectable()
export class AssinarPlanoUseCase {
  constructor(
    @inject("AssinaturaRepository")
    private assinaturaRepository: IAssinaturaRepository,
    @inject("UsuarioRepository")
    private usuarioRepository: IUsuarioRepository,
    @inject("GatewayPagamento")
    private gateway: IGatewayPagamento,
    @inject(ObterAssinaturaUseCase)
    private obterAssinatura: ObterAssinaturaUseCase,
  ) {}

  async execute(codusuario: number, ciclo: CicloAssinatura, documentoInformado?: string, agora = new Date()) {
    const usuario = await this.usuarioRepository.findById(codusuario);
    if (!usuario) throw new AppError("Usuário não encontrado", 404);

    let assinatura = await this.obterAssinatura.garantir(codusuario, agora);

    // Já assinou e não cancelou: só devolve a fatura em aberto.
    if (assinatura.gateway_assinatura_id && assinatura.status !== "cancelada") {
      const link = (await this.linkEmAberto(assinatura.gateway_assinatura_id)) ?? assinatura.link_pagamento;
      if (link !== assinatura.link_pagamento) {
        await this.assinaturaRepository.update(assinatura.id, { link_pagamento: link });
      }
      return { link, jaAssinado: true };
    }

    const informado = documentoValido(documentoInformado);
    const documento = informado ?? documentoValido(usuario.cpf);
    if (!documento) {
      throw new AppError("Informe um CPF ou CNPJ válido para emitir a cobrança.", 400);
    }
    if (informado && informado !== documentoValido(usuario.cpf)) {
      await this.usuarioRepository.update(codusuario, { cpf: informado });
    }

    let clienteId = assinatura.gateway_cliente_id;
    if (!clienteId) {
      clienteId = await this.gateway.criarCliente({
        nome: usuario.nome,
        email: usuario.email,
        documento,
        referencia: String(codusuario),
      });
      // Grava já: se a etapa seguinte falhar, não criamos outro cliente.
      assinatura = await this.assinaturaRepository.update(assinatura.id, { gateway_cliente_id: clienteId });
    }

    const plano = configPlano();
    const valor = plano.precos[ciclo];
    const hoje = hojeNoFuso(agora);
    const fimTrial = hojeNoFuso(new Date(assinatura.trial_fim));
    const emTrial = fimTrial > hoje;

    const gatewayAssinaturaId = await this.gateway.criarAssinatura({
      clienteId,
      valor,
      ciclo,
      primeiroVencimento: emTrial ? fimTrial : hoje,
      descricao: `${plano.nome} (${ciclo === "YEARLY" ? "anual" : "mensal"})`,
      referencia: String(codusuario),
    });

    // Grava o id antes de buscar o link: o webhook precisa achar a assinatura.
    await this.assinaturaRepository.update(assinatura.id, {
      gateway_assinatura_id: gatewayAssinaturaId,
      ciclo,
      valor,
      // Acesso segue pelo teste (se houver) e depois pelo período pago.
      status: "ativa",
      cancelada_em: null,
    });

    const link = await this.linkEmAberto(gatewayAssinaturaId).catch(() => null);
    if (link) await this.assinaturaRepository.update(assinatura.id, { link_pagamento: link });

    return { link, jaAssinado: false };
  }

  private async linkEmAberto(gatewayAssinaturaId: string): Promise<string | null> {
    const cobrancas = await this.gateway.cobrancas(gatewayAssinaturaId);
    const aberta = cobrancas.find((c) => ["PENDING", "OVERDUE"].includes(c.status));
    return aberta?.link ?? null;
  }
}
