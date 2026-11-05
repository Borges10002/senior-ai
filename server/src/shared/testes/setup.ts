// tsyringe usa metadados de decorators.
import "reflect-metadata";

process.env.APP_TIMEZONE = "America/Porto_Velho";
process.env.JWT_SECRET = process.env.JWT_SECRET || "segredo-de-teste-com-tamanho-suficiente-123";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "outro-segredo-de-teste-para-refresh-456";
