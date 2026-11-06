import { inject, injectable } from "tsyringe";
import IFeedbackRepository from "@modules/feedback/domain/repositories/IFeedbackRepository";
import { Feedback } from "@modules/feedback/infra/typeorm/entities/Feedback";
import AppError from "@shared/errors/AppError";

interface UpdateFeedbackDTO {
  tipo?: string;
  titulo?: string;
  mensagem?: string;
  pagina?: string;
}

@injectable()
class UpdateFeedbackUseCase {
  constructor(
    @inject("FeedbackRepository")
    private feedbackRepository: IFeedbackRepository,
  ) {}

  /** O usuário só edita o próprio feedback, e só enquanto ainda está aberto. */
  async execute(id: string, codusuario: number, data: UpdateFeedbackDTO): Promise<Feedback> {
    const feedback = await this.feedbackRepository.findById(id, codusuario);
    if (!feedback || Number(feedback.codusuario) !== codusuario) {
      throw new AppError("Feedback nao encontrado", 404);
    }
    if (feedback.status && feedback.status !== "aberto") {
      throw new AppError("Este feedback já está sendo tratado e não pode mais ser editado", 400);
    }

    return this.feedbackRepository.update(id, data);
  }
}

export { UpdateFeedbackUseCase };
