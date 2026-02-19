import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddQuizAttemptTimeSpentSeconds1760000000001 implements MigrationInterface {
  name = 'AddQuizAttemptTimeSpentSeconds1760000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('quiz_attempts');
    const hasColumn = table?.columns.some((col) => col.name === 'time_spent_seconds');
    if (hasColumn) return;

    await queryRunner.addColumn(
      'quiz_attempts',
      new TableColumn({
        name: 'time_spent_seconds',
        type: 'int',
        isNullable: false,
        default: 0,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('quiz_attempts');
    const hasColumn = table?.columns.some((col) => col.name === 'time_spent_seconds');
    if (!hasColumn) return;
    await queryRunner.dropColumn('quiz_attempts', 'time_spent_seconds');
  }
}
