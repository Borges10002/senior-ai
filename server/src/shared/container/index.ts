import "@/config/env";
import { container } from "tsyringe";

import IAgendamentoRepository from "@modules/agenda/domain/repositories/IAgendamentoRepository";
import { AgendamentoRepository } from "@modules/agenda/infra/typeorm/repositories/AgendamentoRepository";
import type IAnalistaProvider from "@modules/anotacoes/domain/analise";
import IAnotacaoRepository from "@modules/anotacoes/domain/repositories/IAnotacaoRepository";
import { ClaudeAnalistaProvider } from "@modules/anotacoes/infra/anthropic/ClaudeAnalistaProvider";
import { AnotacaoRepository } from "@modules/anotacoes/infra/typeorm/repositories/AnotacaoRepository";
import type IFilaProcessamento from "@modules/gravacoes/domain/IFilaProcessamento";
import IGravacaoRepository from "@modules/gravacoes/domain/repositories/IGravacaoRepository";
import { GravacaoRepository } from "@modules/gravacoes/infra/typeorm/repositories/GravacaoRepository";
import type IExtratorAudio from "@modules/transcricoes/domain/IExtratorAudio";
import type ITranscricaoProvider from "@modules/transcricoes/domain/ITranscricaoProvider";
import ISegmentoRepository from "@modules/transcricoes/domain/repositories/ISegmentoRepository";
import { FfmpegExtratorAudio } from "@modules/transcricoes/infra/ffmpeg/FfmpegExtratorAudio";
import { WhisperTranscricaoProvider } from "@modules/transcricoes/infra/openai/WhisperTranscricaoProvider";
import { SegmentoRepository } from "@modules/transcricoes/infra/typeorm/repositories/SegmentoRepository";
import { FilaProcessamento } from "@shared/infra/queue/FilaProcessamento";
import type IStorageProvider from "@shared/providers/storage/IStorageProvider";
import { LocalStorageProvider } from "@shared/providers/storage/LocalStorageProvider";
import { S3StorageProvider } from "@shared/providers/storage/S3StorageProvider";

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
container.registerSingleton<IGravacaoRepository>("GravacaoRepository", GravacaoRepository);
container.registerSingleton<ISegmentoRepository>("SegmentoRepository", SegmentoRepository);
container.registerSingleton<IAnotacaoRepository>("AnotacaoRepository", AnotacaoRepository);
container.registerSingleton<IAgendamentoRepository>("AgendamentoRepository", AgendamentoRepository);
container.registerSingleton<IStorageProvider>(
  "StorageProvider",
  process.env.STORAGE_PROVIDER === "s3" ? S3StorageProvider : LocalStorageProvider,
);
container.registerSingleton<IFilaProcessamento>("FilaProcessamento", FilaProcessamento);
container.registerSingleton<IExtratorAudio>("ExtratorAudio", FfmpegExtratorAudio);
container.registerSingleton<ITranscricaoProvider>("TranscricaoProvider", WhisperTranscricaoProvider);
container.registerSingleton<IAnalistaProvider>("AnalistaProvider", ClaudeAnalistaProvider);
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

