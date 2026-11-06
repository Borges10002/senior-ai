import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgendarAutomaticamenteUseCase } from "@modules/agenda/useCases/AgendarAutomaticamenteUseCase";
import type { AnaliseReuniao } from "@modules/anotacoes/domain/analise";
import { AnalisarGravacaoUseCase } from "@modules/anotacoes/useCases/AnalisarGravacaoUseCase";
import { RegistrarAuditoriaUseCase } from "@modules/auditoria/useCases/RegistrarAuditoriaUseCase";
import { CreateReuniaoUseCase } from "@modules/reunioes/useCases/CreateReuniaoUseCase";
import { GetReuniaoUseCase } from "@modules/reunioes/useCases/GetReuniaoUseCase";
import { MudarStatusReuniaoUseCase } from "@modules/reunioes/useCases/MudarStatusReuniaoUseCase";
import { TranscreverGravacaoUseCase } from "@modules/transcricoes/useCases/TranscreverGravacaoUseCase";
import { auditoriaEmMemoria, reunioesEmMemoria } from "@shared/testes/repositoriosEmMemoria";
import { EnviarGravacaoUseCase } from "./EnviarGravacaoUseCase";
import { ObterResultadoReuniaoUseCase } from "./ObterResultadoReuniaoUseCase";
import { ReprocessarGravacaoUseCase } from "./ReprocessarGravacaoUseCase";

const DONO = 1;
const OUTRO = 2;
const AGORA = Date.now();
const emDias = (d: number) => new Date(AGORA + d * 86_400_000).toISOString();

const ANALISE: AnaliseReuniao = {
  resumo: "Alinhamento da integração ERP.",
  assuntos: ["API"],
  decisoes: [{ descricao: "João entrega a API", horario: "00:00:10" }],
  tarefas: [{ titulo: "Finalizar API", responsavel: "João", prazo: "2026-11-12", horario: "00:00:10" }],
  pendencias: [],
  agendamentos: [
    { titulo: "Validação", inicio: emDias(5), duracao_minutos: 30, participantes: ["João"], confirmado: true, horario: "00:00:20" },
    { titulo: "Quem sabe um café", inicio: emDias(6), duracao_minutos: null, participantes: [], confirmado: false, horario: "00:00:30" },
    { titulo: "Retorno com o cliente", inicio: null, duracao_minutos: null, participantes: [], confirmado: true, horario: "00:00:40" },
  ],
};

function montar(analise: AnaliseReuniao = ANALISE) {
  const reunioes = reunioesEmMemoria();
  const auditoriaRepo = auditoriaEmMemoria();
  const auditoria = new RegistrarAuditoriaUseCase(auditoriaRepo as any);
  const gravacoes: any[] = [];
  const gravacaoRepo = {
    create: async (g: any) => (gravacoes.push({ ...g, created_at: new Date() }), gravacoes.at(-1)),
    findById: async (id: string) => gravacoes.find((g) => g.id === id) ?? null,
    findByIdDoUsuario: async (id: string, c: number) => gravacoes.find((g) => g.id === id && g.codusuario === c) ?? null,
    listByReuniao: async (r: string, c: number) => gravacoes.filter((g) => g.reuniao_id === r && g.codusuario === c),
    atualizar: async (id: string, dados: any) => void Object.assign(gravacoes.find((g) => g.id === id), dados),
  };
  const segmentos = new Map<string, any[]>();
  const segmentoRepo = {
    substituir: async (id: string, lista: any[]) => void segmentos.set(id, lista),
    listByGravacao: async (id: string) => segmentos.get(id) ?? [],
  };
  const anotacoes: any[] = [];
  const anotacaoRepo = {
    salvar: async (a: any) => {
      const i = anotacoes.findIndex((x) => x.gravacao_id === a.gravacao_id);
      if (i >= 0) anotacoes[i] = a;
      else anotacoes.push(a);
      return a;
    },
    listByReuniao: async (r: string, c: number) => anotacoes.filter((a) => a.reuniao_id === r && a.codusuario === c),
  };
  const agendamentos: any[] = [];
  const agendamentoRepo = {
    create: async (a: any) => (agendamentos.push(a), a),
    existeParaGravacao: async (id: string) => agendamentos.some((a) => a.gravacao_id === id),
    listByReuniaoOrigem: async (r: string, c: number) => agendamentos.filter((a) => a.reuniao_origem_id === r && a.codusuario === c),
  };
  const storage = {
    salvar: vi.fn(async () => undefined),
    baixarPara: vi.fn(async () => undefined),
    abrirLeitura: vi.fn(),
    remover: vi.fn(),
  };
  const fila = { enfileirarTranscricao: vi.fn(async () => undefined), enfileirarAnalise: vi.fn(async () => undefined) };
  const extrator = {
    extrair: vi.fn(async () => [
      { caminho: "a.mp3", inicio: 0 },
      { caminho: "b.mp3", inicio: 1200 },
    ]),
  };
  const whisper = {
    transcrever: vi.fn(async (c: string) => [{ inicio: 1, fim: 2, texto: c === "a.mp3" ? "Primeira fala" : "Segunda fala" }]),
  };
  const analista = { analisar: vi.fn(async () => analise) };

  const get = new GetReuniaoUseCase(reunioes as any);
  const criar = new CreateReuniaoUseCase(reunioes as any);
  const status = new MudarStatusReuniaoUseCase(reunioes as any, get);
  const agendar = new AgendarAutomaticamenteUseCase(agendamentoRepo as any, reunioes as any, criar, auditoria);

  return {
    reunioes, gravacoes, anotacoes, agendamentos, segmentos, storage, fila, extrator, whisper, analista, auditoriaRepo, criar, status, agendar,
    enviar: new EnviarGravacaoUseCase(gravacaoRepo as any, storage as any, fila as any, get, auditoria),
    transcrever: new TranscreverGravacaoUseCase(gravacaoRepo as any, segmentoRepo as any, storage as any, extrator as any, whisper as any, fila as any),
    analisar: new AnalisarGravacaoUseCase(gravacaoRepo as any, segmentoRepo as any, reunioes as any, anotacaoRepo as any, analista as any, agendar, auditoria),
    reprocessar: new ReprocessarGravacaoUseCase(gravacaoRepo as any, fila as any),
    resultado: new ObterResultadoReuniaoUseCase(gravacaoRepo as any, segmentoRepo as any, anotacaoRepo as any, agendamentoRepo as any, get),
  };
}

async function reuniaoIniciada(c: ReturnType<typeof montar>) {
  const r = await c.criar.execute(DONO, { titulo: "Integração ERP" });
  await c.status.execute(r.id, DONO, "iniciar");
  return r;
}

const envio = (reuniaoId: string, extra = {}) => ({
  reuniaoId, codusuario: DONO, caminhoLocal: "tmp/x", mime: "video/mp4", tamanho: 1000, consentimento: true, ...extra,
});

describe("pipeline da reunião", () => {
  let c: ReturnType<typeof montar>;
  beforeEach(() => {
    c = montar();
  });

  it("do vídeo às anotações e à agenda, sem nenhuma intervenção", async () => {
    const r = await reuniaoIniciada(c);
    const g = await c.enviar.execute(envio(r.id));
    expect(c.fila.enfileirarTranscricao).toHaveBeenCalledWith(g.id);

    await c.transcrever.execute(g.id);
    expect(c.segmentos.get(g.id)!.map((s) => s.inicio_seg)).toEqual([1, 1201]);
    expect(c.gravacoes[0].status).toBe("ANALISANDO");
    expect(c.fila.enfileirarAnalise).toHaveBeenCalledWith(g.id);

    await c.analisar.execute(g.id);
    expect(c.gravacoes[0].status).toBe("CONCLUIDA");
    expect(c.anotacoes[0]).toMatchObject({ resumo: ANALISE.resumo, reuniao_id: r.id });

    const texto = (c.analista.analisar.mock.calls as any[][])[0]![0].transcricao;
    expect(texto).toContain("[00:00:01] Primeira fala");
    expect(texto).toContain("[00:20:01] Segunda fala");

    const criada = c.reunioes.dados.find((x) => x.titulo === "Validação");
    expect(criada).toMatchObject({ status: "AGENDADA", codusuario: DONO });
  });

  it("sugestão não vira agenda e combinado sem hora fica registrado", async () => {
    const r = await reuniaoIniciada(c);
    const g = await c.enviar.execute(envio(r.id));
    await c.transcrever.execute(g.id);
    await c.analisar.execute(g.id);

    expect(c.reunioes.dados.some((x) => x.titulo === "Quem sabe um café")).toBe(false);
    expect(c.agendamentos.map((a) => [a.titulo, a.status])).toEqual([
      ["Validação", "CRIADO"],
      ["Retorno com o cliente", "SEM_HORARIO"],
    ]);
    expect(c.auditoriaRepo.dados.map((a) => a.acao)).toContain("agenda.automatico.criado");
  });

  it("não sobrepõe compromisso existente e sugere outro horário", async () => {
    const inicio = new Date(ANALISE.agendamentos[0]!.inicio!);
    await c.criar.execute(DONO, {
      titulo: "Já marcada",
      inicio_previsto: inicio,
      fim_previsto: new Date(inicio.getTime() + 3_600_000),
    });
    const r = await reuniaoIniciada(c);
    const g = await c.enviar.execute(envio(r.id));
    await c.transcrever.execute(g.id);
    await c.analisar.execute(g.id);

    expect(c.reunioes.dados.some((x) => x.titulo === "Validação")).toBe(false);
    expect(c.agendamentos[0]).toMatchObject({
      status: "CONFLITO",
      reuniao_criada_id: null,
      sugestao_inicio: new Date(inicio.getTime() + 3_600_000),
    });
  });

  it("reprocessar não cria a reunião de novo", async () => {
    const r = await reuniaoIniciada(c);
    const g = await c.enviar.execute(envio(r.id));
    await c.transcrever.execute(g.id);
    await c.analisar.execute(g.id);
    await c.analisar.execute(g.id);

    expect(c.reunioes.dados.filter((x) => x.titulo === "Validação")).toHaveLength(1);
    expect(c.anotacoes).toHaveLength(1);
  });

  it("exige confirmação de aviso aos participantes", async () => {
    const r = await reuniaoIniciada(c);
    await expect(c.enviar.execute(envio(r.id, { consentimento: false }))).rejects.toMatchObject({ statusCode: 400 });
    expect(c.storage.salvar).not.toHaveBeenCalled();
  });

  it("recusa formato inesperado e reunião de outro usuário", async () => {
    const r = await reuniaoIniciada(c);
    await expect(c.enviar.execute(envio(r.id, { mime: "text/html" }))).rejects.toMatchObject({ statusCode: 415 });
    await expect(c.enviar.execute(envio(r.id, { codusuario: OUTRO }))).rejects.toMatchObject({ statusCode: 404 });
  });

  it("não aceita gravação em reunião não iniciada", async () => {
    const r = await c.criar.execute(DONO, { titulo: "Depois" });
    await expect(c.enviar.execute(envio(r.id))).rejects.toMatchObject({ statusCode: 409 });
  });

  it("gravação sem fala termina com aviso e sem chamar a IA", async () => {
    c.whisper.transcrever.mockResolvedValue([]);
    const r = await reuniaoIniciada(c);
    const g = await c.enviar.execute(envio(r.id));
    await c.transcrever.execute(g.id);
    await c.analisar.execute(g.id);

    expect(c.analista.analisar).not.toHaveBeenCalled();
    expect(c.gravacoes[0]).toMatchObject({ status: "FALHOU", erro: expect.stringContaining("Nenhuma fala") });
  });

  it("falha da IA preserva o vídeo e permite reprocessar (RN013)", async () => {
    c.analista.analisar.mockRejectedValueOnce(new Error("indisponível"));
    const r = await reuniaoIniciada(c);
    const g = await c.enviar.execute(envio(r.id));
    await c.transcrever.execute(g.id);
    await expect(c.analisar.execute(g.id)).rejects.toThrow("indisponível");

    expect(c.storage.remover).not.toHaveBeenCalled();
    c.gravacoes[0].status = "FALHOU";
    await c.reprocessar.execute(g.id, DONO);
    expect(c.gravacoes[0].status).toBe("ENVIADA");
    expect(c.fila.enfileirarTranscricao).toHaveBeenCalledTimes(2);
  });

  it("outro usuário não vê o resultado nem reprocessa", async () => {
    const r = await reuniaoIniciada(c);
    const g = await c.enviar.execute(envio(r.id));
    await expect(c.resultado.execute(r.id, OUTRO)).rejects.toMatchObject({ statusCode: 404 });
    await expect(c.reprocessar.execute(g.id, OUTRO)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("o resultado não expõe a chave do arquivo", async () => {
    const r = await reuniaoIniciada(c);
    await c.enviar.execute(envio(r.id));
    const resultado = await c.resultado.execute(r.id, DONO);
    expect(resultado.gravacoes[0]).not.toHaveProperty("chave");
  });
});
