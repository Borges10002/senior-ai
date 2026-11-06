import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("DIMIUSUARIO")
export class Usuario {
  @PrimaryColumn({ name: "codigo", type: "numeric" })
  codigo?: number;

  @Column({ name: "nome", type: "varchar" })
  nome: string;

  @Column({ name: "usuario", type: "varchar" })
  usuario: string;

  @Column({ name: "senha", type: "varchar" })
  senha: string;

  @Column({ name: "ativo", type: "varchar" })
  ativo: string;

  @Column({ name: "email", type: "varchar" })
  email: string;

  @Column({ name: "nivelacesso", type: "integer" })
  nivelacesso: number;

  @Column({ name: "cpf", type: "varchar" })
  cpf: string;
}
