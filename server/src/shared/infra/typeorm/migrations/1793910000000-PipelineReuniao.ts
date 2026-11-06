import { MigrationInterface, QueryRunner } from "typeorm";

export class PipelineReuniao1793910000000 implements MigrationInterface {
    name = 'PipelineReuniao1793910000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "DIMITRANSCRICAOSEGMENTO" ("id" uuid NOT NULL, "gravacao_id" uuid NOT NULL, "codusuario" numeric NOT NULL, "ordem" integer NOT NULL, "inicio_seg" real NOT NULL, "fim_seg" real NOT NULL, "texto" text NOT NULL, CONSTRAINT "PK_dc34a9eb88244c5020a3ce3056f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_SEGMENTO_GRAVACAO_ORDEM" ON "DIMITRANSCRICAOSEGMENTO" ("gravacao_id", "ordem") `);
        await queryRunner.query(`CREATE TABLE "DIMIGRAVACAO" ("id" uuid NOT NULL, "reuniao_id" uuid NOT NULL, "codusuario" numeric NOT NULL, "chave" character varying(300) NOT NULL, "mime" character varying(60) NOT NULL, "tamanho" bigint NOT NULL, "duracao_seg" integer, "consentimento_em" TIMESTAMP WITH TIME ZONE NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'ENVIADA', "erro" character varying(300), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_54a5b7add539dda732b4cc7ec84" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_GRAVACAO_REUNIAO" ON "DIMIGRAVACAO" ("reuniao_id") `);
        await queryRunner.query(`CREATE TABLE "DIMIANOTACAO" ("id" uuid NOT NULL, "gravacao_id" uuid NOT NULL, "reuniao_id" uuid NOT NULL, "codusuario" numeric NOT NULL, "resumo" text NOT NULL, "assuntos" jsonb NOT NULL, "decisoes" jsonb NOT NULL, "tarefas" jsonb NOT NULL, "pendencias" jsonb NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_95b58c78c5ec3ea63e89f2bcd1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_ANOTACAO_GRAVACAO" ON "DIMIANOTACAO" ("gravacao_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ANOTACAO_REUNIAO" ON "DIMIANOTACAO" ("reuniao_id") `);
        await queryRunner.query(`CREATE TABLE "DIMIAGENDAMENTO" ("id" uuid NOT NULL, "gravacao_id" uuid NOT NULL, "reuniao_origem_id" uuid NOT NULL, "codusuario" numeric NOT NULL, "titulo" character varying(200) NOT NULL, "inicio" TIMESTAMP WITH TIME ZONE, "fim" TIMESTAMP WITH TIME ZONE, "participantes" jsonb NOT NULL, "status" character varying(20) NOT NULL, "reuniao_criada_id" uuid, "sugestao_inicio" TIMESTAMP WITH TIME ZONE, "horario_origem" character varying(12), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7eccd58d7ff404129db80ad44fb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_AGENDAMENTO_ORIGEM" ON "DIMIAGENDAMENTO" ("reuniao_origem_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_AGENDAMENTO_GRAVACAO" ON "DIMIAGENDAMENTO" ("gravacao_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_AGENDAMENTO_GRAVACAO"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_AGENDAMENTO_ORIGEM"`);
        await queryRunner.query(`DROP TABLE "DIMIAGENDAMENTO"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ANOTACAO_REUNIAO"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_ANOTACAO_GRAVACAO"`);
        await queryRunner.query(`DROP TABLE "DIMIANOTACAO"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_GRAVACAO_REUNIAO"`);
        await queryRunner.query(`DROP TABLE "DIMIGRAVACAO"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_SEGMENTO_GRAVACAO_ORDEM"`);
        await queryRunner.query(`DROP TABLE "DIMITRANSCRICAOSEGMENTO"`);
    }

}
