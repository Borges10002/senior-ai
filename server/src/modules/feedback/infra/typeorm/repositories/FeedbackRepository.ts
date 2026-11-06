import IFeedbackRepository from "@modules/feedback/domain/repositories/IFeedbackRepository";
import { TipecDataSource } from "@shared/infra/typeorm";
import { IsNull, Repository } from "typeorm";
import { Feedback } from "../entities/Feedback";

export class FeedbackRepository implements IFeedbackRepository {
  private repository: Repository<Feedback>;

  constructor() {
    this.repository = TipecDataSource.getRepository(Feedback);
  }

  getDataSource() {
    return TipecDataSource;
  }

  async findAll(codusuario?: number): Promise<Feedback[]> {
    return await this.repository.find({
      where: codusuario !== undefined ? { codusuario } : {},
      order: { created_at: "DESC" },
    });
  }

  async findByTipo(tipo: string, codusuario?: number): Promise<Feedback[]> {
    return await this.repository.find({
      where:
        codusuario !== undefined
          ? [{ tipo, codusuario }, { tipo, codusuario: IsNull() }]
          : { tipo },
      order: { created_at: "DESC" },
    });
  }

  async findById(id: string, codusuario?: number): Promise<Feedback | null> {
    return await this.repository.findOne({
      where:
        codusuario !== undefined
          ? [{ id, codusuario }, { id, codusuario: IsNull() }]
          : { id },
    });
  }

  async create(feedback: Feedback): Promise<Feedback> {
    return await this.repository.save(feedback);
  }

  async update(id: string, feedback: Partial<Feedback>): Promise<Feedback> {
    await this.repository.update(id, feedback);
    const updatedFeedback = await this.repository.findOne({ where: { id } });
    return updatedFeedback as Feedback;
  }

  async findDuplicate({
    tipo,
    titulo,
    mensagem,
    pagina,
    codusuario,
  }: Pick<
    Feedback,
    "tipo" | "titulo" | "mensagem" | "pagina" | "codusuario"
  >): Promise<Feedback | null> {
    return await this.repository.findOne({
      where: {
        tipo,
        titulo,
        mensagem,
        pagina,
        codusuario,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async count(codusuario: number): Promise<number> {
    return await this.repository.count({
      where: [{ codusuario }, { codusuario: IsNull() }],
    });
  }
}
