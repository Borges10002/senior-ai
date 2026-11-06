import { inject, injectable } from "tsyringe";
import IFeedbackRepository from "@modules/feedback/domain/repositories/IFeedbackRepository";
import { Feedback, STATUS_FEEDBACK, StatusFeedback } from "@modules/feedback/infra/typeorm/entities/Feedback";
import AppError from "@shared/errors/AppError";

/** Administrador acompanha o feedback: muda o status e/ou responde ao usuário. */
@injectable()
class AtualizarStatusFeedbackUseCase {
  constructor(
    @inject("FeedbackRepository")
    private feedbackRepository: IFeedbackRepository,
  ) {}

  async execute(
    id: string,
    data: { status?: StatusFeedback; resposta?: string | null },
  ): Promise<Feedback> {
    const feedback = await this.feedbackRepository.findById(id);
    if (!feedback) throw new AppError("Feedback nao encontrado", 404);

    const alteracoes: Partial<Feedback> = {};
    if (data.status !== undefined) {
      if (!STATUS_FEEDBACK.includes(data.status)) throw new AppError("Status inválido", 400);
      alteracoes.status = data.status;
    }
    if (data.resposta !== undefined) {
      const resposta = data.resposta?.trim() || null;
      alteracoes.resposta = resposta;
      alteracoes.respondido_em = resposta ? new Date() : null;
    }

    return this.feedbackRepository.update(id, alteracoes);
  }
}

export { AtualizarStatusFeedbackUseCase };
