import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddQuizSettingsFields1741300000001 implements MigrationInterface {
  name = 'AddQuizSettingsFields1741300000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = 'quizzes';

    const randomizeExists = await queryRunner.hasColumn(table, 'randomize_questions');
    if (!randomizeExists) {
      await queryRunner.addColumn(
        table,
        new TableColumn({ name: 'randomize_questions', type: 'boolean', default: false }),
      );
    }

    const cooldownExists = await queryRunner.hasColumn(table, 'retake_cooldown_hours');
    if (!cooldownExists) {
      await queryRunner.addColumn(
        table,
        new TableColumn({ name: 'retake_cooldown_hours', type: 'int', default: 24 }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = 'quizzes';

    const cooldownExists = await queryRunner.hasColumn(table, 'retake_cooldown_hours');
    if (cooldownExists) {
      await queryRunner.dropColumn(table, 'retake_cooldown_hours');
    }

    const randomizeExists = await queryRunner.hasColumn(table, 'randomize_questions');
    if (randomizeExists) {
      await queryRunner.dropColumn(table, 'randomize_questions');
    }
  }
}
