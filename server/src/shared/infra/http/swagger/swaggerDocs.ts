/** Documento OpenAPI servido em /api/docs (só fora de produção). Atualize ao criar rotas. */
const bearer = [{ bearerAuth: [] }];
const idParam = [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }];

const reuniaoBody = {
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["titulo"],
        properties: {
          titulo: { type: "string" },
          assunto: { type: "string", nullable: true },
          objetivo: { type: "string", nullable: true },
          local: { type: "string", nullable: true },
          inicio_previsto: { type: "string", format: "date-time", nullable: true },
          fim_previsto: { type: "string", format: "date-time", nullable: true },
        },
      },
    },
  },
};

const json = (properties: Record<string, unknown>, required: string[]) => ({
  required: true,
  content: { "application/json": { schema: { type: "object", required, properties } } },
});

export default {
  openapi: "3.0.3",
  info: { title: "Senior AI API", version: "0.1.0", description: "Assistente executivo inteligente" },
  servers: [{ url: "/api/v1" }],
  components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } } },
  paths: {
    "/health": { get: { tags: ["Sistema"], summary: "Estado da API, do banco e do Redis" } },
    "/auth/register": {
      post: {
        tags: ["Autenticação"],
        summary: "Cadastro",
        requestBody: json({ nome: { type: "string" }, email: { type: "string" }, senha: { type: "string" } }, ["nome", "email", "senha"]),
      },
    },
    "/auth/login": {
      post: {
        tags: ["Autenticação"],
        summary: "Login (devolve accessToken e refreshToken)",
        requestBody: json({ email: { type: "string" }, senha: { type: "string" } }, ["email", "senha"]),
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Autenticação"],
        summary: "Renovar tokens (o refresh token antigo deixa de valer)",
        requestBody: json({ refreshToken: { type: "string" } }, ["refreshToken"]),
      },
    },
    "/auth/logout": { post: { tags: ["Autenticação"], summary: "Encerrar a sessão atual", security: bearer } },
    "/auth/me": { get: { tags: ["Autenticação"], summary: "Usuário autenticado", security: bearer } },
    "/meetings": {
      get: {
        tags: ["Reuniões"],
        summary: "Listar reuniões do proprietário",
        security: bearer,
        parameters: [
          { name: "de", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "ate", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["AGENDADA", "EM_ANDAMENTO", "FINALIZADA", "CANCELADA"] } },
        ],
      },
      post: { tags: ["Reuniões"], summary: "Criar reunião", security: bearer, requestBody: reuniaoBody },
    },
    "/meetings/{id}": {
      get: { tags: ["Reuniões"], summary: "Consultar", security: bearer, parameters: idParam },
      patch: { tags: ["Reuniões"], summary: "Atualizar", security: bearer, parameters: idParam, requestBody: reuniaoBody },
      delete: { tags: ["Reuniões"], summary: "Excluir (só agendada ou cancelada)", security: bearer, parameters: idParam },
    },
    "/meetings/{id}/start": { post: { tags: ["Reuniões"], summary: "Iniciar", security: bearer, parameters: idParam } },
    "/meetings/{id}/finish": { post: { tags: ["Reuniões"], summary: "Finalizar", security: bearer, parameters: idParam } },
    "/meetings/{id}/cancel": { post: { tags: ["Reuniões"], summary: "Cancelar", security: bearer, parameters: idParam } },
  },
};
