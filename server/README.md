# Senior AI API

API em Node.js, TypeScript, Express e TypeORM, com PostgreSQL.

## Executar localmente

Requisitos: Node.js, npm e Docker com Docker Compose.

```powershell
npm install
Copy-Item .env.local.example .env.local
npm run db:local
npm run dev:local
```

API: http://localhost:3333. Swagger: http://localhost:3333/docs (desligado com
NODE_ENV=production; para expor em produção, defina SWAGGER_PUBLICO=true).
O banco local usa a porta 5432, banco senior-ai e usuário/senha docker.
O TypeORM cria/atualiza as tabelas ao iniciar. Os dados persistem no volume Docker.
O modo local ignora DATABASE_URL herdado. Mantenha DB_HOST=localhost em .env.local.

## Executar com o banco online

```powershell
Copy-Item .env.online.example .env.online
# Preencha DATABASE_URL, JWT_SECRET e JWT_REFRESH_SECRET antes de iniciar.
npm run dev:online
```

Esse comando executa a API nesta máquina conectada ao banco online. Operações e
sincronização automática das tabelas afetam esse banco. Para acessar a aplicação
já publicada, continue usando seu endereço público.

Os comandos explícitos carregam apenas .env.local ou .env.online, com prioridade
sobre as variáveis herdadas. Esses arquivos são privados e ignorados pelo Git.

## Versão compilada

```powershell
npm run build
npm run start:local
# Ou, com as credenciais online configuradas:
npm run start:online
```

## Publicação existente

A hospedagem continua usando npm run build e npm start. Esses comandos preservam
o comportamento anterior: variáveis da hospedagem e .env, se existir, sem
substituir variáveis já definidas. Configure DATABASE_URL, JWT_SECRET,
JWT_REFRESH_SECRET e PORT na hospedagem. Não é necessário criar .env.online
no serviço publicado quando ele usa npm start.

npm run dev também continua disponível com a configuração tradicional.
