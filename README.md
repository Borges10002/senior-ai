# Senior AI

**Assistente executivo inteligente.** Grava e transcreve reuniões, gera atas com IA, extrai decisões e tarefas e administra a agenda do proprietário. Toda ação sensível pede autorização antes de ser executada.

Produto **DimiTech**. A base (estrutura, segurança, testes, assinatura e lançamento do app) é a mesma do projeto MyFinances.

---

## Estrutura do repositório

| Pasta | O que é | Tecnologias |
|---|---|---|
| [`server/`](server) | API REST, assinaturas, webhook de pagamento e worker de IA | Node.js, TypeScript, Express, TypeORM, tsyringe, PostgreSQL 16, Redis, BullMQ, Vitest |
| [`web/`](web) | Sistema web | Vue 3, Quasar 2, ApexCharts, Playwright |
| [`mobile/`](mobile) | App Android e iOS | React Native 0.88, Expo SDK 58, Expo Router, Reanimated |

Cada pasta tem seu próprio README.

### Organização da API

```text
server/src/
├── config/          ambiente, segurança de produção, auth, cors, redis
├── constants/
├── modules/<modulo>/
│   ├── domain/      regras puras e interfaces de repositório
│   ├── useCases/    casos de uso (+ .spec.ts)
│   └── infra/       http (controller, rotas) e typeorm (entidades, repositórios)
├── shared/
│   ├── container/   injeção de dependências
│   ├── errors/      AppError
│   ├── providers/   e-mail
│   ├── testes/      repositórios em memória
│   └── infra/       http, queue (BullMQ e worker), typeorm (migrations), scripts
└── utils/
```

### Situação dos módulos

| Módulo | Situação |
|---|---|
| `accounts`, `usuario` | Pronto: sessões por cookie HttpOnly no web e tokens no app, refresh rotativo, recuperação de senha por e-mail |
| `admin`, `feedback` | Pronto |
| `assinaturas` | Pronto: plano Pro, teste grátis, Asaas, webhook e painel de vendas |
| `reunioes` | Pronto: criar, editar, excluir, iniciar, finalizar, cancelar |
| `auditoria` | Pronto: registra a exclusão de reuniões; pronto para as autorizações da Fase 4 |
| `notificacoes` | Base de avisos por e-mail, ainda sem aviso de tarefas |
| Gravações, participantes, storage | Fase 2 |
| Transcrições, atas, decisões, tarefas, IA, assistente | Fase 3 (filas e worker já existem) |
| Agenda, aprovações, integrações | Fase 4 |

## Como rodar localmente

Requisitos: **Node.js 22.13 ou mais novo** e Docker.

**API**, na porta 3333, com Swagger em `/docs` (desligado em produção):

```bash
cd server
npm install
cp .env.example .env
```

Troque todos os valores `SUBSTITUIR_...` por segredos aleatórios. Se as portas 5432 ou 6379 já estiverem em uso, ajuste `DB_HOST_PORT` e `REDIS_HOST_PORT` (e `DB_PORT` e `REDIS_PORT`, para rodar fora do Docker).

```bash
docker compose up -d --build
```

Para desenvolver a API fora do Docker, crie também um `.env.local` e rode:

```bash
npm run db:local
npm run dev:local
```

**Web**, em `http://localhost:9000`. Crie `web/.env.local` com `API_URL=http://localhost:3333`:

```bash
cd web
npm install
npx quasar dev
```

**Mobile**. Ajuste `EXPO_PUBLIC_API_URL` em `mobile/.env`:

```bash
cd mobile
npm install
npx expo start
```

> A gravação em segundo plano (Fase 2) exigirá um *development build*. Ela não funciona no Expo Go.

**Worker de IA** (Fase 3, ainda sem processadores registrados):

```bash
docker compose --profile worker up -d
```

## Testes

| Pasta | Comando | O que cobre |
|---|---|---|
| `server` | `npm test` | Casos de uso, segurança de sessão, assinaturas, webhook, e-mail |
| `server` | `npm run test:postgres` | Segurança contra um PostgreSQL real e descartável |
| `web` | `npm test` · `npm run typecheck` | Autenticação, senha e rotas |
| `web` | `npm run test:browser` | Login, cookies HttpOnly, renovação e logout no navegador, com API e banco reais |
| `mobile` | `npm test` · `npm run typecheck` · `npm run lint` | Telas, navegação por perfil, sessão e segurança |

## Segurança

- Nenhum segredo no app ou no web: chaves do Asaas, JWT e banco ficam só no servidor.
- Regras de acesso (administrador, plano ativo, dados de cada usuário) são conferidas na API.
- Reunião de outro usuário responde 404, sem revelar que o id existe.
- No web, a sessão fica em cookies HttpOnly. No app, fica no `SecureStore`, com o backup do Android desligado.
- A API recusa subir em produção com segredos fracos ou CORS sem HTTPS.
- Postgres, Redis e API ficam ligados só a `127.0.0.1` no Docker. O Redis exige senha.
- A imagem Docker roda sem root e não leva nenhum `.env`.

## Publicação

O deploy no Render, a compilação do APK no EAS e o lançamento automático funcionam como no MyFinances, mas dependem de configuração própria deste produto:

- Domínios `seniorai.dimitech.com.br` e `api-seniorai.dimitech.com.br`.
- Bucket R2 `seniorai-app`.
- Projeto EAS novo: rode `npx eas-cli@latest init` em `mobile/`.
- Conta e token do Asaas.

---

Desenvolvido por **[DimiTech](https://www.dimitech.com.br/)**.
