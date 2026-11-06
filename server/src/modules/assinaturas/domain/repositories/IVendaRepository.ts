import { Venda } from "@modules/assinaturas/infra/typeorm/entities/Venda";

interface IVendaRepository {
  findById(id: string): Promise<Venda | null>;
  /** Da mais recente para a mais antiga. */
  findAll(): Promise<Venda[]>;
  /** Cria ou atualiza pela chave (id da cobrança no gateway). */
  salvar(venda: Partial<Venda> & { id: string }): Promise<Venda>;
}

export default IVendaRepository;
