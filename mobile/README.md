# Senior AI Mobile

App React Native (Expo SDK 57 + Expo Router) do Senior AI. Usa a mesma API do projeto web (`../server`).

## Funcionalidades

- **Início**: indicadores e próximas reuniões.
- **Reuniões**: lista, iniciar, finalizar e cancelar.
- **Nova reunião**: título e assunto.
- **Relatórios**: taxa de economia, evolução dos últimos 6 meses e gastos por categoria.
- **Mais**: categorias, clientes, alterar senha e sair.
- Tema claro e escuro automático; sessão guardada no armazenamento seguro do aparelho, com renovação automática do token.

## Como rodar

```bash
cd mobile
npm install
npx expo start
```

Leia o QR code com o app **Expo Go** (Android ou iOS). Por padrão o app usa a API publicada no Render.
Para usar outra API, copie `.env.example` para `.env` e ajuste `EXPO_PUBLIC_API_URL`.

## Estrutura

```
src/
  app/        telas e navegação (Expo Router)
  domain/     modelos e regras puras (reuniões, formatação, versão, segurança)
  infra/      cliente HTTP, serviços da API e armazenamento da sessão
  state/      contexto de autenticação e estado das reuniões
  ui/         tema e componentes visuais
```

