import { inject, injectable } from "tsyringe";
import IFeedbackRepository from "@modules/feedback/domain/repositories/IFeedbackRepository";
import { Feedback } from "@modules/feedback/infra/typeorm/entities/Feedback";
import AppError from "@shared/errors/AppError";

export interface CreateFeedbackDTO {
  tipo: string;
  titulo: string;
  mensagem: string;
  pagina: string;
  codusuario: number;
}

@injectable()
class CreateFeedbackUseCase {
  constructor(
    @inject("FeedbackRepository")
    private feedbackRepository: IFeedbackRepository,
  ) {}

  async execute(data: CreateFeedbackDTO): Promise<Feedback> {
    const feedbackExists = await this.feedbackRepository.findDuplicate(data);
    if (feedbackExists) {
      throw new AppError("Feedback ja cadastrado", 400);
    }

    const feedback = Object.assign(new Feedback(), data);
    return this.feedbackRepository.create(feedback);
  }
}

export { CreateFeedbackUseCase };
