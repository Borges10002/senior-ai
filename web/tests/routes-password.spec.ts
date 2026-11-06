import { beforeEach, describe, expect, it } from "vitest";
import { api, publicApi } from "src/boot/axios";
import { sessionReady, sessionUser, setSession, clearSession } from "src/services/session";
import { authorizeRoute } from "src/router/authGuard";
import { senhaService } from "src/services/senhaService";
import { usePerfil } from "src/composables/usePerfil";

const user = { codigo: 1, nome: "Ana", perfil: { admin: false } };
function ok(config: any, data: any) { return { config, data, status: 200, statusText: "OK", headers: {} }; }
beforeEach(() => { clearSession(); usePerfil().limpar(); });
describe("Rotas protegidas", () => {
  it("visitante nao entra em paginas privadas ou administrativas", async () => {
    for (const meta of [{ requiresAuth: true }, { requiresAdmin: true }]) {
      expect(await authorizeRoute({ path: "/app", matched: [{ meta }] })).toBe("/login");
    }
    expect(await authorizeRoute({ path: "/redefinir-senha", matched: [] })).toBe(true);
  });
  it("usuario autenticado pode navegar e login redireciona ao dashboard", async () => {
    setSession(user);
    expect(await authorizeRoute({ path: "/login", matched: [] })).toBe("/app/dashboard");
    expect(await authorizeRoute({ path: "/app/reunioes", matched: [{ meta: { requiresAuth: true } }] })).toBe(true);
  });
  it("admin depende do perfil atualizado pela API", async () => {
    setSession(user);
    const route = { path: "/app/admin", matched: [{ meta: { requiresAdmin: true } }] };
    api.defaults.adapter = async c => ok(c, user);
    expect(await authorizeRoute(route)).toBe("/app/dashboard");
    api.defaults.adapter = async c => ok(c, { ...user, perfil: { admin: true } });
    expect(await authorizeRoute(route)).toBe(true);
  });
  it("restaura cookies antes de decidir uma rota", async () => {
    sessionReady.value = false;
    api.defaults.adapter = async c => ok(c, user);
    expect(await authorizeRoute({ path: "/app", matched: [{ meta: { requiresAuth: true } }] })).toBe(true);
  });
});
describe("Servicos de senha", () => {
  it("alterar senha envia a senha atual e encerra a sessao apos sucesso", async () => {
    setSession(user);
    const dados = { senhaAtual: "Antiga@123", novaSenha: "Nova@12345", confirmarSenha: "Nova@12345" };
    api.defaults.adapter = async c => {
      expect(c.url).toBe("/usuarios/alterar-senha"); expect(c.method).toBe("put");
      expect(JSON.parse(c.data)).toEqual(dados); expect(sessionUser.value).toEqual(user);
      return ok(c, {});
    };
    await senhaService.alterar(dados);
    expect(sessionUser.value).toBeNull();
  });
  it("erro de validacao ao alterar senha preserva a sessao", async () => {
    setSession(user);
    api.defaults.adapter = async c => { throw { config: c, response: { status: 400 } }; };
    await expect(senhaService.alterar({ senhaAtual: "errada", novaSenha: "Nova@123", confirmarSenha: "Nova@123" })).rejects.toBeDefined();
    expect(sessionUser.value).toEqual(user);
  });
  it("solicitacao de recuperacao envia apenas email e apresenta mensagem generica", async () => {
    publicApi.defaults.adapter = async c => {
      expect(c.url).toBe("/senha/esqueci"); expect(JSON.parse(c.data)).toEqual({ email: "ana@test.com" });
      return ok(c, { message: "Se este e-mail estiver cadastrado, enviaremos um link." });
    };
    expect(await senhaService.esqueci("ana@test.com")).toContain("Se este e-mail");
  });
  it("redefinicao envia token no corpo e encerra sessao antiga", async () => {
    setSession(user);
    publicApi.defaults.adapter = async c => {
      expect(c.url).toBe("/senha/redefinir");
      expect(JSON.parse(c.data)).toEqual({ token: "reset-token", senha: "Nova@123" });
      return ok(c, { message: "Senha alterada" });
    };
    expect(await senhaService.redefinir("reset-token", "Nova@123")).toBe("Senha alterada");
    expect(sessionUser.value).toBeNull();
  });
});
