import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";
import type { Perfil } from "@modules/usuarios/domain/perfil";

@Entity("usuarios")
class Usuario {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 120 })
  nome: string;

  @Column({ type: "varchar", length: 180, unique: true })
  email: string;

  @Column({ type: "varchar", length: 100 })
  senha_hash: string;

  @Column({ type: "varchar", length: 20, default: "proprietario" })
  perfil: Perfil;

  @Column({ type: "boolean", default: true })
  ativo: boolean;

  /** Incrementada ao trocar a senha: invalida todas as sessões abertas. */
  @Column({ type: "int", default: 1 })
  versao_credencial: number;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}

export { Usuario };
