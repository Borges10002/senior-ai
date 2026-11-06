import IVendaRepository from "@modules/assinaturas/domain/repositories/IVendaRepository";
import { TipecDataSource } from "@shared/infra/typeorm";
import { Repository } from "typeorm";
import { Venda } from "../entities/Venda";

export class VendaRepository implements IVendaRepository {
  private repository: Repository<Venda>;

  constructor() {
    this.repository = TipecDataSource.getRepository(Venda);
  }

  async findById(id: string): Promise<Venda | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findAll(): Promise<Venda[]> {
    return await this.repository.find({ order: { pago_em: "DESC" } });
  }

  async salvar(venda: Partial<Venda> & { id: string }): Promise<Venda> {
    // Sem upsert: o Postgres confere NOT NULL antes do ON CONFLICT, e as
    // atualizações parciais (só o status) seriam recusadas.
    const { id, ...campos } = venda;
    if (await this.repository.exists({ where: { id } })) {
      if (Object.keys(campos).length) await this.repository.update(id, campos);
    } else {
      // Avisos simultâneos do mesmo pagamento: o segundo insert é ignorado.
      await this.repository.createQueryBuilder().insert().values(venda).orIgnore().execute();
    }
    return await this.repository.findOneByOrFail({ id });
  }
}
