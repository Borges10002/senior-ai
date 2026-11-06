// Importado primeiro pelos scripts de manutenção: conectam sem alterar a
// estrutura do banco (synchronize) nem aplicar migrations, mexendo só nos dados.
process.env.DB_SYNCHRONIZE = "false";
process.env.DB_MIGRATIONS_RUN = "false";

export {};
