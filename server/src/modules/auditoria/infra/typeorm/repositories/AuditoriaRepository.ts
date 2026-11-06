import { TipecDataSource } from "@shared/infra/typeorm";
import IAuditoriaRepository from "@modules/auditoria/domain/repositories/IAuditoriaRepository";
import { RegistroAuditoria } from "@modules/auditoria/infra/typeorm/entities/RegistroAuditoria";

class AuditoriaRepository implements IAuditoriaRepository {
  create(registro: RegistroAuditoria): Promise<RegistroAuditoria> {
    return TipecDataSource.getRepository(RegistroAuditoria).save(registro);
  }
}

export { AuditoriaRepository };
