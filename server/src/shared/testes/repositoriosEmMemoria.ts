import { randomUUID } from "crypto";
import { periodosDasReunioes } from "@modules/reunioes/domain/reuniao";

/**
 * Repositórios em memória para testes de casos de uso, sem banco.
 * Implementam só os métodos que os testes usam.
 */

export function assinaturasEmMemoria(iniciais: any[] = []) {
  const dados: any[] = iniciais.map((a) => ({ id: randomUUID(), ...a }));
  const eventos = new Set<string>();
  return {
    dados,
    async findByUsuario(codusuario: number) {
      return dados.find((a) => Number(a.codusuario) === codusuario) ?? null;
    },
    async findByGatewayAssinatura(id: string) {
      return dados.find((a) => a.gateway_assinatura_id === id) ?? null;
    },
    async create(a: any) {
      const existente = dados.find((d) => Number(d.codusuario) === Number(a.codusuario));
      if (existente) return existente;
      const nova = { ...a, id: randomUUID() };
      dados.push(nova);
      return nova;
    },
    async update(id: string, parcial: any) {
      const alvo = dados.find((a) => a.id === id);
      Object.assign(alvo, parcial);
      return alvo;
    },
    async registrarEvento(evento: any) {
      if (eventos.has(evento.id)) return false;
      eventos.add(evento.id);
      return true;
    },
    async resumo() {
      return {};
    },
    async findAll() {
      return dados;
    },
    async eventosPorTipo() {
      return [];
    },
  };
}

export function vendasEmMemoria(iniciais: any[] = []) {
  const dados: any[] = [...iniciais];
  return {
    dados,
    async findById(id: string) {
      return dados.find((v) => v.id === id) ?? null;
    },
    async findAll() {
      return [...dados].sort((a, b) => new Date(b.pago_em).getTime() - new Date(a.pago_em).getTime());
    },
    async salvar(venda: any) {
      const existente = dados.find((v) => v.id === venda.id);
      if (existente) return Object.assign(existente, venda);
      const nova = { status: "paga", ...venda };
      dados.push(nova);
      return nova;
    },
  };
}

export function reunioesEmMemoria() {
  const dados: any[] = [];
  return {
    dados,
    async create(r: any) {
      dados.push(r);
      return r;
    },
    async findByIdDoProprietario(id: string, codusuario: number) {
      return dados.find((r) => r.id === id && r.codusuario === codusuario) ?? null;
    },
    async listByProprietario(codusuario: number, { status }: { status?: string }) {
      return dados.filter((r) => r.codusuario === codusuario && (!status || r.status === status));
    },
    async save(r: any) {
      return r;
    },
    async delete(id: string) {
      dados.splice(dados.findIndex((r) => r.id === id), 1);
    },
    async countAll() {
      return dados.length;
    },
    async periodosOcupados(codusuario: number, apos: Date) {
      return periodosDasReunioes(
        dados.filter((r) => r.codusuario === codusuario && ["AGENDADA", "EM_ANDAMENTO"].includes(r.status)),
        apos,
      );
    },
  };
}

export function auditoriaEmMemoria() {
  const dados: any[] = [];
  return {
    dados,
    async create(registro: any) {
      dados.push(registro);
      return registro;
    },
  };
}
