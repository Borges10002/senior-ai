import IEmailProvider, { type MensagemEmail } from "./IEmailProvider";

/** "Senior AI <nao-responda@dominio.com>" ou só o e-mail. */
export function lerRemetente(texto: string | undefined): { email: string; name?: string } | null {
  const valor = String(texto ?? "").trim();
  if (!valor) return null;
  const [, nome, email] = /^(.*)<([^>]+)>$/.exec(valor) ?? [];
  if (email) return { email: email.trim(), name: nome.trim().replace(/^"|"$/g, "") || undefined };
  return { email: valor };
}

/**
 * Envio pela API do MailerSend (MAILERSEND_API_TOKEN). O remetente
 * (EMAIL_REMETENTE) precisa ser de um domínio verificado no MailerSend.
 */
export class MailerSendEmailProvider implements IEmailProvider {
  async enviar({ para, assunto, html, texto }: MensagemEmail): Promise<boolean> {
    const token = process.env.MAILERSEND_API_TOKEN;
    const remetente = lerRemetente(process.env.EMAIL_REMETENTE);
    if (!token || !remetente) {
      console.warn(`[Senior AI] E-mail não enviado (MailerSend sem token ou EMAIL_REMETENTE): "${assunto}"`);
      return false;
    }
    const resposta = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ from: remetente, to: [{ email: para }], subject: assunto, html, text: texto }),
      signal: AbortSignal.timeout(15000),
    });
    // 202 = aceito para envio.
    if (!resposta.ok) {
      throw new Error(`MailerSend ${resposta.status}: ${(await resposta.text()).slice(0, 300)}`);
    }
    return true;
  }
}
