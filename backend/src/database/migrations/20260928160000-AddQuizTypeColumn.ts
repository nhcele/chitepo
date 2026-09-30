import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuizTypeColumn20260928160000 implements MigrationInterface {
  name = 'AddQuizTypeColumn20260928160000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(
      `SELECT COUNT(*) AS count
         FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'quizzes'
          AND COLUMN_NAME = 'type'`,
    );
    if (Number(count) === 0) {
      await queryRunner.query(`
        ALTER TABLE quizzes
        ADD COLUMN type ENUM('lesson', 'knowledge_check', 'module') NOT NULL DEFAULT 'lesson'
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(
      `SELECT COUNT(*) AS count
         FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'quizzes'
          AND COLUMN_NAME = 'type'`,
    );
    if (Number(count) > 0) {
      await queryRunner.query(`ALTER TABLE quizzes DROP COLUMN type`);
    }
  }
}
