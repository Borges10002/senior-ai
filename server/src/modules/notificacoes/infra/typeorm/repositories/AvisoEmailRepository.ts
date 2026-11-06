import IAvisoEmailRepository from "@modules/notificacoes/domain/repositories/IAvisoEmailRepository";
import { TipecDataSource } from "@shared/infra/typeorm";
import { Repository } from "typeorm";
import { AvisoEmail } from "../entities/AvisoEmail";

export class AvisoEmailRepository implements IAvisoEmailRepository {
  private repository: Repository<AvisoEmail>;

  constructor() {
    this.repository = TipecDataSource.getRepository(AvisoEmail);
  }

  async registrar(codusuario: number, tipo: string, dia: string): Promise<boolean> {
    // O índice único (usuário, tipo, dia) garante um envio só, mesmo com várias instâncias.
    const resultado = await this.repository
      .createQueryBuilder()
      .insert()
      .values({ codusuario, tipo, dia })
      .orIgnore()
      .execute();
    return (resultado.identifiers?.filter(Boolean).length ?? 0) > 0;
  }

  async desfazer(codusuario: number, tipo: string, dia: string): Promise<void> {
    await this.repository.delete({ codusuario, tipo, dia });
  }
}
