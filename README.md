# Senior AI

**Um assessor sênior no celular.** O app filma a reunião, transcreve o que foi dito, anota resumo, decisões, tarefas e pendências e agenda sozinho as próximas reuniões, sem ninguém precisar confirmar.

Produto **DimiTech**. A base (estrutura, segurança, testes, assinatura e lançamento do app) é a mesma do projeto MyFinances.

---

## Como funciona

```text
App (câmera) -> API (upload) -> armazenamento privado -> fila
                                                          |
Worker: ffmpeg extrai o áudio -> Whisper transcreve -> Claude anota -> agenda
                                                          |
App acompanha o andamento e mostra o resultado <----------+
```

- **Gravação:** o dono confirma que avisou os participantes (LGPD) e grava pelo celular.
- **Transcrição:** OpenAI Whisper, com o horário de cada trecho. Essa API não identifica quem falou.
- **Anotações:** Claude gera resumo, assuntos, decisões, tarefas e pendências, sempre com o horário do trecho de origem.
- **Agenda automática:** o que foi combinado com data e hora vira reunião na agenda do dono, sem confirmação (substitui a RN009). Nada é enviado a terceiros, tudo fica na auditoria e o dono pode cancelar. Sugestões não viram agenda. Em conflito de horário nada é sobreposto: o app avisa e indica o próximo horário livre.
- **Falhas:** o vídeo original nunca é apagado (RN013), a etapa tenta 3 vezes e a gravação pode ser reprocessada.

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
| `gravacoes` | Pronto: upload privado de vídeo, acompanhamento, download pelo dono e reprocessamento |
| `transcricoes` | Pronto: ffmpeg e Whisper no worker |
| `anotacoes` | Pronto: análise com Claude e saída validada por schema |
| `agenda` | Pronto: agendamento automático com conflitos; Google e Outlook na próxima etapa |
| `auditoria` | Pronto: registra gravações, agendamentos automáticos e exclusões |
| `notificacoes` | Base de avisos por e-mail, ainda sem aviso de tarefas |
| Participantes, gestão de tarefas, assistente por voz | Próximas fases |
| Integrações com Google Calendar e Outlook | Próximas fases |

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

**Chaves de IA:** preencha `OPENAI_API_KEY` e `ANTHROPIC_API_KEY` em `server/.env` e rode `docker compose up -d` de novo. Sem elas a gravação termina como falha e pode ser reprocessada depois.

**Testar no celular:** a câmera só funciona em aparelho físico. Com o celular na mesma rede do computador:

1. Em `server/.env`, use `API_BIND=0.0.0.0` (só em desenvolvimento) e rode `docker compose up -d`. A porta 3333 precisa estar livre no computador.
2. Em `mobile/.env`, use `EXPO_PUBLIC_API_URL=http://<ip-do-computador>:3333`.
3. Rode `npx expo start` e abra o app. Na tela Início, toque em **Gravar reunião agora**.

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
- Reunião e gravação de outro usuário respondem 404, sem revelar que o id existe.
- Vídeos ficam em armazenamento privado e só saem pela API, depois de conferir o dono.
- A fala transcrita é tratada como dado: quem fala na reunião não consegue dar ordens à IA.
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
- Bucket privado para os vídeos (`STORAGE_PROVIDER=s3`), porque o volume local não atende mais de um servidor.
- Chaves da OpenAI e da Anthropic.

---

Desenvolvido por **[DimiTech](https://www.dimitech.com.br/)**.
