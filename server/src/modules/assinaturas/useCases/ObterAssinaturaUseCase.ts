import { inject, injectable } from "tsyringe";
import IAssinaturaRepository from "@modules/assinaturas/domain/repositories/IAssinaturaRepository";
import { configPlano, planosAtivos, situacaoAcesso, somarDias } from "@modules/assinaturas/domain/plano";
import { Assinatura } from "@modules/assinaturas/infra/typeorm/entities/Assinatura";

/** Assinatura do usuário; quem ainda não tem ganha o teste grátis agora. */
@injectable()
export class ObterAssinaturaUseCase {
  constructor(
    @inject("AssinaturaRepository")
    private assinaturaRepository: IAssinaturaRepository,
  ) {}

  async garantir(codusuario: number, agora = new Date()): Promise<Assinatura> {
    const existente = await this.assinaturaRepository.findByUsuario(codusuario);
    if (existente) return existente;
    return await this.assinaturaRepository.create({
      codusuario,
      plano: "pro",
      status: "trial",
      trial_fim: somarDias(agora, configPlano().trialDias),
    });
  }

  async execute(codusuario: number, agora = new Date()) {
    const assinatura = await this.garantir(codusuario, agora);
    const plano = configPlano();
    const situacao = situacaoAcesso(assinatura, agora);
    return {
      plano: { nome: plano.nome, precos: plano.precos, trialDias: plano.trialDias },
      cobrancaAtiva: planosAtivos(),
      assinatura: {
        status: assinatura.status,
        ciclo: assinatura.ciclo,
        valor: assinatura.valor == null ? null : Number(assinatura.valor),
        trial_fim: assinatura.trial_fim,
        periodo_fim: assinatura.periodo_fim,
        link_pagamento: assinatura.link_pagamento,
        assinado: Boolean(assinatura.gateway_assinatura_id) && assinatura.status !== "cancelada",
      },
      // Com a cobrança desligada ninguém fica só leitura.
      situacao: planosAtivos() ? situacao : { ...situacao, acesso: "completo" as const },
    };
  }
}
