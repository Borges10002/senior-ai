import type { RegistroAuditoria } from "@modules/auditoria/infra/typeorm/entities/RegistroAuditoria";

export default interface IAuditoriaRepository {
  create(registro: RegistroAuditoria): Promise<RegistroAuditoria>;
}
