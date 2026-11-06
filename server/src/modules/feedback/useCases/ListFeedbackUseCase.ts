import { inject, injectable } from "tsyringe";
import IFeedbackRepository from "@modules/feedback/domain/repositories/IFeedbackRepository";
import { Feedback } from "@modules/feedback/infra/typeorm/entities/Feedback";

@injectable()
class ListFeedbackUseCase {
  constructor(
    @inject("FeedbackRepository")
    private feedbackRepository: IFeedbackRepository,
  ) {}

  async execute(codusuario: number, tipo?: string): Promise<Feedback[]> {
    if (tipo) {
      return this.feedbackRepository.findByTipo(tipo, codusuario);
    }

    return this.feedbackRepository.findAll(codusuario);
  }
}

export { ListFeedbackUseCase };
