import { Feedback } from "@modules/feedback/infra/typeorm/entities/Feedback";
import { IRepository } from "@shared/infra/typeorm/model/IRepository";

interface IFeedbackRepository extends IRepository {
  create(feedback: Feedback): Promise<Feedback>;
  findById(id: string, codusuario?: number): Promise<Feedback | null>;
  findAll(codusuario?: number): Promise<Feedback[]>;
  findByTipo(tipo: string, codusuario?: number): Promise<Feedback[]>;
  update(id: string, feedback: Partial<Feedback>): Promise<Feedback>;
  delete(id: string): Promise<void>;
  findDuplicate(
    data: Pick<
      Feedback,
      "tipo" | "titulo" | "mensagem" | "pagina" | "codusuario"
    >,
  ): Promise<Feedback | null>;
  count(codusuario: number): Promise<number>;
}

export default IFeedbackRepository;
