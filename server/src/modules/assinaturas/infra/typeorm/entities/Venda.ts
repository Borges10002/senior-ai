import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from "typeorm";
import type { CicloAssinatura } from "@modules/assinaturas/domain/plano";
import type { StatusVenda } from "@modules/assinaturas/domain/vendas";

/**
 * Cobrança paga do plano Pro. O id é o da cobrança no gateway, então o mesmo
 * pagamento avisado mais de uma vez continua sendo uma venda só.
 */
@Entity("DIMIVENDAS")
export class Venda {
  @PrimaryColumn({ type: "varchar", length: 80 })
  id: string;

  /** Quem comprou. */
  @Index()
  @Column({ type: "numeric" })
  codusuario: number;

  @Column({ type: "varchar", length: 60, nullable: true })
  gateway_assinatura_id: string | null;

  @Column({ type: "varchar", length: 10, nullable: true })
  ciclo: CicloAssinatura | null;

  @Column("decimal", { precision: 12, scale: 2 })
  valor: number;

  /** Valor depois das taxas do gateway. */
  @Column("decimal", { precision: 12, scale: 2, nullable: true })
  valor_liquido: number | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  forma_pagamento: string | null;

  @Column({ type: "varchar", length: 20, default: "paga" })
  status: StatusVenda;

  @Column({ type: "date", nullable: true })
  vencimento: string | null;

  @Index()
  @Column({ type: "timestamptz" })
  pago_em: Date;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}
