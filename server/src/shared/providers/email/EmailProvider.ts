import IEmailProvider, { type MensagemEmail } from "./IEmailProvider";
import { MailerSendEmailProvider } from "./MailerSendEmailProvider";
import { SmtpEmailProvider } from "./SmtpEmailProvider";

/**
 * Escolhe o envio pelo que estiver configurado: MailerSend (MAILERSEND_API_TOKEN)
 * ou SMTP (SMTP_HOST). Sem nenhum dos dois, não envia (só registra no log).
 */
export class EmailProvider implements IEmailProvider {
  private readonly mailerSend = new MailerSendEmailProvider();
  private readonly smtp = new SmtpEmailProvider();

  enviar(mensagem: MensagemEmail): Promise<boolean> {
    return process.env.MAILERSEND_API_TOKEN ? this.mailerSend.enviar(mensagem) : this.smtp.enviar(mensagem);
  }
}
