import { QueryRunner } from "typeorm";
import { DataSource } from "typeorm";

export default class TransactionDB {
  private queryRunner: QueryRunner;

  constructor(private dataSource: DataSource) { }

  async execute<T>(repositoryClass: any, callback: (repository: T) => Promise<T>): Promise<T> {

    this.queryRunner = this.dataSource.createQueryRunner();
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();

    try {
      const result = await callback(repositoryClass);

      await this.queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await this.queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await this.queryRunner.release();
    }
  }
}
