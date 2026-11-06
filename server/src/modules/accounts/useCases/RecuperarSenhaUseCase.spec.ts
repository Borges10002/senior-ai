import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { hashToken, RecuperarSenhaUseCase } from "./RecuperarSenhaUseCase";

function cenario() {
  const usuarios = [{ codigo: 7, nome: "Ana Souza", email: "ana@teste.com", ativo: "S", senha: "x" }];
  const pedidos: any[] = [];
  const emails: any[] = [];
  const repoUsuarios = {
    findByEmail: async (email: string) => usuarios.find((u) => u.email === email) ?? null,
    update: async (codigo: number, dados: any) => Object.assign(usuarios.find((u) => u.codigo === codigo)!, dados),
  };
  const repoPedidos = {
    criar: async (d: any) => (pedidos.push({ ...d, id: String(pedidos.length), usado_em: null }), d),
    buscarPorHash: async (h: string) => pedidos.find((p) => p.token_hash === h && !p.usado_em) ?? null,
    redefinirSenha: async (h: string, senha: string) => {
      const p = pedidos.find(p => p.token_hash === h && !p.usado_em && new Date(p.expira_em).getTime() > Date.now());
      if (!p) return false;
      usuarios.find(u => u.codigo === p.codusuario)!.senha = senha;
      pedidos.filter(p => p.codusuario === 7).forEach(p => p.usado_em = new Date());
      return true;
    },
    encerrarDoUsuario: async (c: number) => pedidos.filter((p) => p.codusuario === c).forEach((p) => (p.usado_em ??= new Date())),
  };
  const email = { enviar: async (m: any) => (emails.push(m), true) };
  const uc = new RecuperarSenhaUseCase(repoUsuarios as any, repoPedidos as any, email as any);
  const tokenDoEmail = () => /token=([a-f0-9]{64})/.exec(emails.at(-1).texto)![1]!;
  return { uc, usuarios, pedidos, emails, tokenDoEmail };
}

describe("RecuperarSenhaUseCase", () => {
  it("só envia o link para e-mail cadastrado, sem revelar quando não existe", async () => {
    const { uc, emails } = cenario();
    await expect(uc.solicitar("ninguem@teste.com")).resolves.toBeUndefined();
    expect(emails).toHaveLength(0);
    await uc.solicitar("  ANA@teste.com ".toLowerCase());
    expect(emails[0]).toMatchObject({ para: "ana@teste.com", assunto: expect.stringMatching(/senha/i) });
  });

  it("guarda só o hash do token e troca a senha uma vez", async () => {
    const { uc, usuarios, pedidos, tokenDoEmail } = cenario();
    await uc.solicitar("ana@teste.com");
    const token = tokenDoEmail();
    expect(pedidos[0].token_hash).toBe(hashToken(token));
    expect(pedidos[0].token_hash).not.toBe(token);

    await expect(uc.redefinir(token, "fraca")).rejects.toThrow(/Senha fraca/);
    await uc.redefinir(token, "Nova@12345678");
    expect(await bcrypt.compare("Nova@12345678", usuarios[0]!.senha)).toBe(true);
    await expect(uc.redefinir(token, "Outra@12345678")).rejects.toThrow(/inválido ou vencido/);
  });

  it("link vencido não troca a senha; pedir de novo invalida o anterior", async () => {
    const { uc, pedidos, tokenDoEmail } = cenario();
    await uc.solicitar("ana@teste.com");
    const primeiro = tokenDoEmail();
    await uc.solicitar("ana@teste.com");
    await expect(uc.redefinir(primeiro, "Nova@12345678")).rejects.toThrow(/inválido/);

    pedidos.at(-1).expira_em = new Date(Date.now() - 1000);
    await expect(uc.redefinir(tokenDoEmail(), "Nova@12345678")).rejects.toThrow(/vencido/);
  });
});
