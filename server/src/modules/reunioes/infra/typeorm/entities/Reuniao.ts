import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from "typeorm";
import type { StatusReuniao } from "@modules/reunioes/domain/reuniao";

@Entity("DIMIREUNIAO")
@Index("IDX_REUNIAO_USUARIO_INICIO", ["codusuario", "inicio_previsto"])
class Reuniao {
  @PrimaryColumn("uuid")
  id: string;

  /** RN001: toda reunião pertence a um proprietário. */
  @Column({ type: "numeric" })
  codusuario: number;

  @Column({ type: "varchar", length: 200 })
  titulo: string;

  @Column({ type: "varchar", length: 200, nullable: true })
  assunto: string | null;

  @Column({ type: "text", nullable: true })
  objetivo: string | null;

  @Column({ type: "varchar", length: 200, nullable: true })
  local: string | null;

  @Column({ type: "varchar", length: 20, default: "AGENDADA" })
  status: StatusReuniao;

  @Column({ type: "timestamptz", nullable: true })
  inicio_previsto: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  fim_previsto: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  iniciada_em: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  finalizada_em: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}

export { Reuniao };
