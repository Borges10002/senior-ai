import { clearSessionCookies } from "@modules/accounts/infra/http/sessionCookies";
import { ChangePasswordUseCase } from "@modules/usuario/useCases/ChangePasswordUseCase";
import { CreateUsuarioUseCase } from "@modules/usuario/useCases/CreateUsuarioUseCase";
import type { CreateUsuarioDTO } from "@modules/usuario/useCases/CreateUsuarioUseCase";
import { DeleteUsuarioUseCase } from "@modules/usuario/useCases/DeleteUsuarioUseCase";
import { GetUsuarioByEmailUseCase } from "@modules/usuario/useCases/GetUsuarioByEmailUseCase";
import { GetUsuarioByUsuarioUseCase } from "@modules/usuario/useCases/GetUsuarioByUsuarioUseCase";
import { GetUsuarioUseCase } from "@modules/usuario/useCases/GetUsuarioUseCase";
import { UpdateUsuarioUseCase } from "@modules/usuario/useCases/UpdateUsuarioUseCase";
import { resumoPerfil } from "@modules/usuario/domain/perfil";
import stringUtils from "@utils/string.utils";
import { Request, Response } from "express";
import { container } from "tsyringe";
import { z } from "zod";

const mapUsuarioToResponse = (usuario: any) => ({
  codigo: Number(usuario.codigo),
  nome: usuario.nome,
  usuario: usuario.usuario,
  email: usuario.email,
  ativo: usuario.ativo,
  nivelacesso: Number(usuario.nivelacesso),
  perfil: resumoPerfil(usuario.nivelacesso),
  nomeAbreviado: stringUtils().getNomeAbreviadoUsuario(usuario.nome),
});

class UsuarioController {
  async create(request: Request, response: Response): Promise<Response> {
    const createUsuarioSchema = z.object({
      nome: z.string().min(1),
      usuario: z.string().min(1),
      senha: z.union([z.string(), z.number()]).transform((val) => String(val)),
      email: z.string().email(),
      cpf: z.union([z.string(), z.number()]).transform((val) => String(val)),
    });

    const validatedData = createUsuarioSchema.parse(
      request.body,
    ) as CreateUsuarioDTO;

    const createUsuarioUseCase = container.resolve(CreateUsuarioUseCase);

    const usuario = await createUsuarioUseCase.execute(validatedData);

    return response.status(201).json(mapUsuarioToResponse(usuario));
  }

  async show(request: Request, response: Response): Promise<Response> {
    const codigo = Number(request.userAuth.codigo);
    const getUsuarioUseCase = container.resolve(GetUsuarioUseCase);
    const usuario = await getUsuarioUseCase.execute(codigo);
    return response.json(mapUsuarioToResponse(usuario));
  }

  async showById(request: Request, response: Response): Promise<Response> {
    const getUsuarioSchema = z.object({
      codigo: z.coerce.number().min(1),
    });

    const { codigo } = getUsuarioSchema.parse(request.params);
    const codigoLogado = Number(request.userAuth.codigo);
    if (codigo !== codigoLogado) {
      return response.status(404).json({ message: "Usuario nao encontrado" });
    }
    const getUsuarioUseCase = container.resolve(GetUsuarioUseCase);
    const usuario = await getUsuarioUseCase.execute(codigo);
    return response.json(mapUsuarioToResponse(usuario));
  }

  async update(request: Request, response: Response): Promise<Response> {
    const getUsuarioSchema = z.object({
      codigo: z.coerce.number().min(1),
    });

    const { codigo } = getUsuarioSchema.parse(request.params);
    const codigoLogado = Number(request.userAuth.codigo);
    if (codigo !== codigoLogado) {
      return response.status(404).json({ message: "Usuario nao encontrado" });
    }

    // Senha, status e nivel de acesso nao sao alterados por esta rota.
    const updateUsuarioSchema = z.object({
      nome: z.string().optional(),
      usuario: z.string().optional(),
      email: z.string().email().optional(),
      cpf: z.string().optional(),
    });

    const validatedData = updateUsuarioSchema.parse(request.body);
    const updateUsuarioUseCase = container.resolve(UpdateUsuarioUseCase);
    const usuario = await updateUsuarioUseCase.execute(codigo, validatedData);

    return response.json(mapUsuarioToResponse(usuario));
  }

  async changePassword(request: Request, response: Response): Promise<Response> {
    const changePasswordSchema = z
      .object({
        senhaAtual: z.string().min(1),
        novaSenha: z.string().min(1),
        confirmarSenha: z.string().min(1),
      })
      .refine((data) => data.novaSenha === data.confirmarSenha, {
        message: "As senhas devem ser iguais",
        path: ["confirmarSenha"],
      });

    const { senhaAtual, novaSenha } = changePasswordSchema.parse(request.body);
    const codigo = Number(request.userAuth.codigo);

    const changePasswordUseCase = container.resolve(ChangePasswordUseCase);
    await changePasswordUseCase.execute({
      codigo,
      senhaAtual,
      novaSenha,
    });

    clearSessionCookies(response);
    return response.status(204).send();
  }

  async delete(request: Request, response: Response): Promise<Response> {
    const getUsuarioSchema = z.object({
      codigo: z.coerce.number().min(1),
    });

    const { codigo } = getUsuarioSchema.parse(request.params);
    const codigoLogado = Number(request.userAuth.codigo);
    if (codigo !== codigoLogado) {
      return response.status(404).json({ message: "Usuario nao encontrado" });
    }
    const deleteUsuarioUseCase = container.resolve(DeleteUsuarioUseCase);
    await deleteUsuarioUseCase.execute(codigo);
    return response.status(204).send();
  }

  async findByEmail(request: Request, response: Response): Promise<Response> {
    const emailSchema = z.object({
      email: z.string().email(),
    });

    const { email } = emailSchema.parse(request.params);
    const getUsuarioByEmailUseCase = container.resolve(GetUsuarioByEmailUseCase);
    const usuario = await getUsuarioByEmailUseCase.execute(email);

    return response.json({ exists: Boolean(usuario) });
  }

  async findByUsuario(request: Request, response: Response): Promise<Response> {
    const usuarioSchema = z.object({
      usuario: z.string().min(1),
    });

    const { usuario } = usuarioSchema.parse(request.params);
    const getUsuarioByUsuarioUseCase = container.resolve(
      GetUsuarioByUsuarioUseCase,
    );
    const usuarioFound = await getUsuarioByUsuarioUseCase.execute(usuario);
    const codigoLogado = Number(request.userAuth.codigo);
    if (!usuarioFound || Number(usuarioFound.codigo) !== codigoLogado) {
      return response.json(null);
    }

    return response.json(mapUsuarioToResponse(usuarioFound));
  }
}

export { UsuarioController };
