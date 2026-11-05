import type { Request, Response } from "express";
import { container } from "tsyringe";
import { z } from "zod";
import { STATUS_REUNIAO } from "@modules/reunioes/domain/reuniao";
import { CreateReuniaoUseCase } from "@modules/reunioes/useCases/CreateReuniaoUseCase";
import { DeleteReuniaoUseCase } from "@modules/reunioes/useCases/DeleteReuniaoUseCase";
import { GetReuniaoUseCase } from "@modules/reunioes/useCases/GetReuniaoUseCase";
import { ListReunioesUseCase } from "@modules/reunioes/useCases/ListReunioesUseCase";
import { MudarStatusReuniaoUseCase } from "@modules/reunioes/useCases/MudarStatusReuniaoUseCase";
import { UpdateReuniaoUseCase } from "@modules/reunioes/useCases/UpdateReuniaoUseCase";

const textoOpcional = (max: number) => z.string().trim().max(max).nullable().optional();
const dataHora = z.coerce.date().nullable().optional();

const dadosReuniao = z.object({
  titulo: z.string().trim().min(1).max(200),
  assunto: textoOpcional(200),
  objetivo: textoOpcional(5000),
  local: textoOpcional(200),
  inicio_previsto: dataHora,
  fim_previsto: dataHora,
});

const params = z.object({ id: z.string().uuid() });

class ReuniaoController {
  async create(request: Request, response: Response): Promise<Response> {
    const dados = dadosReuniao.parse(request.body);
    const reuniao = await container.resolve(CreateReuniaoUseCase).execute(request.userAuth.id, dados);
    return response.status(201).json(reuniao);
  }

  async index(request: Request, response: Response): Promise<Response> {
    const filtro = z
      .object({
        de: z.coerce.date().optional(),
        ate: z.coerce.date().optional(),
        status: z.enum(STATUS_REUNIAO).optional(),
      })
      .parse(request.query);
    const reunioes = await container.resolve(ListReunioesUseCase).execute(request.userAuth.id, filtro);
    return response.json(reunioes);
  }

  async show(request: Request, response: Response): Promise<Response> {
    const { id } = params.parse(request.params);
    return response.json(await container.resolve(GetReuniaoUseCase).execute(id, request.userAuth.id));
  }

  async update(request: Request, response: Response): Promise<Response> {
    const { id } = params.parse(request.params);
    const dados = dadosReuniao.partial().parse(request.body);
    return response.json(await container.resolve(UpdateReuniaoUseCase).execute(id, request.userAuth.id, dados));
  }

  async delete(request: Request, response: Response): Promise<Response> {
    const { id } = params.parse(request.params);
    await container.resolve(DeleteReuniaoUseCase).execute(id, request.userAuth.id, request.ip);
    return response.status(204).send();
  }

  async iniciar(request: Request, response: Response): Promise<Response> {
    const { id } = params.parse(request.params);
    return response.json(await container.resolve(MudarStatusReuniaoUseCase).execute(id, request.userAuth.id, "iniciar"));
  }

  async finalizar(request: Request, response: Response): Promise<Response> {
    const { id } = params.parse(request.params);
    return response.json(await container.resolve(MudarStatusReuniaoUseCase).execute(id, request.userAuth.id, "finalizar"));
  }

  async cancelar(request: Request, response: Response): Promise<Response> {
    const { id } = params.parse(request.params);
    return response.json(await container.resolve(MudarStatusReuniaoUseCase).execute(id, request.userAuth.id, "cancelar"));
  }
}

export { ReuniaoController };
