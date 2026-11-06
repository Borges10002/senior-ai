import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

/**
 * Eventos de webhook já recebidos. O gateway entrega "pelo menos uma vez";
 * guardar o id evita processar o mesmo pagamento duas vezes.
 */
@Entity("DIMIEVENTOSPAGAMENTO")
export class EventoPagamento {
  @PrimaryColumn({ type: "varchar", length: 80 })
  id: string;

  @Column({ type: "varchar", length: 60 })
  evento: string;

  @Column({ type: "varchar", length: 60, nullable: true })
  gateway_assinatura_id: string | null;

  @Column({ type: "jsonb" })
  payload: unknown;

  @CreateDateColumn({ type: "timestamptz" })
  recebido_em: Date;
}
