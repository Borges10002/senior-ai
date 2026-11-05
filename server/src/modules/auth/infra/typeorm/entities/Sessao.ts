import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity("sessoes")
@Index(["usuario_id"])
class Sessao {
  @PrimaryColumn("uuid")
  id: string;

  @Column("uuid")
  usuario_id: string;

  /** HMAC do refresh token; o token em si nunca é gravado. */
  @Column({ type: "char", length: 64 })
  refresh_hash: string;

  @Column({ type: "timestamptz" })
  expira_em: Date;

  @Column({ type: "timestamptz", nullable: true })
  revogada_em: Date | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  user_agent: string | null;

  @Column({ type: "varchar", length: 64, nullable: true })
  ip: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}

export { Sessao };
