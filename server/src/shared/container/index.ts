import { container } from "tsyringe";

import type IAuditoriaRepository from "@modules/auditoria/domain/repositories/IAuditoriaRepository";
import { AuditoriaRepository } from "@modules/auditoria/infra/typeorm/repositories/AuditoriaRepository";
import type ISessaoRepository from "@modules/auth/domain/repositories/ISessaoRepository";
import { SessaoRepository } from "@modules/auth/infra/typeorm/repositories/SessaoRepository";
import type IReuniaoRepository from "@modules/reunioes/domain/repositories/IReuniaoRepository";
import { ReuniaoRepository } from "@modules/reunioes/infra/typeorm/repositories/ReuniaoRepository";
import type IUsuarioRepository from "@modules/usuarios/domain/repositories/IUsuarioRepository";
import { UsuarioRepository } from "@modules/usuarios/infra/typeorm/repositories/UsuarioRepository";

container.registerSingleton<IUsuarioRepository>("UsuarioRepository", UsuarioRepository);
container.registerSingleton<ISessaoRepository>("SessaoRepository", SessaoRepository);
container.registerSingleton<IReuniaoRepository>("ReuniaoRepository", ReuniaoRepository);
container.registerSingleton<IAuditoriaRepository>("AuditoriaRepository", AuditoriaRepository);
