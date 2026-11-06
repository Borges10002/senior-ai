import { CreateFeedbackUseCase } from "@modules/feedback/useCases/CreateFeedbackUseCase";
import type { CreateFeedbackDTO } from "@modules/feedback/useCases/CreateFeedbackUseCase";
import { DeleteFeedbackUseCase } from "@modules/feedback/useCases/DeleteFeedbackUseCase";
import { ListFeedbackUseCase } from "@modules/feedback/useCases/ListFeedbackUseCase";
import { UpdateFeedbackUseCase } from "@modules/feedback/useCases/UpdateFeedbackUseCase";
import AppError from "@shared/errors/AppError";
import { Request, Response } from "express";
import { container } from "tsyringe";
import { z } from "zod";

class FeedbackController {
  async create(request: Request, response: Response): Promise<Response> {
    const createFeedbackSchema = z.object({
      tipo: z.string().min(1),
      titulo: z.string().min(1),
      mensagem: z.string().min(1),
      pagina: z.string().min(1),
    });

    const validatedData = createFeedbackSchema.parse(request.body) as Omit<
      CreateFeedbackDTO,
      "codusuario"
    >;

    const codusuario = Number(request.userAuth.codigo);
    if (!Number.isFinite(codusuario)) {
      throw new AppError("Usuario autenticado invalido", 401);
    }

    const createFeedbackUseCase = container.resolve(CreateFeedbackUseCase);
    const feedback = await createFeedbackUseCase.execute({
      ...validatedData,
      codusuario,
    });

    return response.status(201).json(feedback);
  }

  async index(request: Request, response: Response): Promise<Response> {
    const { tipo } = z
      .object({
        tipo: z.string().min(1).optional(),
      })
      .parse(request.query);

    const codusuario = Number(request.userAuth.codigo);
    const listFeedbackUseCase = container.resolve(ListFeedbackUseCase);
    const feedbacks = await listFeedbackUseCase.execute(codusuario, tipo);

    return response.json(feedbacks);
  }

  async update(request: Request, response: Response): Promise<Response> {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    const updateFeedbackSchema = z.object({
      tipo: z.string().min(1).optional(),
      titulo: z.string().min(1).optional(),
      mensagem: z.string().min(1).optional(),
      pagina: z.string().min(1).optional(),
    });

    const validatedData = updateFeedbackSchema.parse(request.body);
    const updateFeedbackUseCase = container.resolve(UpdateFeedbackUseCase);
    const feedback = await updateFeedbackUseCase.execute(
      id,
      Number(request.userAuth.codigo),
      validatedData,
    );

    return response.json(feedback);
  }

  async delete(request: Request, response: Response): Promise<Response> {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    const codusuario = Number(request.userAuth.codigo);
    const deleteFeedbackUseCase = container.resolve(DeleteFeedbackUseCase);
    await deleteFeedbackUseCase.execute(id, codusuario);

    return response.status(204).send();
  }
}

export { FeedbackController };
