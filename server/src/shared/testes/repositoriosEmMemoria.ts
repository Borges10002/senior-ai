import type IAuditoriaRepository from "@modules/auditoria/domain/repositories/IAuditoriaRepository";
import type { RegistroAuditoria } from "@modules/auditoria/infra/typeorm/entities/RegistroAuditoria";
import type ISessaoRepository from "@modules/auth/domain/repositories/ISessaoRepository";
import type { Sessao } from "@modules/auth/infra/typeorm/entities/Sessao";
import type IReuniaoRepository from "@modules/reunioes/domain/repositories/IReuniaoRepository";
import type { FiltroReunioes } from "@modules/reunioes/domain/repositories/IReuniaoRepository";
import type { Reuniao } from "@modules/reunioes/infra/typeorm/entities/Reuniao";
import type IUsuarioRepository from "@modules/usuarios/domain/repositories/IUsuarioRepository";
import type { Usuario } from "@modules/usuarios/infra/typeorm/entities/Usuario";

const carimbar = <T extends { created_at?: Date; updated_at?: Date }>(item: T): T => {
  item.created_at ??= new Date();
  item.updated_at = new Date();
  return item;
};

export class UsuarioRepositoryEmMemoria implements IUsuarioRepository {
  itens: Usuario[] = [];
  async findById(id: string) {
    return this.itens.find((u) => u.id === id) ?? null;
  }
  async findByEmail(email: string) {
    return this.itens.find((u) => u.email === email.trim().toLowerCase()) ?? null;
  }
  async create(usuario: Usuario) {
    this.itens.push(carimbar(usuario));
    return usuario;
  }
  async save(usuario: Usuario) {
    return carimbar(usuario);
  }
}

export class SessaoRepositoryEmMemoria implements ISessaoRepository {
  itens: Sessao[] = [];
  async create(sessao: Sessao) {
    this.itens.push(carimbar(sessao));
    return sessao;
  }
  async findById(id: string) {
    return this.itens.find((s) => s.id === id) ?? null;
  }
  async save(sessao: Sessao) {
    return carimbar(sessao);
  }
  async revogarTodasDoUsuario(usuarioId: string) {
    this.itens.filter((s) => s.usuario_id === usuarioId && !s.revogada_em).forEach((s) => (s.revogada_em = new Date()));
  }
}

export class ReuniaoRepositoryEmMemoria implements IReuniaoRepository {
  itens: Reuniao[] = [];
  async create(reuniao: Reuniao) {
    this.itens.push(carimbar(reuniao));
    return reuniao;
  }
  async findByIdDoProprietario(id: string, proprietarioId: string) {
    return this.itens.find((r) => r.id === id && r.proprietario_id === proprietarioId) ?? null;
  }
  async listByProprietario(proprietarioId: string, { status }: FiltroReunioes) {
    return this.itens.filter((r) => r.proprietario_id === proprietarioId && (!status || r.status === status));
  }
  async save(reuniao: Reuniao) {
    return carimbar(reuniao);
  }
  async delete(id: string) {
    this.itens = this.itens.filter((r) => r.id !== id);
  }
}

export class AuditoriaRepositoryEmMemoria implements IAuditoriaRepository {
  itens: RegistroAuditoria[] = [];
  async create(registro: RegistroAuditoria) {
    this.itens.push(registro);
    return registro;
  }
}
