import { container } from "tsyringe";

import IAuditoriaRepository from "@modules/auditoria/domain/repositories/IAuditoriaRepository";
import { AuditoriaRepository } from "@modules/auditoria/infra/typeorm/repositories/AuditoriaRepository";
import IReuniaoRepository from "@modules/reunioes/domain/repositories/IReuniaoRepository";
import { ReuniaoRepository } from "@modules/reunioes/infra/typeorm/repositories/ReuniaoRepository";

import IAccountsRepository from "@modules/accounts/domain/repositories/IAccountsRepository";
import AccountsRepository from "@modules/accounts/infra/typeorm/repositories/AccountsRepository";

import IUsuarioRepository from "@modules/usuario/domain/repositories/IUsuarioRepository";
import { UsuarioRepository } from "@modules/usuario/infra/typeorm/repositories/UsuarioRepository";

import IFeedbackRepository from "@modules/feedback/domain/repositories/IFeedbackRepository";
import { FeedbackRepository } from "@modules/feedback/infra/typeorm/repositories/FeedbackRepository";
import type IEmailProvider from "@shared/providers/email/IEmailProvider";
import { EmailProvider } from "@shared/providers/email/EmailProvider";
import IRecuperacaoSenhaRepository from "@modules/accounts/domain/repositories/IRecuperacaoSenhaRepository";
import { RecuperacaoSenhaRepository } from "@modules/accounts/infra/typeorm/repositories/RecuperacaoSenhaRepository";
import IAvisoEmailRepository from "@modules/notificacoes/domain/repositories/IAvisoEmailRepository";
import { AvisoEmailRepository } from "@modules/notificacoes/infra/typeorm/repositories/AvisoEmailRepository";

import IAssinaturaRepository from "@modules/assinaturas/domain/repositories/IAssinaturaRepository";
import { AssinaturaRepository } from "@modules/assinaturas/infra/typeorm/repositories/AssinaturaRepository";
import type { IGatewayPagamento } from "@modules/assinaturas/domain/IGatewayPagamento";
import { AsaasGateway } from "@modules/assinaturas/infra/asaas/AsaasGateway";
import IVendaRepository from "@modules/assinaturas/domain/repositories/IVendaRepository";
import { VendaRepository } from "@modules/assinaturas/infra/typeorm/repositories/VendaRepository";

container.registerSingleton<IReuniaoRepository>("ReuniaoRepository", ReuniaoRepository);
container.registerSingleton<IAuditoriaRepository>("AuditoriaRepository", AuditoriaRepository);

container.registerSingleton<IAccountsRepository>(
  "AccountsRepository",
  AccountsRepository
);

container.registerSingleton<IUsuarioRepository>(
  "UsuarioRepository",
  UsuarioRepository
);

container.registerSingleton<IEmailProvider>(
  "EmailProvider",
  EmailProvider
);
container.registerSingleton<IRecuperacaoSenhaRepository>(
  "RecuperacaoSenhaRepository",
  RecuperacaoSenhaRepository
);
container.registerSingleton<IAvisoEmailRepository>(
  "AvisoEmailRepository",
  AvisoEmailRepository
);

container.registerSingleton<IFeedbackRepository>(
  "FeedbackRepository",
  FeedbackRepository
);

container.registerSingleton<IAssinaturaRepository>(
  "AssinaturaRepository",
  AssinaturaRepository
);
container.registerSingleton<IGatewayPagamento>(
  "GatewayPagamento",
  AsaasGateway
);
container.registerSingleton<IVendaRepository>(
  "VendaRepository",
  VendaRepository
);

