import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from "typeorm";
import type { StatusGravacao } from "@modules/gravacoes/domain/gravacao";

@Entity("DIMIGRAVACAO")
@Index("IDX_GRAVACAO_REUNIAO", ["reuniao_id"])
export class Gravacao {
  @PrimaryColumn("uuid")
  id: string;

  /** RN003: toda gravação pertence a uma reunião. */
  @Column("uuid")
  reuniao_id: string;

  @Column({ type: "numeric" })
  codusuario: number;

  @Column({ type: "varchar", length: 300 })
  chave: string;

  @Column({ type: "varchar", length: 60 })
  mime: string;

  @Column({ type: "bigint" })
  tamanho: number;

  @Column({ type: "integer", nullable: true })
  duracao_seg: number | null;

  /** Momento em que o dono confirmou ter avisado os participantes (LGPD). */
  @Column({ type: "timestamptz" })
  consentimento_em: Date;

  @Column({ type: "varchar", length: 20, default: "ENVIADA" })
  status: StatusGravacao;

  /** Mensagem pronta para mostrar ao usuário; nunca o erro bruto do provedor. */
  @Column({ type: "varchar", length: 300, nullable: true })
  erro: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}
