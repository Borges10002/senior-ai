# Deploy no Render - Guia Rápido

## Passo 1: Criar Conta
1. Acesse https://render.com
2. Crie conta gratuita (GitHub recomendado)

## Passo 2: Conectar Repositório
1. No dashboard, clique em "New +"
2. Selecione "Web Service"
3. Conecte seu repositório GitHub

## Passo 3: Configurar Serviço

### Build Settings:
- **Name**: senior-ai-api
- **Region**: Oregon (US West)
- **Branch**: main
- **Root Directory**: server
- **Runtime**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### Environment Variables:
```
NODE_ENV=production
PORT=3333
JWT_SECRET=seu-secret-aqui-mude-isso
JWT_EXPIRES_IN=7d
```

## Passo 4: Criar Banco de Dados
1. No dashboard, clique em "New +"
2. Selecione "PostgreSQL"
3. **Name**: senior-ai-db
4. **Region**: Oregon (US West)
5. **Plan**: Free
6. Clique em "Create Database"

## Passo 5: Conectar Banco ao Serviço
1. Vá para o Web Service criado
2. Em "Environment", adicione:
   - **Key**: DATABASE_URL
   - **Value**: Copie "External Database URL" do PostgreSQL criado

## Passo 6: Deploy
1. Clique em "Manual Deploy" > "Deploy latest commit"
2. Aguarde o build (5-10 minutos)
3. Sua API estará em: `https://senior-ai-api.onrender.com`

## Limites do Plano FREE
- ✅ 750 horas/mês
- ✅ PostgreSQL 256MB
- ⚠️ Serviço hiberna após 15min inatividade
- ⚠️ Primeiro request pode demorar 30s

## Testar API
```bash
curl https://senior-ai-api.onrender.com/health
```

## Variáveis de Ambiente Necessárias
- NODE_ENV=production
- PORT=3333
- DATABASE_URL (do PostgreSQL Render)
- JWT_SECRET (gere um seguro)
- JWT_EXPIRES_IN=7d
