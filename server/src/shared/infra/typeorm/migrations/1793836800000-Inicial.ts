import type { MigrationInterface, QueryRunner } from "typeorm";

/** Fase 1: usuários, sessões, reuniões e auditoria. */
export class Inicial1793836800000 implements MigrationInterface {
  name = "Inicial1793836800000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "usuarios" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "nome" varchar(120) NOT NULL,
        "email" varchar(180) NOT NULL,
        "senha_hash" varchar(100) NOT NULL,
        "perfil" varchar(20) NOT NULL DEFAULT 'proprietario'
          CHECK ("perfil" IN ('proprietario', 'administrador', 'participante', 'convidado')),
        "ativo" boolean NOT NULL DEFAULT true,
        "versao_credencial" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_usuarios_email" UNIQUE ("email")
      )`);

    await queryRunner.query(`
      CREATE TABLE "sessoes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "usuario_id" uuid NOT NULL REFERENCES "usuarios"("id") ON DELETE CASCADE,
        "refresh_hash" char(64) NOT NULL,
        "expira_em" timestamptz NOT NULL,
        "revogada_em" timestamptz,
        "user_agent" varchar(255),
        "ip" varchar(64),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )`);
    await queryRunner.query(`CREATE INDEX "IDX_sessoes_usuario" ON "sessoes" ("usuario_id")`);

    await queryRunner.query(`
      CREATE TABLE "reunioes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "proprietario_id" uuid NOT NULL REFERENCES "usuarios"("id") ON DELETE RESTRICT,
        "titulo" varchar(200) NOT NULL,
        "assunto" varchar(200),
        "objetivo" text,
        "local" varchar(200),
        "status" varchar(20) NOT NULL DEFAULT 'AGENDADA'
          CHECK ("status" IN ('AGENDADA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA')),
        "inicio_previsto" timestamptz,
        "fim_previsto" timestamptz,
        "iniciada_em" timestamptz,
        "finalizada_em" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "CK_reunioes_periodo" CHECK ("fim_previsto" IS NULL OR "inicio_previsto" IS NULL OR "fim_previsto" > "inicio_previsto")
      )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_reunioes_proprietario_inicio" ON "reunioes" ("proprietario_id", "inicio_previsto")`,
    );

    await queryRunner.query(`
      CREATE TABLE "auditoria" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "usuario_id" uuid REFERENCES "usuarios"("id") ON DELETE SET NULL,
        "acao" varchar(80) NOT NULL,
        "entidade" varchar(60) NOT NULL,
        "entidade_id" uuid,
        "dados" jsonb,
        "ip" varchar(64),
        "created_at" timestamptz NOT NULL DEFAULT now()
      )`);
    await queryRunner.query(`CREATE INDEX "IDX_auditoria_entidade" ON "auditoria" ("entidade", "entidade_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_auditoria_usuario_data" ON "auditoria" ("usuario_id", "created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "auditoria"`);
    await queryRunner.query(`DROP TABLE "reunioes"`);
    await queryRunner.query(`DROP TABLE "sessoes"`);
    await queryRunner.query(`DROP TABLE "usuarios"`);
  }
}
