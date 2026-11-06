import { Column, Entity, Index, PrimaryColumn } from "typeorm";

/** RN004: guarda o texto original de cada trecho, sem edição. */
@Entity("DIMITRANSCRICAOSEGMENTO")
@Index("IDX_SEGMENTO_GRAVACAO_ORDEM", ["gravacao_id", "ordem"])
export class SegmentoTranscricao {
  @PrimaryColumn("uuid")
  id: string;

  @Column("uuid")
  gravacao_id: string;

  @Column({ type: "numeric" })
  codusuario: number;

  @Column({ type: "integer" })
  ordem: number;

  @Column({ type: "real" })
  inicio_seg: number;

  @Column({ type: "real" })
  fim_seg: number;

  @Column({ type: "text" })
  texto: string;
}
