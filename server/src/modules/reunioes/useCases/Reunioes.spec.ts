import { describe, expect, it } from "vitest";
import { RegistrarAuditoriaUseCase } from "@modules/auditoria/useCases/RegistrarAuditoriaUseCase";
import { auditoriaEmMemoria, reunioesEmMemoria } from "@shared/testes/repositoriosEmMemoria";
import { CreateReuniaoUseCase } from "./CreateReuniaoUseCase";
import { DeleteReuniaoUseCase } from "./DeleteReuniaoUseCase";
import { GetReuniaoUseCase } from "./GetReuniaoUseCase";
import { MudarStatusReuniaoUseCase } from "./MudarStatusReuniaoUseCase";
import { UpdateReuniaoUseCase } from "./UpdateReuniaoUseCase";

const DONO = 1;
const OUTRO = 2;

function montar() {
  const repo = reunioesEmMemoria();
  const auditoriaRepo = auditoriaEmMemoria();
  const get = new GetReuniaoUseCase(repo as any);
  return {
    repo,
    auditoriaRepo,
    criar: new CreateReuniaoUseCase(repo as any),
    get,
    atualizar: new UpdateReuniaoUseCase(repo as any, get),
    status: new MudarStatusReuniaoUseCase(repo as any, get),
    excluir: new DeleteReuniaoUseCase(repo as any, get, new RegistrarAuditoriaUseCase(auditoriaRepo as any)),
  };
}

describe("reuniões", () => {
  it("cria como AGENDADA vinculada ao proprietário", async () => {
    const { criar } = montar();
    const r = await criar.execute(DONO, { titulo: "  Integração ERP " });
    expect(r).toMatchObject({ titulo: "Integração ERP", status: "AGENDADA", codusuario: DONO });
  });

  it("recusa término antes do início", async () => {
    const { criar } = montar();
    await expect(
      criar.execute(DONO, {
        titulo: "X",
        inicio_previsto: new Date("2026-11-04T10:00:00Z"),
        fim_previsto: new Date("2026-11-04T09:00:00Z"),
      }),
    ).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining("término") });
  });

  it("não deixa outro usuário ver, alterar ou excluir (RN014)", async () => {
    const { criar, get, atualizar, excluir } = montar();
    const r = await criar.execute(DONO, { titulo: "Privada" });
    await expect(get.execute(r.id, OUTRO)).rejects.toMatchObject({ statusCode: 404 });
    await expect(atualizar.execute(r.id, OUTRO, { titulo: "x" })).rejects.toMatchObject({ statusCode: 404 });
    await expect(excluir.execute(r.id, OUTRO)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("inicia e finaliza registrando os horários", async () => {
    const { criar, status } = montar();
    const r = await criar.execute(DONO, { titulo: "Diretoria" });
    const inicio = new Date("2026-11-04T13:00:00Z");
    const fim = new Date("2026-11-04T14:00:00Z");
    await status.execute(r.id, DONO, "iniciar", inicio);
    const finalizada = await status.execute(r.id, DONO, "finalizar", fim);
    expect(finalizada).toMatchObject({ status: "FINALIZADA", iniciada_em: inicio, finalizada_em: fim });
  });

  it("não exclui reunião iniciada e audita a exclusão permitida", async () => {
    const { criar, status, excluir, repo, auditoriaRepo } = montar();
    const iniciada = await criar.execute(DONO, { titulo: "A" });
    await status.execute(iniciada.id, DONO, "iniciar");
    await expect(excluir.execute(iniciada.id, DONO)).rejects.toMatchObject({ statusCode: 409 });

    const agendada = await criar.execute(DONO, { titulo: "B" });
    await excluir.execute(agendada.id, DONO);
    expect(repo.dados.map((r) => r.id)).toEqual([iniciada.id]);
    expect(auditoriaRepo.dados[0]).toMatchObject({ acao: "reuniao.excluida", entidade_id: agendada.id });
  });

  it("não altera reunião finalizada", async () => {
    const { criar, status, atualizar } = montar();
    const r = await criar.execute(DONO, { titulo: "A" });
    await status.execute(r.id, DONO, "iniciar");
    await status.execute(r.id, DONO, "finalizar");
    await expect(atualizar.execute(r.id, DONO, { titulo: "B" })).rejects.toMatchObject({ statusCode: 409 });
  });
});
