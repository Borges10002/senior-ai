import { Index, Column, Entity, PrimaryColumn } from "typeorm";
@Entity("DIMISESSAO")
@Index("IDX_DIMISESSAO_usuario", ["codusuario"])
export class Sessao {
  @PrimaryColumn("uuid") id: string;
  @Column("numeric") codusuario: number;
  @Column("varchar", { length: 64 }) refresh_hash: string;
  @Column("timestamptz") expira_em: Date;
}
