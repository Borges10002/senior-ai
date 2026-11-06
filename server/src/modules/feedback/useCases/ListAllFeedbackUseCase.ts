import { inject, injectable } from "tsyringe";
import IFeedbackRepository from "@modules/feedback/domain/repositories/IFeedbackRepository";
import IUsuarioRepository from "@modules/usuario/domain/repositories/IUsuarioRepository";
import { Feedback } from "@modules/feedback/infra/typeorm/entities/Feedback";

export interface FeedbackComUsuario extends Feedback {
  usuario: { codigo: number; nome: string; email: string } | null;
}

/** Visão administrativa: feedbacks de todos os usuários, com quem enviou. */
@injectable()
class ListAllFeedbackUseCase {
  constructor(
    @inject("FeedbackRepository")
    private feedbackRepository: IFeedbackRepository,
    @inject("UsuarioRepository")
    private usuarioRepository: IUsuarioRepository,
  ) {}

  async execute(tipo?: string): Promise<FeedbackComUsuario[]> {
    const feedbacks = tipo
      ? await this.feedbackRepository.findByTipo(tipo)
      : await this.feedbackRepository.findAll();

    const codigos = [
      ...new Set(
        feedbacks
          .map((f) => (f.codusuario == null ? null : Number(f.codusuario)))
          .filter((c): c is number => c !== null),
      ),
    ];
    const usuarios = new Map(
      await Promise.all(
        codigos.map(
          async (codigo) =>
            [codigo, await this.usuarioRepository.findById(codigo)] as const,
        ),
      ),
    );

    return feedbacks.map((feedback) => {
      const usuario =
        feedback.codusuario == null
          ? null
          : usuarios.get(Number(feedback.codusuario));
      return {
        ...feedback,
        usuario: usuario
          ? {
              codigo: Number(usuario.codigo),
              nome: usuario.nome,
              email: usuario.email,
            }
          : null,
      };
    });
  }
}

export { ListAllFeedbackUseCase };
