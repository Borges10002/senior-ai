import AppError from "@shared/errors/AppError";
import type {
  ClienteGateway,
  CobrancaGateway,
  IGatewayPagamento,
  NovaAssinaturaGateway,
} from "@modules/assinaturas/domain/IGatewayPagamento";

/**
 * Cliente da API v3 do Asaas. Sandbox: https://api-sandbox.asaas.com/v3
 * Produção: https://api.asaas.com/v3 (defina ASAAS_BASE_URL).
 */
export class AsaasGateway implements IGatewayPagamento {
  private get baseUrl() {
    return (process.env.ASAAS_BASE_URL || "https://api-sandbox.asaas.com/v3").replace(/\/+$/, "");
  }

  configurado(): boolean {
    return Boolean(process.env.ASAAS_API_KEY);
  }

  private async chamar<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
    if (!this.configurado()) {
      throw new AppError("Pagamentos ainda não configurados. Fale com o suporte.", 503);
    }
    const resposta = await fetch(`${this.baseUrl}${caminho}`, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Senior AI/1.0",
        access_token: String(process.env.ASAAS_API_KEY),
      },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: AbortSignal.timeout(15_000),
    }).catch(() => {
      throw new AppError("Não foi possível falar com o serviço de pagamento. Tente de novo.", 502);
    });

    const texto = await resposta.text();
    let json: any = {};
    try {
      json = texto ? JSON.parse(texto) : {};
    } catch {
      json = {};
    }
    if (!resposta.ok) {
      const detalhe = Array.isArray(json?.errors)
        ? json.errors.map((e: any) => e.description).join(" ")
        : "";
      console.error(`[Asaas] ${metodo} ${caminho} -> ${resposta.status} ${detalhe}`);
      throw new AppError(detalhe || "O serviço de pagamento recusou a operação.", 502);
    }
    return json as T;
  }

  async criarCliente(c: ClienteGateway): Promise<string> {
    const r = await this.chamar<{ id: string }>("POST", "/customers", {
      name: c.nome,
      email: c.email,
      cpfCnpj: c.documento,
      externalReference: c.referencia,
    });
    return r.id;
  }

  async criarAssinatura(d: NovaAssinaturaGateway): Promise<string> {
    const r = await this.chamar<{ id: string }>("POST", "/subscriptions", {
      customer: d.clienteId,
      // UNDEFINED: o cliente escolhe Pix, boleto ou cartão na fatura.
      billingType: "UNDEFINED",
      value: d.valor,
      nextDueDate: d.primeiroVencimento,
      cycle: d.ciclo,
      description: d.descricao,
      externalReference: d.referencia,
    });
    return r.id;
  }

  async cobrancas(assinaturaId: string): Promise<CobrancaGateway[]> {
    const r = await this.chamar<{ data?: any[] }>(
      "GET",
      `/subscriptions/${encodeURIComponent(assinaturaId)}/payments`,
    );
    return (r.data ?? [])
      .map((p) => ({
        id: String(p.id),
        status: String(p.status),
        vencimento: String(p.dueDate),
        valor: Number(p.value),
        link: p.invoiceUrl ?? null,
        dados: {
          value: p.value,
          netValue: p.netValue,
          billingType: p.billingType,
          dueDate: p.dueDate,
          paymentDate: p.paymentDate,
          confirmedDate: p.confirmedDate,
          clientPaymentDate: p.clientPaymentDate,
        },
      }))
      .sort((a, b) => b.vencimento.localeCompare(a.vencimento));
  }

  async cancelarAssinatura(assinaturaId: string): Promise<void> {
    await this.chamar("DELETE", `/subscriptions/${encodeURIComponent(assinaturaId)}`);
  }
}
