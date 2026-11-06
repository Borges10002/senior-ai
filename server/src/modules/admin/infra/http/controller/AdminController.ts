import { AlterarAcessoUsuarioUseCase } from "@modules/admin/useCases/AlterarAcessoUsuarioUseCase";
import { ListUsuariosAdminUseCase } from "@modules/admin/useCases/ListUsuariosAdminUseCase";
import { ResumoAdminUseCase } from "@modules/admin/useCases/ResumoAdminUseCase";
import { PainelVendasUseCase } from "@modules/assinaturas/useCases/PainelVendasUseCase";
import { DeleteFeedbackUseCase } from "@modules/feedback/useCases/DeleteFeedbackUseCase";
import { ListAllFeedbackUseCase } from "@modules/feedback/useCases/ListAllFeedbackUseCase";
import { AtualizarStatusFeedbackUseCase } from "@modules/feedback/useCases/AtualizarStatusFeedbackUseCase";
import { STATUS_FEEDBACK } from "@modules/feedback/infra/typeorm/entities/Feedback";
import { PERFIS } from "@modules/usuario/domain/perfil";
import { Request, Response } from "express";
import { container } from "tsyringe";
import { z } from "zod";

class AdminController {
  async resumo(request: Request, response: Response): Promise<Response> {
    const resumoAdminUseCase = container.resolve(ResumoAdminUseCase);
    return response.json(await resumoAdminUseCase.execute());
  }

  async vendas(request: Request, response: Response): Promise<Response> {
    const painelVendasUseCase = container.resolve(PainelVendasUseCase);
    return response.json(await painelVendasUseCase.execute());
  }

  /** Busca as cobranças direto no gateway, para vendas que o webhook não avisou. */
  async sincronizarVendas(request: Request, response: Response): Promise<Response> {
    const painelVendasUseCase = container.resolve(PainelVendasUseCase);
    return response.json(await painelVendasUseCase.execute({ consultarGateway: true }));
  }

  async perfis(request: Request, response: Response): Promise<Response> {
    return response.json(PERFIS.map((p) => ({ nivel: p.level, nome: p.nome })));
  }

  async listarUsuarios(request: Request, response: Response): Promise<Response> {
    const listUsuariosAdminUseCase = container.resolve(ListUsuariosAdminUseCase);
    return response.json(await listUsuariosAdminUseCase.execute());
  }

  async alterarUsuario(request: Request, response: Response): Promise<Response> {
    const { codigo } = z
      .object({ codigo: z.coerce.number().int().min(1) })
      .parse(request.params);
    const { nivel, ativo } = z
      .object({
        nivel: z.coerce.number().int().optional(),
        ativo: z.boolean().optional(),
      })
      .refine((d) => d.nivel !== undefined || d.ativo !== undefined, {
        message: "Informe o perfil ou o status",
      })
      .parse(request.body);

    const alterarAcessoUsuarioUseCase = container.resolve(AlterarAcessoUsuarioUseCase);
    const usuario = await alterarAcessoUsuarioUseCase.execute({
      codigoAdmin: Number(request.userAuth.codigo),
      codigo,
      ...(nivel !== undefined ? { nivel } : {}),
      ...(ativo !== undefined ? { ativo } : {}),
    });
    return response.json(usuario);
  }

  async listarFeedbacks(request: Request, response: Response): Promise<Response> {
    const { tipo } = z
      .object({ tipo: z.string().min(1).optional() })
      .parse(request.query);
    const listAllFeedbackUseCase = container.resolve(ListAllFeedbackUseCase);
    return response.json(await listAllFeedbackUseCase.execute(tipo));
  }

  async atualizarFeedback(request: Request, response: Response): Promise<Response> {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { status, resposta } = z
      .object({
        status: z.enum(STATUS_FEEDBACK).optional(),
        resposta: z.string().max(2000).nullable().optional(),
      })
      .refine((d) => d.status !== undefined || d.resposta !== undefined, {
        message: "Informe o status ou a resposta",
      })
      .parse(request.body);
    const atualizarStatusFeedbackUseCase = container.resolve(AtualizarStatusFeedbackUseCase);
    return response.json(
      await atualizarStatusFeedbackUseCase.execute(id, {
        ...(status !== undefined ? { status } : {}),
        ...(resposta !== undefined ? { resposta } : {}),
      }),
    );
  }

  async excluirFeedback(request: Request, response: Response): Promise<Response> {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const deleteFeedbackUseCase = container.resolve(DeleteFeedbackUseCase);
    await deleteFeedbackUseCase.execute(id);
    return response.status(204).send();
  }
}

export { AdminController };
