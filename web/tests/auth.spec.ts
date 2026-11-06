import { beforeEach, describe, expect, it, vi } from "vitest";

const ui = vi.hoisted(() => ({ push: vi.fn(), notify: vi.fn() }));
vi.mock("vue-router", () => ({ useRouter: () => ({ push: ui.push }) }));
vi.mock("quasar", () => ({ useQuasar: () => ({ notify: ui.notify }) }));
vi.mock("src/composables/UseNotify", () => ({ useNotify: () => ({ notifySuccess: ui.notify }) }));
import { api, publicApi, restoreSession, refreshSession } from "src/boot/axios";
import { sessionUser, sessionReady, setSession, clearSession } from "src/services/session";
import { useAuth } from "src/composables/useAuth";
import { usePerfil } from "src/composables/usePerfil";

function ok(config: any, data: any) { return { data, status: 200, statusText: "OK", headers: {}, config }; }
function unauthorized(config: any) { return Promise.reject({ config, response: { status: 401 } }); }
const user = { codigo: 1, nome: "Ana", email: "ana@test.com", perfil: { admin: false, nivel: 1 } };
beforeEach(() => { clearSession(); sessionReady.value = false; usePerfil().limpar(); });

describe("Autenticacao no navegador", () => {
  it("login usa cookies e nao persiste tokens, refresh ou dados pessoais", async () => {
    publicApi.defaults.adapter = async config => {
      expect(config.withCredentials).toBe(true);
      expect(config.headers["X-Auth-Mode"]).toBe("cookie");
      expect(config.headers.Authorization).toBeUndefined();
      expect(JSON.parse(config.data)).toEqual({ email: "ana@test.com", password: "Senha@123" });
      return ok(config, { user });
    };
    const log = vi.spyOn(console, "log"), error = vi.spyOn(console, "error");
    await useAuth().login({ email: "ana@test.com", password: "Senha@123" });
    expect(sessionUser.value).toEqual(user);
    expect(ui.push).toHaveBeenCalledWith("/app/dashboard");
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(log).not.toHaveBeenCalled(); expect(error).not.toHaveBeenCalled();
    log.mockRestore(); error.mockRestore();
  });
  it("remove credenciais legadas inclusive do composable antigo", () => {
    for (const key of ["auth_token", "user", "CICLOCAIRU@TIPEC23500/USER", "TIPEC23500-USER-DATA"]) localStorage.setItem(key, "secret");
    setSession(user);
    for (const key of ["auth_token", "user", "CICLOCAIRU@TIPEC23500/USER", "TIPEC23500-USER-DATA"]) expect(localStorage.getItem(key)).toBeNull();
  });
  it("restaura a sessao uma vez com perfil vindo da API", async () => {
    const adapter = vi.fn(async config => ok(config, user));
    api.defaults.adapter = adapter;
    await Promise.all([restoreSession(), restoreSession()]);
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(sessionUser.value).toEqual(user);
    expect(sessionReady.value).toBe(true);
  });
  it("renova cookies uma vez para requisicoes concorrentes e tenta novamente", async () => {
    const refresh = vi.fn(async config => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return ok(config, { user });
    });
    publicApi.defaults.adapter = refresh;
    const calls = vi.fn(async config => config._sessionRetried ? ok(config, { ok: true }) : unauthorized(config));
    api.defaults.adapter = calls;
    await Promise.all([api.get("/reunioes"), api.get("/reunioes/1")]);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(calls).toHaveBeenCalledTimes(4);
    expect(sessionUser.value).toEqual(user);
  });
  it("falha do refresh encerra a sessao sem loop ou retry infinito", async () => {
    setSession(user);
    const refresh = vi.fn(unauthorized), calls = vi.fn(unauthorized);
    publicApi.defaults.adapter = refresh; api.defaults.adapter = calls;
    await expect(api.get("/reunioes")).rejects.toBeDefined();
    expect(sessionUser.value).toBeNull();
    expect(refresh).toHaveBeenCalledTimes(1); expect(calls).toHaveBeenCalledTimes(1);
  });
  it("rejeicao apos refresh tenta somente uma vez e limpa estado", async () => {
    publicApi.defaults.adapter = async config => ok(config, { user });
    const calls = vi.fn(unauthorized); api.defaults.adapter = calls;
    await expect(api.get("/reunioes")).rejects.toBeDefined();
    expect(calls).toHaveBeenCalledTimes(2);
    expect(sessionUser.value).toBeNull();
  });
  it("logout so limpa estado depois da revogacao no servidor", async () => {
    setSession(user);
    publicApi.defaults.adapter = async config => {
      expect(config.url).toBe("/sessions/logout");
      expect(sessionUser.value).toEqual(user);
      return ok(config, {});
    };
    await useAuth().logout();
    expect(sessionUser.value).toBeNull();
    expect(ui.push).toHaveBeenCalledWith("/login");
  });
  it("erro de rede no logout permite nova tentativa de revogacao", async () => {
    setSession(user);
    publicApi.defaults.adapter = async () => { throw new Error("offline"); };
    await expect(useAuth().logout()).rejects.toThrow("offline");
    expect(sessionUser.value).toEqual(user);
    expect(ui.push).not.toHaveBeenCalled();
  });
  it("cadastro envia apenas os campos esperados e nao registra senha em erros", async () => {
    publicApi.defaults.adapter = async config => {
      expect(config.url).toBe("/usuarios");
      expect(JSON.parse(config.data)).toEqual({ nome: "Ana", usuario: "ANA", email: "ana@test.com", senha: "Senha@123", cpf: "00000000000" });
      throw { config, response: { data: { message: "Dados invalidos" } } };
    };
    const error = vi.spyOn(console, "error");
    await expect(useAuth().register({ name: " Ana ", email: "ana@test.com", password: "Senha@123" })).rejects.toBeDefined();
    expect(error).not.toHaveBeenCalled(); error.mockRestore();
  });
  it("nao confia em perfil admin salvo no navegador", async () => {
    localStorage.setItem("user", JSON.stringify({ perfil: { admin: true } }));
    setSession(user);
    api.defaults.adapter = async config => ok(config, user);
    await usePerfil().carregar();
    expect(usePerfil().isAdmin.value).toBe(false);
  });
  it("resposta atrasada de refresh nao restaura usuario depois do logout", async () => {
    setSession(user);
    let finish!: () => void;
    publicApi.defaults.adapter = config => new Promise(resolve => { finish = () => resolve(ok(config, { user })); });
    const pending = refreshSession();
    clearSession();
    finish();
    await expect(pending).rejects.toThrow(/Sessão alterada/);
    expect(sessionUser.value).toBeNull();
  });
});
