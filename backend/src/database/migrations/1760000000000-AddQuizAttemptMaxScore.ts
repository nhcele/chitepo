import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddQuizAttemptMaxScore1760000000000 implements MigrationInterface {
  name = 'AddQuizAttemptMaxScore1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('quiz_attempts');
    const hasColumn = table?.columns.some((col) => col.name === 'max_score');
    if (hasColumn) return;

    await queryRunner.addColumn(
      'quiz_attempts',
      new TableColumn({
        name: 'max_score',
        type: 'decimal',
        precision: 5,
        scale: 2,
        isNullable: false,
        default: 0,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('quiz_attempts');
    const hasColumn = table?.columns.some((col) => col.name === 'max_score');
    if (!hasColumn) return;
    await queryRunner.dropColumn('quiz_attempts', 'max_score');
  }
}
