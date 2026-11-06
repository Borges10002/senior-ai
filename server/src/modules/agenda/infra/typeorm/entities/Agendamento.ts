import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";
import type { StatusAgendamento } from "@modules/agenda/domain/agendamento";

/** Registro de cada agendamento identificado na conversa e do que foi feito com ele. */
@Entity("DIMIAGENDAMENTO")
@Index("IDX_AGENDAMENTO_GRAVACAO", ["gravacao_id"])
@Index("IDX_AGENDAMENTO_ORIGEM", ["reuniao_origem_id"])
export class Agendamento {
  @PrimaryColumn("uuid")
  id: string;

  @Column("uuid")
  gravacao_id: string;

  @Column("uuid")
  reuniao_origem_id: string;

  @Column({ type: "numeric" })
  codusuario: number;

  @Column({ type: "varchar", length: 200 })
  titulo: string;

  @Column({ type: "timestamptz", nullable: true })
  inicio: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  fim: Date | null;

  @Column({ type: "jsonb" })
  participantes: string[];

  @Column({ type: "varchar", length: 20 })
  status: StatusAgendamento;

  /** Reunião criada na agenda, quando o status é CRIADO. */
  @Column({ type: "uuid", nullable: true })
  reuniao_criada_id: string | null;

  /** Próximo horário livre, quando o status é CONFLITO. */
  @Column({ type: "timestamptz", nullable: true })
  sugestao_inicio: Date | null;

  /** Horário do trecho da transcrição que originou o agendamento. */
  @Column({ type: "varchar", length: 12, nullable: true })
  horario_origem: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
}
