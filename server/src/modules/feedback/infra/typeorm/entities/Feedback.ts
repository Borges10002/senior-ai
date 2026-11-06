import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export const STATUS_FEEDBACK = ["aberto", "andamento", "concluido"] as const;
export type StatusFeedback = (typeof STATUS_FEEDBACK)[number];

@Entity("DIMFEEDBACK")
export class Feedback {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  tipo: string;

  @Column({ type: "varchar" })
  titulo: string;

  @Column({ type: "varchar" })
  mensagem: string;

  @Column({ type: "varchar" })
  pagina: string;

  @Column({ type: "numeric", nullable: true })
  codusuario: number | null;

  /** Acompanhamento pelo administrador: aberto -> andamento -> concluido. */
  @Column({ type: "varchar", length: 20, default: "aberto" })
  status: StatusFeedback;

  /** Resposta do administrador, visível para quem enviou. */
  @Column({ type: "text", nullable: true })
  resposta: string | null;

  @Column({ type: "timestamp", nullable: true })
  respondido_em: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
