import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { CicloAssinatura, StatusAssinatura } from "@modules/assinaturas/domain/plano";

/** Assinatura do plano Pro: uma por usuário, criada em teste grátis. */
@Entity("DIMIASSINATURAS")
export class Assinatura {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "numeric", unique: true })
  codusuario: number;

  @Column({ type: "varchar", length: 20, default: "pro" })
  plano: string;

  @Column({ type: "varchar", length: 20, default: "trial" })
  status: StatusAssinatura;

  @Column({ type: "varchar", length: 10, nullable: true })
  ciclo: CicloAssinatura | null;

  @Column("decimal", { precision: 12, scale: 2, nullable: true })
  valor: number | null;

  @Column({ type: "timestamptz" })
  trial_fim: Date;

  /** Até quando o último pagamento confirmado cobre. */
  @Column({ type: "timestamptz", nullable: true })
  periodo_fim: Date | null;

  @Column({ type: "varchar", length: 60, nullable: true })
  gateway_cliente_id: string | null;

  @Index()
  @Column({ type: "varchar", length: 60, nullable: true })
  gateway_assinatura_id: string | null;

  /** Fatura em aberto (Pix, boleto ou cartão na página do gateway). */
  @Column({ type: "varchar", length: 300, nullable: true })
  link_pagamento: string | null;

  @Column({ type: "timestamptz", nullable: true })
  cancelada_em: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}
