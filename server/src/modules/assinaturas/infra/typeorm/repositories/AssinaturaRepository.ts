import IAssinaturaRepository from "@modules/assinaturas/domain/repositories/IAssinaturaRepository";
import { TipecDataSource } from "@shared/infra/typeorm";
import { In, Repository } from "typeorm";
import { Assinatura } from "../entities/Assinatura";
import { EventoPagamento } from "../entities/EventoPagamento";

export class AssinaturaRepository implements IAssinaturaRepository {
  private repository: Repository<Assinatura>;
  private eventos: Repository<EventoPagamento>;

  constructor() {
    this.repository = TipecDataSource.getRepository(Assinatura);
    this.eventos = TipecDataSource.getRepository(EventoPagamento);
  }

  async findByUsuario(codusuario: number): Promise<Assinatura | null> {
    return await this.repository.findOne({ where: { codusuario } });
  }

  async findByGatewayAssinatura(gateway_assinatura_id: string): Promise<Assinatura | null> {
    return await this.repository.findOne({ where: { gateway_assinatura_id } });
  }

  async create(assinatura: Partial<Assinatura>): Promise<Assinatura> {
    // ON CONFLICT: duas requisições simultâneas do mesmo usuário não duplicam.
    await this.repository
      .createQueryBuilder()
      .insert()
      .values(assinatura)
      .orIgnore()
      .execute();
    return (await this.findByUsuario(Number(assinatura.codusuario)))!;
  }

  async update(id: string, parcial: Partial<Assinatura>): Promise<Assinatura> {
    await this.repository.update(id, parcial);
    return (await this.repository.findOneByOrFail({ id }));
  }

  async registrarEvento(evento: Partial<EventoPagamento>): Promise<boolean> {
    const r = await this.eventos
      .createQueryBuilder()
      .insert()
      .values(evento)
      .orIgnore()
      .returning(["id"])
      .execute();
    // Com ON CONFLICT DO NOTHING o RETURNING vem vazio quando o evento já existia.
    return Array.isArray(r.raw) && r.raw.length > 0;
  }

  async resumo(): Promise<Record<string, number>> {
    const linhas = await this.repository
      .createQueryBuilder("a")
      .select("a.status", "status")
      .addSelect("COUNT(*)", "total")
      .groupBy("a.status")
      .getRawMany();
    return Object.fromEntries(linhas.map((l) => [l.status, Number(l.total)]));
  }

  async findAll(): Promise<Assinatura[]> {
    return await this.repository.find();
  }

  async eventosPorTipo(tipos: string[]): Promise<EventoPagamento[]> {
    return await this.eventos.find({ where: { evento: In(tipos) }, order: { recebido_em: "ASC" } });
  }
}
