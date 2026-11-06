import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from "typeorm";
import type { AnaliseReuniao } from "@modules/anotacoes/domain/analise";

/** Anotações geradas pela IA para uma gravação: resumo, decisões, tarefas e pendências. */
@Entity("DIMIANOTACAO")
@Index("IDX_ANOTACAO_REUNIAO", ["reuniao_id"])
export class Anotacao {
  @PrimaryColumn("uuid")
  id: string;

  /** Uma anotação por gravação: reprocessar substitui em vez de duplicar. */
  @Index("UQ_ANOTACAO_GRAVACAO", { unique: true })
  @Column("uuid")
  gravacao_id: string;

  @Column("uuid")
  reuniao_id: string;

  @Column({ type: "numeric" })
  codusuario: number;

  @Column({ type: "text" })
  resumo: string;

  @Column({ type: "jsonb" })
  assuntos: AnaliseReuniao["assuntos"];

  @Column({ type: "jsonb" })
  decisoes: AnaliseReuniao["decisoes"];

  @Column({ type: "jsonb" })
  tarefas: AnaliseReuniao["tarefas"];

  @Column({ type: "jsonb" })
  pendencias: AnaliseReuniao["pendencias"];

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}
