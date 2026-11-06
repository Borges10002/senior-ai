import { Assinatura } from "@modules/assinaturas/infra/typeorm/entities/Assinatura";
import { EventoPagamento } from "@modules/assinaturas/infra/typeorm/entities/EventoPagamento";

interface IAssinaturaRepository {
  findByUsuario(codusuario: number): Promise<Assinatura | null>;
  findByGatewayAssinatura(gateway_assinatura_id: string): Promise<Assinatura | null>;
  create(assinatura: Partial<Assinatura>): Promise<Assinatura>;
  update(id: string, parcial: Partial<Assinatura>): Promise<Assinatura>;
  /** Grava o evento; devolve false se ele já tinha sido recebido. */
  registrarEvento(evento: Partial<EventoPagamento>): Promise<boolean>;
  /** Contagem por status, para o painel do administrador. */
  resumo(): Promise<Record<string, number>>;
  findAll(): Promise<Assinatura[]>;
  /** Eventos de webhook dos tipos pedidos, do mais antigo para o mais novo. */
  eventosPorTipo(tipos: string[]): Promise<EventoPagamento[]>;
}

export default IAssinaturaRepository;
