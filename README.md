# Senior AI

**Assistente executivo inteligente.** Grava e transcreve reuniões, gera atas com IA, extrai decisões e tarefas e administra a agenda do proprietário. Toda ação sensível pede autorização antes de ser executada.

Plataformas: Web, Android e iOS.

---

## Stack

A stack segue a do projeto **MyFinances**, para reaproveitar padrões, segurança e infraestrutura que já estão em produção.

| Pasta | O que é | Tecnologias |
|---|---|---|
| [`server/`](server) | API REST + worker de IA | Node.js 22, TypeScript, Express, tsyringe, TypeORM, PostgreSQL 16, Redis 7, BullMQ, Zod, Vitest |
| [`web/`](web) | Sistema web | Vue 3, Quasar 2, Axios |
| [`mobile/`](mobile) | App Android e iOS | React Native 0.88, Expo SDK 58, Expo Router, SecureStore |
| `docs/` | Documentação funcional | — |

Diferenças em relação à especificação original, que previa NestJS, Prisma e Next.js:

| Especificação | Adotado | Motivo |
|---|---|---|
| NestJS | Express + tsyringe + use cases | Mesmo padrão modular do MyFinances (domínio / casos de uso / infra) |
| Prisma | TypeORM com migrations versionadas | Igual ao MyFinances |
| Next.js | Vue 3 + Quasar | Igual ao MyFinances; reaproveita componentes |
| Tabelas em inglês (`meetings`, `users`) | Tabelas em português (`reunioes`, `usuarios`) | Convenção do MyFinances. As **rotas** da API seguem a especificação (`/meetings`, `/auth/...`) |

## Estrutura

```text
senior-ai/
├── server/
│   ├── src/
│   │   ├── @types/express/        tipagem de req.userAuth
│   │   ├── config/                env, segurança de produção, auth, cors, redis
│   │   ├── constants/
│   │   ├── modules/
│   │   │   └── <modulo>/
│   │   │       ├── domain/        regras puras e interfaces de repositório
│   │   │       ├── useCases/      casos de uso (+ .spec.ts)
│   │   │       └── infra/
│   │   │           ├── http/      controller (validação Zod) e rotas
│   │   │           ├── typeorm/   entidades e repositórios
│   │   │           └── jobs/      processadores BullMQ (Fase 3)
│   │   └── shared/
│   │       ├── container/         registro de dependências (tsyringe)
│   │       ├── errors/AppError.ts
│   │       ├── testes/            setup e repositórios em memória
│   │       └── infra/
│   │           ├── http/          app, server, middlewares, swagger, rotas
│   │           ├── queue/         filas BullMQ e entrada do worker
│   │           └── typeorm/       DataSource e migrations
│   ├── Dockerfile                 multi-stage, usuário sem root, sem .env na imagem
│   ├── docker-compose.yml         postgres, redis, api, worker (perfil)
│   └── .env.example
├── web/src/                       boot, composables, domain, layouts, pages, router, services
└── mobile/src/                    app (rotas Expo Router), domain, infra, state, ui
```

### Módulos da API

| Módulo | Situação |
|---|---|
| `usuarios`, `auth` | Pronto: cadastro, login, refresh com rotação, logout, `/auth/me` |
| `reunioes` | Pronto: CRUD, iniciar, finalizar, cancelar |
| `auditoria` | Pronto: login, logout, reuso de refresh token, exclusão de reunião |
| `participantes`, `gravacoes`, `armazenamento` | Fase 2 |
| `transcricoes`, `atas`, `decisoes`, `tarefas`, `ia`, `assistente` | Fase 3 |
| `agenda`, `aprovacoes`, `notificacoes`, `integracoes` | Fase 4 |

## Como rodar localmente

Requisitos: **Node.js 22.12 ou mais novo** e **Docker**.

### API (Docker)

```bash
cd server
cp .env.example .env
```

Troque todos os valores `SUBSTITUIR_...` por segredos aleatórios. Para gerar um:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

```bash
docker compose up -d --build
```

- API: `http://localhost:3333/api/v1`, com saúde em `/api/v1/health`
- Swagger: `http://localhost:3333/api/docs` (fica desligado em produção)
- As migrations são aplicadas quando a API sobe.
- Se as portas 5432 ou 6379 já estiverem em uso, ajuste `DB_HOST_PORT` e `REDIS_HOST_PORT` no `.env`.

### API fora do Docker (desenvolvimento)

```bash
cd server
npm install
cp .env.example .env.local
npm run db:local
npm run dev
```

O `.env.local` aponta para `localhost`. Depois, ajuste as portas.

### Web

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

Abre em `http://localhost:9000`.

### Mobile

```bash
cd mobile
npm install
cp .env.example .env
npx expo start
```

No emulador Android, use `EXPO_PUBLIC_API_URL=http://10.0.2.2:3333/api/v1`.

> A gravação em segundo plano (Fase 2) exige um *development build* (`npx expo run:android` ou `eas build`). Ela não funciona no Expo Go.

## Testes e verificações

| Pasta | Comandos |
|---|---|
| `server` | `npm test` · `npm run typecheck` · `npm run build` |
| `web` | `npm test` · `npm run typecheck` · `npm run build` |
| `mobile` | `npm test` · `npm run typecheck` · `npm run lint` |

## Segurança

- Nenhum segredo no Git: `.env`, `.env.local` e `.env` do mobile são ignorados.
- A API recusa subir em produção com segredos de exemplo, segredos JWT iguais, CORS sem HTTPS, `DB_SYNCHRONIZE` ou `DEBUG` ligados.
- Senhas usam bcrypt com custo 12. O login usa o mesmo tempo de resposta para e-mail inexistente e senha errada.
- O access token JWT dura 15 minutos. O refresh token é opaco, rotativo e gravado só como HMAC. Se um refresh token for reutilizado, a sessão é revogada.
- Usuário, versão da credencial e sessão são conferidos no banco a cada requisição: o logout e a troca de senha valem na hora.
- Uma reunião de outro usuário responde 404 (RN014). Reuniões iniciadas não podem ser excluídas (RN013).
- Postgres, Redis e API ficam ligados só a `127.0.0.1`. O Redis exige senha.
- No mobile, a sessão fica no SecureStore (Keystore/Keychain) e o backup do Android está desligado.
- **Pendente antes de produção:** no web, o refresh token fica no `sessionStorage`. Ele deve migrar para cookie `httpOnly`, como no MyFinances.

## Roadmap

- **Fase 1 — Estrutura backend:** concluída. Inclui API, Docker, PostgreSQL, Redis, migrations, autenticação JWT, usuários e Swagger.
- **Fase 2 — Reuniões:** reuniões prontas. Faltam participantes, upload de áudio para R2/S3 e histórico de gravações.
- **Fase 3 — IA:** a infraestrutura de filas e o worker estão prontos. Faltam transcrição, atas, decisões, tarefas e busca.
- **Fase 4 — Calendário:** agenda, agendamento por voz, disponibilidade, aprovações e integrações com Google e Outlook.
- **Fase 5 — Aplicativo:** as telas de login e reuniões existem no web e no mobile. Faltam gravação, atas, tarefas e calendário.
- **Fase 6 — Recursos avançados:** memória contextual, resumos, notificações e relatórios.
