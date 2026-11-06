import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

/** Pedido de troca de senha: guarda só o hash do token enviado por e-mail. */
@Entity("DIMIRECUPERACAOSENHA")
@Index("IDX_DIMIRECUPERACAOSENHA_token", ["token_hash"])
export class RecuperacaoSenha {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "numeric" })
  codusuario: number;

  @Column({ type: "varchar", length: 64 })
  token_hash: string;

  @Column({ type: "timestamptz" })
  expira_em: Date;

  @Column({ type: "timestamptz", nullable: true })
  usado_em: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
}
