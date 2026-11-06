import nodemailer, { type Transporter } from "nodemailer";
import IEmailProvider, { type MensagemEmail } from "./IEmailProvider";

/**
 * Envia por SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_REMETENTE).
 * Sem SMTP_HOST (ambiente local), só registra no log e não envia.
 */
export class SmtpEmailProvider implements IEmailProvider {
  private transporte: Transporter | null = null;

  private obterTransporte(): Transporter | null {
    if (this.transporte) return this.transporte;
    const host = process.env.SMTP_HOST;
    if (!host) return null;
    const porta = Number(process.env.SMTP_PORT || 587);
    this.transporte = nodemailer.createTransport({
      host,
      port: porta,
      secure: porta === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    return this.transporte;
  }

  async enviar({ para, assunto, html, texto }: MensagemEmail): Promise<boolean> {
    const transporte = this.obterTransporte();
    if (!transporte) {
      console.warn(`[Senior AI] E-mail não enviado (SMTP_HOST ausente): "${assunto}" para ${para}`);
      return false;
    }
    await transporte.sendMail({
      from: process.env.EMAIL_REMETENTE || `Senior AI <${process.env.SMTP_USER}>`,
      to: para,
      subject: assunto,
      html,
      text: texto,
    });
    return true;
  }
}
