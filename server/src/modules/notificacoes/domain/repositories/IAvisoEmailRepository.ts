interface IAvisoEmailRepository {
  /** Reserva o envio do dia; false se já foi registrado (não envia de novo). */
  registrar(codusuario: number, tipo: string, dia: string): Promise<boolean>;
  /** Desfaz a reserva quando o envio falha, para tentar na próxima rodada. */
  desfazer(codusuario: number, tipo: string, dia: string): Promise<void>;
}

export default IAvisoEmailRepository;
