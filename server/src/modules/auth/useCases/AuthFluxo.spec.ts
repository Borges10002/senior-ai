import { RegistrarAuditoriaUseCase } from "@modules/auditoria/useCases/RegistrarAuditoriaUseCase";
import { verificarAccessToken } from "@modules/auth/domain/tokens";
import { CreateUsuarioUseCase } from "@modules/usuarios/useCases/CreateUsuarioUseCase";
import {
  AuditoriaRepositoryEmMemoria,
  SessaoRepositoryEmMemoria,
  UsuarioRepositoryEmMemoria,
} from "@shared/testes/repositoriosEmMemoria";
import { LoginUseCase } from "./LoginUseCase";
import { LogoutUseCase } from "./LogoutUseCase";
import { RefreshTokenUseCase } from "./RefreshTokenUseCase";

const SENHA = "Senha-forte-123";

function montar() {
  const usuarios = new UsuarioRepositoryEmMemoria();
  const sessoes = new SessaoRepositoryEmMemoria();
  const auditoriaRepo = new AuditoriaRepositoryEmMemoria();
  const auditoria = new RegistrarAuditoriaUseCase(auditoriaRepo);
  return {
    usuarios,
    sessoes,
    auditoriaRepo,
    cadastrar: new CreateUsuarioUseCase(usuarios),
    login: new LoginUseCase(usuarios, sessoes, auditoria),
    refresh: new RefreshTokenUseCase(usuarios, sessoes, auditoria),
    logout: new LogoutUseCase(sessoes, auditoria),
  };
}

describe("fluxo de autenticação", () => {
  it("cadastra sem expor o hash e normaliza o e-mail", async () => {
    const { cadastrar, usuarios } = montar();
    const usuario = await cadastrar.execute({ nome: "Ana", email: "  Ana@Exemplo.com ", senha: SENHA });
    expect(usuario).not.toHaveProperty("senha_hash");
    expect(usuario.email).toBe("ana@exemplo.com");
    expect(usuarios.itens[0]!.senha_hash).not.toBe(SENHA);
  });

  it("recusa senha fraca e e-mail repetido", async () => {
    const { cadastrar } = montar();
    await expect(cadastrar.execute({ nome: "Ana", email: "a@x.com", senha: "123" })).rejects.toThrow(/Senha fraca/);
    await cadastrar.execute({ nome: "Ana", email: "a@x.com", senha: SENHA });
    await expect(cadastrar.execute({ nome: "Ana", email: "A@x.com", senha: SENHA })).rejects.toMatchObject({ statusCode: 409 });
  });

  it("faz login e emite access token com a sessão", async () => {
    const { cadastrar, login, auditoriaRepo } = montar();
    const { id } = await cadastrar.execute({ nome: "Ana", email: "a@x.com", senha: SENHA });
    const sessao = await login.execute({ email: "a@x.com", senha: SENHA });
    const claims = verificarAccessToken(sessao.accessToken);
    expect(claims.sub).toBe(id);
    expect(sessao.refreshToken.startsWith(claims.sid + ".")).toBe(true);
    expect(auditoriaRepo.itens.map((a) => a.acao)).toContain("auth.login");
  });

  it("responde igual para e-mail inexistente e senha errada", async () => {
    const { cadastrar, login } = montar();
    await cadastrar.execute({ nome: "Ana", email: "a@x.com", senha: SENHA });
    const erroSenha = await login.execute({ email: "a@x.com", senha: "errada" }).catch((e) => e);
    const erroEmail = await login.execute({ email: "b@x.com", senha: SENHA }).catch((e) => e);
    expect(erroSenha.message).toBe(erroEmail.message);
    expect(erroSenha.statusCode).toBe(401);
  });

  it("rotaciona o refresh token e revoga a sessão se o antigo for reutilizado", async () => {
    const { cadastrar, login, refresh, sessoes } = montar();
    await cadastrar.execute({ nome: "Ana", email: "a@x.com", senha: SENHA });
    const primeira = await login.execute({ email: "a@x.com", senha: SENHA });

    const segunda = await refresh.execute(primeira.refreshToken);
    expect(segunda.refreshToken).not.toBe(primeira.refreshToken);

    await expect(refresh.execute(primeira.refreshToken)).rejects.toMatchObject({ statusCode: 401 });
    expect(sessoes.itens[0]!.revogada_em).toBeInstanceOf(Date);
    // Depois do reuso nem o token novo vale mais.
    await expect(refresh.execute(segunda.refreshToken)).rejects.toMatchObject({ statusCode: 401 });
  });

  it("logout revoga a sessão", async () => {
    const { cadastrar, login, logout, refresh } = montar();
    const { id } = await cadastrar.execute({ nome: "Ana", email: "a@x.com", senha: SENHA });
    const sessao = await login.execute({ email: "a@x.com", senha: SENHA });
    await logout.execute(id, verificarAccessToken(sessao.accessToken).sid);
    await expect(refresh.execute(sessao.refreshToken)).rejects.toMatchObject({ statusCode: 401 });
  });

  it("recusa refresh token malformado", async () => {
    const { refresh } = montar();
    await expect(refresh.execute("qualquer-coisa")).rejects.toMatchObject({ statusCode: 401 });
  });
});
