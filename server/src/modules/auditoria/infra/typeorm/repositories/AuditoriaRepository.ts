import { AppDataSource } from "@shared/infra/typeorm";
import type IAuditoriaRepository from "@modules/auditoria/domain/repositories/IAuditoriaRepository";
import { RegistroAuditoria } from "@modules/auditoria/infra/typeorm/entities/RegistroAuditoria";

class AuditoriaRepository implements IAuditoriaRepository {
  create(registro: RegistroAuditoria): Promise<RegistroAuditoria> {
    return AppDataSource.getRepository(RegistroAuditoria).save(registro);
  }
}

export { AuditoriaRepository };
