import { inject, injectable } from "tsyringe";
import IFeedbackRepository from "@modules/feedback/domain/repositories/IFeedbackRepository";
import AppError from "@shared/errors/AppError";

@injectable()
class DeleteFeedbackUseCase {
  constructor(
    @inject("FeedbackRepository")
    private feedbackRepository: IFeedbackRepository,
  ) {}

  /** Sem `codusuario` (rota de administrador) pode excluir qualquer feedback. */
  async execute(id: string, codusuario?: number): Promise<void> {
    const feedback = await this.feedbackRepository.findById(id, codusuario);
    if (!feedback) {
      throw new AppError("Feedback nao encontrado", 404);
    }

    await this.feedbackRepository.delete(id);
  }
}

export { DeleteFeedbackUseCase };
