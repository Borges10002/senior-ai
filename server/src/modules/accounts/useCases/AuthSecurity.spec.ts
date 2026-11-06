import "express-async-errors";
import express from "express";
import type { Server } from "http";
import bcrypt from "bcryptjs";
import { container } from "tsyringe";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { verify } from "jsonwebtoken";

const state = vi.hoisted(() => ({ sessions: new Map<string, any>() }));
vi.mock("../infra/typeorm/repositories/SessionStore", () => ({ sessions: {
  create: async (s: any) => { state.sessions.set(s.id, { ...s }); },
  active: async (id: string, codigo: number) => {
    const s = state.sessions.get(id);
    return !!s && s.codusuario === codigo && s.expira_em.getTime() > Date.now();
  },
  rotate: async (id: string, old: string, next: string) => {
    const s = state.sessions.get(id);
    if (!s || s.refresh_hash !== old || s.expira_em.getTime() <= Date.now()) return false;
    s.refresh_hash = next;
    return true;
  },
  revoke: async (id: string) => { state.sessions.delete(id); },
  revokeUser: async (codigo: number) => { for (const [id, s] of state.sessions) if (s.codusuario === codigo) state.sessions.delete(id); },
} }));

import authenticateRoutes from "../infra/http/routes/index.routes";
import { usuarioRoutes } from "@modules/usuario/infra/http/routes/usuario.routes";
import ensureAuthenticate from "@middleawares/ensureAuthenticated";
import throwAppError from "@middleawares/throwAppError";
import ensureAdmin from "@middleawares/ensureAdmin";
import corsConfig from "@config/cors.config";
import auth from "@config/auth.config";
import { RecuperarSenhaUseCase } from "./RecuperarSenhaUseCase";
import { AlterarAcessoUsuarioUseCase } from "@modules/admin/useCases/AlterarAcessoUsuarioUseCase";

const origin = "https://app.test";
let server: Server;
let base: string;
let users: any[];
let pedidosHttp: any[];
let emailsHttp: any[];
const repo = {
  findByEmail: async (e: string) => users.find(u => u.email === e) ?? null,
  findById: async (c: number) => users.find(u => Number(u.codigo) === c) ?? null,
  findByUsuarioId: async (c: number) => repo.findById(c),
  update: async (c: number, d: any) => Object.assign(await repo.findById(c), d),
  updatePassword: async (c: number, expected: string, senha: string) => {
    const u = await repo.findById(c); if (!u || u.senha !== expected) return false;
    u.senha = senha; pedidosHttp.forEach(p => p.usado_em = new Date()); return true;
  },
  create: async (u: any) => { users.push(u); return u; },
  getNextCodigo: async () => String(users.length + 1),
};
const headers = { "Content-Type": "application/json", Origin: origin, "X-Auth-Mode": "cookie" };
async function request(url: string, options: any = {}) { return fetch(base + url, options) as Promise<Omit<Response, 'json'> & { json(): Promise<any> }>; }
async function login(web = false, password = "Inicial@123") {
  return request("/sessions", { method: "POST", headers: web ? headers : { "Content-Type": "application/json" }, body: JSON.stringify({ email: "ana@test.com", password }) });
}
function cookies(r: Response) { return r.headers.getSetCookie().map(c => c.split(";")[0]).join("; "); }
function bearer(token: string) { return { Authorization: "Bearer " + token }; }

beforeAll(async () => {
  corsConfig.origens.push(origin);
  container.registerInstance("UsuarioRepository", repo);
  container.registerInstance("AccountsRepository", repo);
  container.registerInstance("CategoriaRepository", { findAll: async () => [], create: async (d: any) => d });
  container.registerInstance("EmailProvider", { enviar: async (m: any) => { emailsHttp.push(m); return true; } });
  container.registerInstance("RecuperacaoSenhaRepository", {
    criar: async (d: any) => { pedidosHttp.push(d); return d; },
    buscarPorHash: async (h: string) => pedidosHttp.find(p => p.token_hash === h && !p.usado_em),
    redefinirSenha: async (h: string, senha: string) => {
      const p = pedidosHttp.find(p => p.token_hash === h && !p.usado_em && new Date(p.expira_em).getTime() > Date.now());
      if (!p || (await repo.findById(p.codusuario))?.ativo !== "S") return false;
      await repo.update(p.codusuario, { senha });
      pedidosHttp.forEach(p => p.usado_em = new Date()); return true;
    },
    encerrarDoUsuario: async (codigo: number) => { pedidosHttp.filter(p => p.codusuario === codigo).forEach(p => p.usado_em = new Date()); },
  });
  const app = express();
  app.use(express.json());
  app.use(ensureAuthenticate);
  app.use(authenticateRoutes);
  app.use(usuarioRoutes);
  app.get("/admin-check", ensureAdmin, (_req, res) => res.json({ ok: true }));
  app.use(throwAppError as any);
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  base = "http://127.0.0.1:" + (server.address() as any).port;
});
afterAll(async () => {
  corsConfig.origens.splice(corsConfig.origens.indexOf(origin), 1);
  await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
});
beforeEach(async () => {
  state.sessions.clear();
  pedidosHttp = []; emailsHttp = [];
  users = [{ codigo: 1, nome: "Ana Teste", usuario: "ANA", email: "ana@test.com", ativo: "S", nivelacesso: 1, senha: await bcrypt.hash("Inicial@123", 4) }];
});

describe("Seguranca HTTP de autenticacao", () => {
  it("mantem Bearer para mobile, armazena somente hash do refresh e rejeita senha errada", async () => {
    expect((await login(false, "incorreta")).status).toBe(401);
    const r = await login();
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.user).not.toHaveProperty("senha");
    expect([...state.sessions.values()][0].refresh_hash).not.toBe(body.refreshToken);
    expect((await request("/usuarios", { headers: bearer(body.token) })).status).toBe(200);
    expect((await request("/usuarios", { headers: bearer(body.refreshToken) })).status).toBe(401);
  });
  it("web recebe cookies HttpOnly e nao recebe tokens no JSON", async () => {
    const r = await login(true);
    expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(await r.json()).not.toHaveProperty("token");
    const set = r.headers.getSetCookie();
    expect(set).toHaveLength(2);
    expect(set.every(c => /HttpOnly/i.test(c))).toBe(true);
    expect((await request("/usuarios", { headers: { Cookie: cookies(r) } })).status).toBe(200);
  });
  it("cookies de producao usam Secure e SameSite=None", async () => {
    const previous = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      const r = await login(true);
      expect(r.headers.getSetCookie().every(c => /; Secure/i.test(c) && /SameSite=None/i.test(c))).toBe(true);
    } finally { process.env.NODE_ENV = previous; }
  });
  it("rotaciona refresh e rejeita reutilizacao, inclusive em concorrencia", async () => {
    const first = await (await login()).json();
    const refresh = () => request("/sessions/refresh-token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken: first.refreshToken }) });
    const results = await Promise.all([refresh(), refresh()]);
    expect(results.map(r => r.status).sort()).toEqual([200, 401]);
    const next = await results.find(r => r.status === 200)!.json();
    expect(next.refreshToken).not.toBe(first.refreshToken);
    expect((await refresh()).status).toBe(401);
    expect((await request("/usuarios", { headers: bearer(next.token) })).status).toBe(200);
  });
  it("logout web revoga a sessao no servidor e limpa os cookies", async () => {
    const r = await login(true);
    const jar = cookies(r);
    const logout = await request("/sessions/logout", { method: "POST", headers: { ...headers, Cookie: jar }, body: "{}" });
    expect(logout.status).toBe(204);
    expect(logout.headers.getSetCookie()).toHaveLength(2);
    expect((await request("/usuarios", { headers: { Cookie: jar } })).status).toBe(401);
    expect((await request("/sessions/refresh-token", { method: "POST", headers: { ...headers, Cookie: jar }, body: "{}" })).status).toBe(401);
  });
  it("logout mobile revoga o token e refresh", async () => {
    const b = await (await login()).json();
    expect((await request("/sessions/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken: b.refreshToken }) })).status).toBe(204);
    expect((await request("/usuarios", { headers: bearer(b.token) })).status).toBe(401);
  });
  it("bloqueia conta desativada e excluida imediatamente", async () => {
    const b = await (await login()).json();
    users[0].ativo = "N";
    expect((await request("/usuarios", { headers: bearer(b.token) })).status).toBe(401);
    expect((await request("/sessions/refresh-token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken: b.refreshToken }) })).status).toBe(401);
    expect((await login()).status).toBe(401);
    users = [];
    expect((await request("/usuarios", { headers: bearer(b.token) })).status).toBe(401);
  });
  it("reativar conta desativada pelo admin nao restaura sessoes revogadas", async () => {
    const b = await (await login()).json();
    const admin = new AlterarAcessoUsuarioUseCase(repo as any);
    await admin.execute({ codigoAdmin: 99, codigo: 1, ativo: false });
    await admin.execute({ codigoAdmin: 99, codigo: 1, ativo: true });
    expect((await request("/usuarios", { headers: bearer(b.token) })).status).toBe(401);
    expect((await login()).status).toBe(200);
  });
  it("recuperacao HTTP preserva resposta generica, invalida sessoes e impede reuso", async () => {
    const old = await login(true), jar = cookies(old);
    const post = (url: string, body: any) => request(url, { method: "POST", headers, body: JSON.stringify(body) });
    const unknown = await post("/senha/esqueci", { email: "ninguem@test.com" });
    const known = await post("/senha/esqueci", { email: "ana@test.com" });
    expect(unknown.status).toBe(200); expect(known.status).toBe(200);
    expect(await unknown.json()).toEqual(await known.json());
    expect(emailsHttp).toHaveLength(1);
    const token = /token=([a-f0-9]{64})/.exec(emailsHttp[0].texto)![1];
    const reset = await post("/senha/redefinir", { token, senha: "Recuperada@123" });
    expect(reset.status).toBe(200); expect(reset.headers.getSetCookie()).toHaveLength(2);
    expect((await request("/usuarios", { headers: { Cookie: jar } })).status).toBe(401);
    expect((await post("/senha/redefinir", { token, senha: "Outra@12345678" })).status).toBe(400);
    expect((await login(false, "Recuperada@123")).status).toBe(200);
  });
  it("troca de senha revoga todas as sessoes, preserva hash e exige novo login", async () => {
    const a = await (await login()).json(), b = await (await login()).json();
    const change = (senhaAtual: string, novaSenha: string) => request("/usuarios/alterar-senha", { method: "PUT", headers: { ...bearer(a.token), "Content-Type": "application/json" }, body: JSON.stringify({ senhaAtual, novaSenha, confirmarSenha: novaSenha }) });
    expect((await change("errada", "Nova@12345678")).status).toBe(400);
    expect((await change("Inicial@123", "fraca")).status).toBe(400);
    expect((await change("Inicial@123", "Nova@12345678")).status).toBe(204);
    expect(await bcrypt.compare("Nova@12345678", users[0].senha)).toBe(true);
    for (const old of [a, b]) {
      expect((await request("/usuarios", { headers: bearer(old.token) })).status).toBe(401);
      expect((await request("/sessions/refresh-token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken: old.refreshToken }) })).status).toBe(401);
    }
    expect((await login()).status).toBe(401);
    expect((await login(false, "Nova@12345678")).status).toBe(200);
  });
  it("recuperacao de senha tambem invalida access e refresh antigos", async () => {
    const b = await (await login()).json();
    const pedidos: any[] = [], emails: any[] = [];
    const uc = new RecuperarSenhaUseCase(repo as any, {
      criar: async (d: any) => { pedidos.push(d); },
      buscarPorHash: async (h: string) => pedidos.find(p => p.token_hash === h && !p.usado_em),
      redefinirSenha: async (h: string, senha: string) => {
        const p = pedidos.find(p => p.token_hash === h && !p.usado_em && new Date(p.expira_em).getTime() > Date.now());
        if (!p) return false;
        await repo.update(p.codusuario, { senha }); pedidos.forEach(p => p.usado_em = new Date()); return true;
      },
      encerrarDoUsuario: async () => { pedidos.forEach(p => p.usado_em = new Date()); },
    } as any, { enviar: async (m: any) => { emails.push(m); return true; } });
    await uc.solicitar("ana@test.com");
    const token = /token=([a-f0-9]{64})/.exec(emails[0].texto)![1];
    await uc.redefinir(token, "Recuperada@123");
    expect((await request("/usuarios", { headers: bearer(b.token) })).status).toBe(401);
    expect((await request("/sessions/refresh-token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken: b.refreshToken }) })).status).toBe(401);
    expect((await login(false, "Recuperada@123")).status).toBe(200);
  });
  it("rejeita CSRF em escrita, refresh, login e logout, inclusive sem Origin", async () => {
    const r = await login(true), jar = cookies(r);
    for (const foreign of ["https://evil.test", undefined]) {
      const h: any = { "Content-Type": "application/json", Cookie: jar, "X-Auth-Mode": "cookie" };
      if (foreign) h.Origin = foreign;
      for (const url of ["/sessions/refresh-token", "/sessions/logout", "/sessions"]) {
        expect((await request(url, { method: "POST", headers: h, body: "{}" })).status).toBe(403);
      }
      expect((await request("/usuarios/1", { method: "PUT", headers: h, body: "{}" })).status).toBe(403);
    }
    expect((await request("/usuarios", { headers: { Cookie: jar } })).status).toBe(200);
  });
  it("remove consulta de e-mail e impede acesso a outro usuario e admin", async () => {
    expect((await request("/usuarios/email/ana%40test.com")).status).toBe(401);
    const b = await (await login()).json();
    expect((await request("/usuarios/email/ana%40test.com", { headers: bearer(b.token) })).status).toBe(404);
    expect((await request("/usuarios/2", { headers: bearer(b.token) })).status).toBe(404);
    expect((await request("/admin-check", { headers: bearer(b.token) })).status).toBe(403);
  });
  it("cadastro ignora privilegios enviados pelo cliente e nao retorna hash", async () => {
    const r = await request("/usuarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: "Nova Pessoa", usuario: "NOVA", email: "nova@test.com", senha: "Forte@12345678", cpf: "00000000000", nivelacesso: 999, ativo: "N" }) });
    expect(r.status).toBe(201);
    const b = await r.json();
    expect(b).not.toHaveProperty("senha");
    expect(b.perfil.admin).toBe(false);
    expect(b.ativo).toBe("S");
  });
  it("rejeita sessao expirada mesmo com JWT ainda valido", async () => {
    const b = await (await login()).json();
    const p = verify(b.token, auth.jwt.secretToken!) as any;
    state.sessions.get(p.sid).expira_em = new Date(0);
    expect((await request("/usuarios", { headers: bearer(b.token) })).status).toBe(401);
  });
});
