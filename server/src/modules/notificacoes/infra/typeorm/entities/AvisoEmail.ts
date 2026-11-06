import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

/** Registro dos avisos por e-mail já enviados: um por usuário, tipo e dia. */
@Entity("DIMIAVISOSEMAIL")
@Index(["codusuario", "tipo", "dia"], { unique: true })
export class AvisoEmail {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "numeric" })
  codusuario: number;

  @Column({ type: "varchar", length: 30 })
  tipo: string;

  @Column({ type: "date" })
  dia: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
}
