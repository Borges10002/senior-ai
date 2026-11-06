import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";

@Entity("DIMIAUDITORIA")
@Index("IDX_AUDITORIA_ENTIDADE", ["entidade", "entidade_id"])
@Index("IDX_AUDITORIA_USUARIO_DATA", ["codusuario", "created_at"])
class RegistroAuditoria {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ type: "numeric", nullable: true })
  codusuario: number | null;

  /** Ex.: auth.login, reuniao.excluida, aprovacao.aprovada */
  @Column({ type: "varchar", length: 80 })
  acao: string;

  @Column({ type: "varchar", length: 60 })
  entidade: string;

  @Column({ type: "uuid", nullable: true })
  entidade_id: string | null;

  @Column({ type: "jsonb", nullable: true })
  dados: Record<string, unknown> | null;

  @Column({ type: "varchar", length: 64, nullable: true })
  ip: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
}

export { RegistroAuditoria };
