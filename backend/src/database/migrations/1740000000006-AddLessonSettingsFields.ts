import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLessonSettingsFields1740000000006 implements MigrationInterface {
  name = 'AddLessonSettingsFields1740000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = 'lessons';

    const hasQuizExists = await queryRunner.hasColumn(table, 'has_quiz');
    if (!hasQuizExists) {
      await queryRunner.addColumn(
        table,
        new TableColumn({ name: 'has_quiz', type: 'boolean', default: false }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = 'lessons';

    const hasQuizExists = await queryRunner.hasColumn(table, 'has_quiz');
    if (hasQuizExists) {
      await queryRunner.dropColumn(table, 'has_quiz');
    }
  }
}
