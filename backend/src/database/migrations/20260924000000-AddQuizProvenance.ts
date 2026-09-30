import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddQuizProvenance20260924000000 implements MigrationInterface {
  name = 'AddQuizProvenance20260924000000';

  private async addColumnIfMissing(queryRunner: QueryRunner, table: string, column: TableColumn) {
    if (!(await queryRunner.hasColumn(table, column.name))) {
      await queryRunner.addColumn(table, column);
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.addColumnIfMissing(queryRunner, 'quizzes', new TableColumn({ name: 'source', type: 'varchar', length: '32', default: "'manual'" }));
    await this.addColumnIfMissing(queryRunner, 'quizzes', new TableColumn({ name: 'ai_provider', type: 'varchar', length: '64', isNullable: true }));
    await this.addColumnIfMissing(queryRunner, 'quizzes', new TableColumn({ name: 'ai_model', type: 'varchar', length: '128', isNullable: true }));
    await this.addColumnIfMissing(queryRunner, 'quizzes', new TableColumn({ name: 'ai_generated_at', type: 'timestamp', isNullable: true }));
    await this.addColumnIfMissing(queryRunner, 'quizzes', new TableColumn({ name: 'reviewed_by_id', type: 'varchar', length: '36', isNullable: true }));
    await this.addColumnIfMissing(queryRunner, 'quizzes', new TableColumn({ name: 'reviewed_at', type: 'timestamp', isNullable: true }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const columnName of ['reviewed_at', 'reviewed_by_id', 'ai_generated_at', 'ai_model', 'ai_provider', 'source']) {
      if (await queryRunner.hasColumn('quizzes', columnName)) {
        await queryRunner.dropColumn('quizzes', columnName);
      }
    }
  }
}
