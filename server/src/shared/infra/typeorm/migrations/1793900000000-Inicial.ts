import { MigrationInterface, QueryRunner } from "typeorm";

export class Inicial1793900000000 implements MigrationInterface {
    name = 'Inicial1793900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "DIMIUSUARIO" ("codigo" numeric NOT NULL, "nome" character varying NOT NULL, "usuario" character varying NOT NULL, "senha" character varying NOT NULL, "ativo" character varying NOT NULL, "email" character varying NOT NULL, "nivelacesso" integer NOT NULL, "cpf" character varying NOT NULL, CONSTRAINT "PK_bce6e302c60a5ea65131966c9cf" PRIMARY KEY ("codigo"))`);
        await queryRunner.query(`CREATE TABLE "DIMIREUNIAO" ("id" uuid NOT NULL, "codusuario" numeric NOT NULL, "titulo" character varying(200) NOT NULL, "assunto" character varying(200), "objetivo" text, "local" character varying(200), "status" character varying(20) NOT NULL DEFAULT 'AGENDADA', "inicio_previsto" TIMESTAMP WITH TIME ZONE, "fim_previsto" TIMESTAMP WITH TIME ZONE, "iniciada_em" TIMESTAMP WITH TIME ZONE, "finalizada_em" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ffac448288bd5be5a05fe5ce6b5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_REUNIAO_USUARIO_INICIO" ON "DIMIREUNIAO" ("codusuario", "inicio_previsto") `);
        await queryRunner.query(`CREATE TABLE "DIMFEEDBACK" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tipo" character varying NOT NULL, "titulo" character varying NOT NULL, "mensagem" character varying NOT NULL, "pagina" character varying NOT NULL, "codusuario" numeric, "status" character varying(20) NOT NULL DEFAULT 'aberto', "resposta" text, "respondido_em" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_02cf1ff2542a5a7a0b42c0f85c6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "DIMIAVISOSEMAIL" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "codusuario" numeric NOT NULL, "tipo" character varying(30) NOT NULL, "dia" date NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f862f4c1d3cd6ac2c7f8a8fc356" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_509b10899742b70846c983739f" ON "DIMIAVISOSEMAIL" ("codusuario", "tipo", "dia") `);
        await queryRunner.query(`CREATE TABLE "DIMIAUDITORIA" ("id" uuid NOT NULL, "codusuario" numeric, "acao" character varying(80) NOT NULL, "entidade" character varying(60) NOT NULL, "entidade_id" uuid, "dados" jsonb, "ip" character varying(64), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_cc8cea4e3fd3831821aa7a35df0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_AUDITORIA_USUARIO_DATA" ON "DIMIAUDITORIA" ("codusuario", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_AUDITORIA_ENTIDADE" ON "DIMIAUDITORIA" ("entidade", "entidade_id") `);
        await queryRunner.query(`CREATE TABLE "DIMIVENDAS" ("id" character varying(80) NOT NULL, "codusuario" numeric NOT NULL, "gateway_assinatura_id" character varying(60), "ciclo" character varying(10), "valor" numeric(12,2) NOT NULL, "valor_liquido" numeric(12,2), "forma_pagamento" character varying(20), "status" character varying(20) NOT NULL DEFAULT 'paga', "vencimento" date, "pago_em" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_bb5273eb7785a099a8be45f4f04" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_66f1fd3d8b64a0925182e97fce" ON "DIMIVENDAS" ("codusuario") `);
        await queryRunner.query(`CREATE INDEX "IDX_901f63d32639e8370e367f95ba" ON "DIMIVENDAS" ("pago_em") `);
        await queryRunner.query(`CREATE TABLE "DIMIEVENTOSPAGAMENTO" ("id" character varying(80) NOT NULL, "evento" character varying(60) NOT NULL, "gateway_assinatura_id" character varying(60), "payload" jsonb NOT NULL, "recebido_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_95c512f88322e0c2bc3cb9746c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "DIMIASSINATURAS" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "codusuario" numeric NOT NULL, "plano" character varying(20) NOT NULL DEFAULT 'pro', "status" character varying(20) NOT NULL DEFAULT 'trial', "ciclo" character varying(10), "valor" numeric(12,2), "trial_fim" TIMESTAMP WITH TIME ZONE NOT NULL, "periodo_fim" TIMESTAMP WITH TIME ZONE, "gateway_cliente_id" character varying(60), "gateway_assinatura_id" character varying(60), "link_pagamento" character varying(300), "cancelada_em" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_5cc862210f02b403c6e453f07cf" UNIQUE ("codusuario"), CONSTRAINT "PK_fcf01aa57a40c0fe0dea539743c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_de14be54c71d64455dbb4ca60d" ON "DIMIASSINATURAS" ("gateway_assinatura_id") `);
        await queryRunner.query(`CREATE TABLE "DIMISESSAO" ("id" uuid NOT NULL, "codusuario" numeric NOT NULL, "refresh_hash" character varying(64) NOT NULL, "expira_em" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_3c9d0922a6e2b458d5499c2e610" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "DIMIRECUPERACAOSENHA" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "codusuario" numeric NOT NULL, "token_hash" character varying(64) NOT NULL, "expira_em" TIMESTAMP WITH TIME ZONE NOT NULL, "usado_em" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4fee48fda8e701d30a511adf596" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_DIMISESSAO_usuario" ON "DIMISESSAO" ("codusuario")`);
        await queryRunner.query(`CREATE INDEX "IDX_DIMIRECUPERACAOSENHA_token" ON "DIMIRECUPERACAOSENHA" ("token_hash")`);
        await queryRunner.query(`ALTER TABLE "DIMIREUNIAO" ADD CONSTRAINT "CK_REUNIAO_STATUS" CHECK ("status" IN ('AGENDADA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA'))`);
        await queryRunner.query(`ALTER TABLE "DIMIREUNIAO" ADD CONSTRAINT "CK_REUNIAO_PERIODO" CHECK ("fim_previsto" IS NULL OR "inicio_previsto" IS NULL OR "fim_previsto" > "inicio_previsto")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "DIMIRECUPERACAOSENHA"`);
        await queryRunner.query(`DROP TABLE "DIMISESSAO"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_de14be54c71d64455dbb4ca60d"`);
        await queryRunner.query(`DROP TABLE "DIMIASSINATURAS"`);
        await queryRunner.query(`DROP TABLE "DIMIEVENTOSPAGAMENTO"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_901f63d32639e8370e367f95ba"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_66f1fd3d8b64a0925182e97fce"`);
        await queryRunner.query(`DROP TABLE "DIMIVENDAS"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_AUDITORIA_ENTIDADE"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_AUDITORIA_USUARIO_DATA"`);
        await queryRunner.query(`DROP TABLE "DIMIAUDITORIA"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_509b10899742b70846c983739f"`);
        await queryRunner.query(`DROP TABLE "DIMIAVISOSEMAIL"`);
        await queryRunner.query(`DROP TABLE "DIMFEEDBACK"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_REUNIAO_USUARIO_INICIO"`);
        await queryRunner.query(`DROP TABLE "DIMIREUNIAO"`);
        await queryRunner.query(`DROP TABLE "DIMIUSUARIO"`);
    }

}
