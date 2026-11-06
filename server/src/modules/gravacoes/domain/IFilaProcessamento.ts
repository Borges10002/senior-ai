/** Etapas assíncronas do pipeline; a implementação usa BullMQ. */
export default interface IFilaProcessamento {
  enfileirarTranscricao(gravacaoId: string): Promise<void>;
  enfileirarAnalise(gravacaoId: string): Promise<void>;
}
