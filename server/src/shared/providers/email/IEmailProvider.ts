export interface MensagemEmail {
  para: string;
  assunto: string;
  html: string;
  texto: string;
}

/** Envio de e-mail. Devolve false quando o envio não está configurado. */
export default interface IEmailProvider {
  enviar(mensagem: MensagemEmail): Promise<boolean>;
}
