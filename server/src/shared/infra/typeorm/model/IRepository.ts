import { DataSource } from "typeorm";

interface IRepository {
  getDataSource(): DataSource;
}

export { IRepository };
