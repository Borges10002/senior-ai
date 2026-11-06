import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { DataSource } from "typeorm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ source: null as any }));
vi.mock("@shared/infra/typeorm", () => ({ get TipecDataSource() { return db.source; } }));
import { Usuario } from "@modules/usuario/infra/typeorm/entities/Usuario";
import { Sessao } from "./infra/typeorm/entities/Sessao";
import { RecuperacaoSenha } from "./infra/typeorm/entities/RecuperacaoSenha";
import { SessionStore } from "./infra/typeorm/repositories/SessionStore";
import { RecuperacaoSenhaRepository } from "./infra/typeorm/repositories/RecuperacaoSenhaRepository";
import { UsuarioRepository } from "@modules/usuario/infra/typeorm/repositories/UsuarioRepository";
import { RecuperarSenhaUseCase } from "./useCases/RecuperarSenhaUseCase";
import { ChangePasswordUseCase } from "@modules/usuario/useCases/ChangePasswordUseCase";
import { hashToken } from "./useCases/RecuperarSenhaUseCase";
import { Inicial1793900000000 } from "@shared/infra/typeorm/migrations/1793900000000-Inicial";

describe.skipIf(!process.env.SECURITY_TEST_DATABASE_URL)("Seguranca com PostgreSQL real isolado", () => {
  beforeAll(async () => {
    const url = new URL(process.env.SECURITY_TEST_DATABASE_URL!);
    if (url.hostname !== "127.0.0.1" || url.pathname !== "/seniorai_security") throw new Error("Somente o banco local descartavel de testes e permitido");
    db.source = new DataSource({ type: "postgres", url: url.toString(), entities: [Usuario, Sessao, RecuperacaoSenha],
      migrations: [Inicial1793900000000],
      synchronize: false, logging: false,
    });
    await db.source.initialize();
    const migrations = await db.source.runMigrations();
    expect(migrations).toHaveLength(1);
  }, 30000);
  afterAll(async () => { if (db.source?.isInitialized) await db.source.destroy(); });
  beforeEach(async () => {
    await db.source.query('TRUNCATE "DIMISESSAO", "DIMIRECUPERACAOSENHA", "DIMIUSUARIO" CASCADE');
    await db.source.getRepository(Usuario).save({ codigo: 1, nome: "Teste Local", usuario: "TESTE", email: "local@test.com", ativo: "S", nivelacesso: 1, cpf: "00000000000", senha: await bcrypt.hash("Inicial@123456", 4) });
  });
  it("migration cria sessoes persistentes e apenas uma renovacao concorrente vence", async () => {
    const store = new SessionStore(), id = randomUUID();
    await store.create({ id, codusuario: 1, refresh_hash: hashToken("old"), expira_em: new Date(Date.now() + 60000) });
    expect(await new SessionStore().active(id, 1)).toBe(true);
    expect(await store.active(id, 2)).toBe(false);
    const results = await Promise.all([store.rotate(id, hashToken("old"), hashToken("next-a")), store.rotate(id, hashToken("old"), hashToken("next-b"))]);
    expect(results.sort()).toEqual([false, true]);
    expect(await store.rotate(id, hashToken("old"), hashToken("replay"))).toBe(false);
    expect((await db.source.getRepository(Sessao).findOneBy({ id })).refresh_hash).toMatch(/^[a-f0-9]{64}$/);
    await store.revoke(id);
    expect(await store.active(id, 1)).toBe(false);
  });
  it("sessoes vencidas nao renovam e revogacao por usuario nao atinge outro usuario", async () => {
    const store = new SessionStore(), a = randomUUID(), b = randomUUID();
    await store.create({ id: a, codusuario: 1, refresh_hash: hashToken("a"), expira_em: new Date(0) });
    await store.create({ id: b, codusuario: 2, refresh_hash: hashToken("b"), expira_em: new Date(Date.now() + 60000) });
    expect(await store.active(a, 1)).toBe(false);
    expect(await store.rotate(a, hashToken("a"), hashToken("x"))).toBe(false);
    await store.revokeUser(1);
    expect(await store.active(b, 2)).toBe(true);
  });
  async function recovery() {
    const emails: any[] = [];
    const repos = new RecuperacaoSenhaRepository();
    const uc = new RecuperarSenhaUseCase(new UsuarioRepository(), repos, { enviar: async m => { emails.push(m); return true; } });
    await uc.solicitar("local@test.com");
    return { uc, repos, token: /token=([a-f0-9]{64})/.exec(emails[0].texto)![1] };
  }
  it("somente uma troca de senha concorrente pode consumir o mesmo link", async () => {
    const { uc, repos, token } = await recovery();
    expect((await repos.buscarPorHash(hashToken(token)))!.token_hash).not.toBe(token);
    const results = await Promise.allSettled([uc.redefinir(token, "Primeira@123456"), uc.redefinir(token, "Segunda@123456")]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(r => r.status === "rejected")).toHaveLength(1);
    const user = await new UsuarioRepository().findById(1);
    const winner = results[0].status === "fulfilled" ? "Primeira@123456" : "Segunda@123456";
    expect(await bcrypt.compare(winner, user!.senha)).toBe(true);
    expect(await repos.buscarPorHash(hashToken(token))).toBeNull();
  });
  it("rejeita link vencido ou de conta desativada sem alterar a senha", async () => {
    const { uc, token } = await recovery();
    const repo = new UsuarioRepository(), before = (await repo.findById(1))!.senha;
    await db.source.getRepository(RecuperacaoSenha).update({ token_hash: hashToken(token) }, { expira_em: new Date(0) });
    await expect(uc.redefinir(token, "Nova@12345678")).rejects.toThrow();
    const next = await recovery();
    await repo.update(1, { ativo: "N" });
    await expect(next.uc.redefinir(next.token, "Nova@12345678")).rejects.toThrow();
    expect((await repo.findById(1))!.senha).toBe(before);
  });
  it("emissao concorrente mantem somente o ultimo pedido ativo", async () => {
    const repo = new RecuperacaoSenhaRepository();
    await Promise.all(["first", "second"].map(token => repo.criar({ codusuario: 1, token_hash: hashToken(token), expira_em: new Date(Date.now() + 60000) })));
    const active = (await db.source.getRepository(RecuperacaoSenha).find()).filter((p: any) => !p.usado_em);
    expect(active).toHaveLength(1);
  });
  it("troca autenticada invalida links de recuperacao ainda nao usados", async () => {
    const { uc, token } = await recovery();
    const userRepo = new UsuarioRepository();
    await new ChangePasswordUseCase(userRepo).execute({ codigo: 1, senhaAtual: "Inicial@123456", novaSenha: "Alterada@123456" });
    await expect(uc.redefinir(token, "Tentativa@123456")).rejects.toThrow();
    expect(await bcrypt.compare("Alterada@123456", (await userRepo.findById(1))!.senha)).toBe(true);
  });
});
